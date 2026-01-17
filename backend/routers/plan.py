"""
Router for AI training plan operations.

This module handles the core 'Coach' loop, allowing users to request
initial plans, revise them via chat feedback, and validate their safety.
It uses stateless ADK sessions to ensure high availability.
"""

import json
from fastapi import APIRouter
from models import WeeklyPlan, RevisePlanRequest, PlanValidationResult
from app.agents.orchestrator import coordinator_agent as agent
from app.agents.validator import validator_agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

router = APIRouter(prefix="/plan", tags=["Plan"])


@router.post("/propose", response_model=WeeklyPlan)
async def propose_plan():
    """
    Triggers the multi-agent coaching cycle to generate a new weekly plan.

    Flow: Coordinator -> Analyst (Data Check) -> Coach (Plan Draft) -> Return.
    """
    # Create a fresh, single-turn session for the proposal.
    session_service = InMemorySessionService()
    runner = Runner(
        agent=agent, app_name="biome_agent_plan", session_service=session_service
    )
    session_id = "plan_proposal_session"
    await session_service.create_session(
        app_name="biome_agent_plan", user_id="test_user", session_id=session_id
    )

    prompt = "Propose a new weekly training plan based on the user's data."
    content = types.Content(role="user", parts=[types.Part(text=prompt)])

    # The runner executes the Head Coach Manager agent and its sub-agents.
    events = runner.run(user_id="test_user", session_id=session_id, new_message=content)

    final_response = None
    for event in events:
        if event.is_final_response() and event.content and event.content.parts:
            final_response = event.content.parts[0].text.strip()

    if final_response:
        try:
            # Parse the LLM's raw text response into the WeeklyPlan model.
            plan_dict = json.loads(final_response)
            return WeeklyPlan(**plan_dict)
        except (json.JSONDecodeError, TypeError):
            # Fallback handled below if parsing fails.
            pass

    # Fallback or error response if the AI fails to produce a valid schema.
    return WeeklyPlan(
        week_start_date="2023-01-01",
        goal="Error: Could not generate plan.",
        workouts=[],
    )


@router.post("/revise", response_model=WeeklyPlan)
async def revise_plan(request: RevisePlanRequest):
    """
    Takes an existing plan and specific user instructions to create an updated version.

    Example feedback: 'I have a sore shoulder, replace bench press with flyes.'
    """
    session_service = InMemorySessionService()
    runner = Runner(
        agent=agent, app_name="biome_agent_revise", session_service=session_service
    )
    session_id = "plan_revision_session"
    await session_service.create_session(
        app_name="biome_agent_revise", user_id="test_user", session_id=session_id
    )

    # Injected state into the prompt to provide context to the agent.
    prompt = (
        f"Revise the following weekly training plan based on this feedback: '{request.feedback}'.\n\n"
        f"Current Plan:\n{request.current_plan.model_dump_json()}"
    )
    content = types.Content(role="user", parts=[types.Part(text=prompt)])

    events = runner.run(user_id="test_user", session_id=session_id, new_message=content)

    final_response = None
    for event in events:
        if event.is_final_response() and event.content and event.content.parts:
            final_response = event.content.parts[0].text.strip()

    if final_response:
        try:
            plan_dict = json.loads(final_response)
            return WeeklyPlan(**plan_dict)
        except (json.JSONDecodeError, TypeError):
            pass

    # Return the original plan if revision fails to maintain system stability.
    return request.current_plan


@router.post("/validate", response_model=PlanValidationResult)
async def validate_plan(plan: WeeklyPlan):
    """
    Invokes the Validator Agent to perform a safety audit on a training protocol.
    """
    session_service = InMemorySessionService()
    runner = Runner(
        agent=validator_agent,
        app_name="biome_agent_validate",
        session_service=session_service,
    )
    session_id = "plan_validation_session"
    await session_service.create_session(
        app_name="biome_agent_validate", user_id="test_user", session_id=session_id
    )

    # Send the plan as JSON to the validator for analysis.
    content = types.Content(role="user", parts=[types.Part(text=plan.model_dump_json())])

    events = runner.run(user_id="test_user", session_id=session_id, new_message=content)

    final_response = None
    for event in events:
        if event.is_final_response() and event.content and event.content.parts:
            final_response = event.content.parts[0].text.strip()

    if final_response:
        try:
            result_dict = json.loads(final_response)
            return PlanValidationResult(**result_dict)
        except (json.JSONDecodeError, TypeError):
            pass

    return PlanValidationResult(valid=False, issues=["Error: Could not validate plan."])
