"""
Router for AI agent interactions.

This module provides endpoints for real-time chat with the Biome coaching team.
It manages agent sessions and coordinates the execution of the multi-agent
runner using the google-adk framework.
"""

import asyncio
import logging
import time
from dataclasses import dataclass
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from google.adk.errors.already_exists_error import AlreadyExistsError
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import errors, types

from app.agents.config import APP_NAME, USER_ID, LLM_ENABLED
from app.agents.providers import PROVIDER_AGENTS
from app.agents.runner_utils import collect_final_text
from models import ChatRequest, ChatResponse
from user_profile import profile_store

router = APIRouter(prefix="/agent", tags=["Agent"])
logger = logging.getLogger(__name__)
LLM_BACKOFF_SECONDS = 300
RUN_TIMEOUT_SECONDS = 45


# --- Agent Runner Setup ---
# We define a persistent application name and a static user/session for the prototype.
SESSION_ID = f"session_for_{USER_ID}"

# InMemorySessionService stores the conversation history in the server's RAM.
session_service = InMemorySessionService()


@dataclass(frozen=True)
class ProviderRunner:
    name: str
    runner: Runner


provider_runners: List[ProviderRunner] = [
    ProviderRunner(
        name=provider.name,
        runner=Runner(
            agent=provider.coordinator,
            app_name=APP_NAME,
            session_service=session_service,
        ),
    )
    for provider in PROVIDER_AGENTS
]
provider_disabled_until = {provider.name: 0.0 for provider in provider_runners}


@router.on_event("startup")
async def startup_event():
    """
    Initializes the persistent agent session on application startup.
    This ensures that the conversation context is ready for the first request.
    """
    # Context7: https://context7.com/google/adk-python/llms.txt
    sessions = await session_service.list_sessions(app_name=APP_NAME, user_id=USER_ID)
    existing_ids = set()
    for session in sessions:
        if hasattr(session, "id"):
            existing_ids.add(session.id)
        elif isinstance(session, (list, tuple)):
            if SESSION_ID in session:
                existing_ids.add(SESSION_ID)
            elif session:
                existing_ids.add(session[0])
    if SESSION_ID in existing_ids:
        return
    try:
        await session_service.create_session(
            app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
        )
    except AlreadyExistsError:
        # The session was already created during a prior startup cycle; safe to continue.
        return


async def _run_with_fallback(content: types.Content) -> Optional[str]:
    if not provider_runners:
        return None
    for provider in provider_runners:
        disabled_until = provider_disabled_until.get(provider.name, 0.0)
        if time.time() < disabled_until:
            continue
        try:
            response = await asyncio.wait_for(
                collect_final_text(
                    provider.runner,
                    user_id=USER_ID,
                    session_id=SESSION_ID,
                    content=content,
                ),
                timeout=RUN_TIMEOUT_SECONDS,
            )
            if response:
                return response
        except asyncio.TimeoutError:
            logger.exception(
                "Agent run timed out after %ss (provider=%s)",
                RUN_TIMEOUT_SECONDS,
                provider.name,
            )
        except errors.APIError as err:
            logger.exception(
                "Agent run failed (provider=%s)",
                provider.name,
                exc_info=err,
            )
            if err.code == 429:
                provider_disabled_until[provider.name] = (
                    time.time() + LLM_BACKOFF_SECONDS
                )
        except Exception as err:
            logger.exception(
                "Agent run failed (provider=%s)",
                provider.name,
                exc_info=err,
            )
    return None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Primary endpoint for chatting with the Biome AI.

    Takes a list of conversation history and the current state (WeeklyPlan),
    and returns the agent's natural language response along with any
    proposed plan updates.
    """
    user_profile = profile_store.get_profile(USER_ID)

    profile_context = ""
    if user_profile:
        profile_dict = user_profile.model_dump()
        profile_context = f"""
User Profile Context:
- Name: {profile_dict.get("name") or "Not set"}
- Bio: {profile_dict.get("bio") or "Not set"}
- Sex: {profile_dict.get("sex") or "Not set"}
- Age: {profile_dict.get("age") or "Not set"}
- Primary Goal: {profile_dict.get("goal") or "Not set"}
- Experience Level: {profile_dict.get("experience_level") or "Not set"}

"""

    user_message = ""
    if request.messages and request.messages[-1].role == "user":
        user_message = request.messages[-1].content

    full_message = profile_context + f"\n\nUser: {user_message}"

    if not LLM_ENABLED or not provider_runners:
        raise HTTPException(
            status_code=503,
            detail="Agent LLM is disabled or not configured. Set AGENT_ENABLE_LLM=1 and configure Gemini/Vertex credentials.",
        )

    content = types.Content(role="user", parts=[types.Part(text=full_message)])
    response = await _run_with_fallback(content)
    if not response:
        raise HTTPException(
            status_code=502,
            detail="Agent execution failed to return a response. Check Gemini/Vertex credentials and quotas.",
        )

    return ChatResponse(message=response, agent_persona="Biome Coach")
