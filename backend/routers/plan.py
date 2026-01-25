"""
Router for AI training plan operations.

This module handles the core 'Coach' loop, allowing users to request
initial plans, revise them via chat feedback, and validate their safety.
It uses stateless ADK sessions to ensure high availability.
"""

import asyncio
import json
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException
from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import errors, types

from app.agents.config import APP_NAME, USER_ID, LLM_ENABLED
from app.agents.monitoring import (
    build_app,
    clear_request_context,
    get_request_context,
    start_request_context,
)
from app.agents.providers import PROVIDER_AGENTS
from app.agents.runner_utils import collect_final_text
from models import WeeklyPlan, RevisePlanRequest, PlanValidationResult

router = APIRouter(prefix="/plan", tags=["Plan"])
logger = logging.getLogger(__name__)
RUN_TIMEOUT_SECONDS = 45


async def _run_with_provider(
    agent: LlmAgent,
    session_id: str,
    prompt: str,
) -> Optional[str]:
    session_service = InMemorySessionService()
    runner = Runner(
        app=build_app(agent, APP_NAME),
        session_service=session_service,
    )
    await session_service.create_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=session_id
    )
    content = types.Content(role="user", parts=[types.Part(text=prompt)])
    return await asyncio.wait_for(
        collect_final_text(
            runner,
            user_id=USER_ID,
            session_id=session_id,
            content=content,
        ),
        timeout=RUN_TIMEOUT_SECONDS,
    )


async def _run_with_fallback(
    prompt: str,
    session_id_prefix: str,
    use_validator: bool,
    *,
    request_id: str,
    endpoint: str,
) -> Optional[str]:
    total_calls = 0
    final_response = None
    for provider in PROVIDER_AGENTS:
        agent = provider.validator if use_validator else provider.coordinator
        session_id = f"{session_id_prefix}_{provider.name}"
        start_request_context(
            request_id=request_id,
            endpoint=endpoint,
            provider=provider.name,
            session_id=session_id,
        )
        try:
            response = await _run_with_provider(agent, session_id, prompt)
            if response:
                final_response = response
                break
        except asyncio.TimeoutError:
            logger.exception(
                "Plan run timed out after %ss (provider=%s)",
                RUN_TIMEOUT_SECONDS,
                provider.name,
            )
        except errors.APIError as err:
            logger.exception(
                "Plan run failed (provider=%s)",
                provider.name,
                exc_info=err,
            )
        except Exception as err:
            logger.exception(
                "Plan run failed (provider=%s)",
                provider.name,
                exc_info=err,
            )
        finally:
            context = get_request_context()
            if context:
                total_calls += context.model_calls
                models = sorted(context.models)
                logger.warning(
                    "LLM request summary (request_id=%s endpoint=%s provider=%s session_id=%s model_calls=%s models=%s)",
                    context.request_id,
                    context.endpoint,
                    context.provider,
                    context.session_id,
                    context.model_calls,
                    ",".join(models) if models else "unknown",
                )
            clear_request_context()
    if total_calls:
        logger.warning(
            "LLM request total (request_id=%s endpoint=%s model_calls=%s)",
            request_id,
            endpoint,
            total_calls,
        )
    return final_response


@router.post("/propose", response_model=WeeklyPlan)
async def propose_plan():
    """
    Triggers the multi-agent coaching cycle to generate a new weekly plan.

    Flow: Coordinator -> Analyst (Data Check) -> Coach (Plan Draft) -> Return.
    """
    if not LLM_ENABLED or not PROVIDER_AGENTS:
        raise HTTPException(
            status_code=503,
            detail="Plan generation is disabled. Set AGENT_ENABLE_LLM=1 and configure Gemini/Vertex credentials.",
        )
    prompt = "Propose a new weekly training plan based on the user's data."
    request_id = uuid.uuid4().hex[:10]

    final_response = await _run_with_fallback(
        prompt=prompt,
        session_id_prefix="plan_proposal_session",
        use_validator=False,
        request_id=request_id,
        endpoint="POST /plan/propose",
    )

    if final_response:
        try:
            plan_dict = json.loads(final_response)
            return WeeklyPlan(**plan_dict)
        except (json.JSONDecodeError, TypeError):
            raise HTTPException(
                status_code=502,
                detail="Plan generation returned invalid JSON from the LLM.",
            )

    raise HTTPException(
        status_code=502,
        detail="Plan generation failed to return a response from the LLM.",
    )


@router.post("/revise", response_model=WeeklyPlan)
async def revise_plan(request: RevisePlanRequest):
    """
    Takes an existing plan and specific user instructions to create an updated version.

    Example feedback: 'I have a sore shoulder, replace bench press with flyes.'
    """
    if not LLM_ENABLED or not PROVIDER_AGENTS:
        raise HTTPException(
            status_code=503,
            detail="Plan revision is disabled. Set AGENT_ENABLE_LLM=1 and configure Gemini/Vertex credentials.",
        )

    # Injected state into the prompt to provide context to the agent.
    prompt = (
        f"Revise the following weekly training plan based on this feedback: '{request.feedback}'.\n\n"
        f"Current Plan:\n{request.current_plan.model_dump_json()}"
    )
    request_id = uuid.uuid4().hex[:10]
    final_response = await _run_with_fallback(
        prompt=prompt,
        session_id_prefix="plan_revision_session",
        use_validator=False,
        request_id=request_id,
        endpoint="POST /plan/revise",
    )

    if final_response:
        try:
            plan_dict = json.loads(final_response)
            return WeeklyPlan(**plan_dict)
        except (json.JSONDecodeError, TypeError):
            raise HTTPException(
                status_code=502,
                detail="Plan revision returned invalid JSON from the LLM.",
            )

    raise HTTPException(
        status_code=502,
        detail="Plan revision failed to return a response from the LLM.",
    )


@router.post("/validate", response_model=PlanValidationResult)
async def validate_plan(plan: WeeklyPlan):
    """
    Invokes the Validator Agent to perform a safety audit on a training protocol.
    """
    if not LLM_ENABLED or not PROVIDER_AGENTS:
        raise HTTPException(
            status_code=503,
            detail="Plan validation is disabled. Set AGENT_ENABLE_LLM=1 and configure Gemini/Vertex credentials.",
        )
    prompt = plan.model_dump_json()
    request_id = uuid.uuid4().hex[:10]
    final_response = await _run_with_fallback(
        prompt=prompt,
        session_id_prefix="plan_validation_session",
        use_validator=True,
        request_id=request_id,
        endpoint="POST /plan/validate",
    )

    if final_response:
        try:
            result_dict = json.loads(final_response)
            return PlanValidationResult(**result_dict)
        except (json.JSONDecodeError, TypeError):
            raise HTTPException(
                status_code=502,
                detail="Plan validation returned invalid JSON from the LLM.",
            )

    raise HTTPException(
        status_code=502,
        detail="Plan validation failed to return a response from the LLM.",
    )
