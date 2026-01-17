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
    # This is a simplified, stateless implementation for a single-turn plan proposal.
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

    events = runner.run(user_id="test_user", session_id=session_id, new_message=content)

    final_response = None
    for event in events:
        if event.is_final_response() and event.content and event.content.parts:
            final_response = event.content.parts[0].text.strip()

    if final_response:
        try:
            # The agent should return a JSON representation of the WeeklyPlan
            plan_dict = json.loads(final_response)
            return WeeklyPlan(**plan_dict)
        except (json.JSONDecodeError, TypeError):
            # If the response is not valid JSON, we can't create a plan.
            # In a real app, you'd want more robust error handling here.
            pass

    # Fallback or error response
    return WeeklyPlan(
        week_start_date="2023-01-01",
        goal="Error: Could not generate plan.",
        workouts=[],
    )


@router.post("/revise", response_model=WeeklyPlan)
async def revise_plan(request: RevisePlanRequest):
    # This is a simplified, stateless implementation for a single-turn plan revision.
    session_service = InMemorySessionService()
    runner = Runner(
        agent=agent, app_name="biome_agent_revise", session_service=session_service
    )
    session_id = "plan_revision_session"
    await session_service.create_session(
        app_name="biome_agent_revise", user_id="test_user", session_id=session_id
    )

    prompt = (
        f"Revise the following weekly training plan based on this feedback: '{request.feedback}'.\n\n"
        f"Current Plan:\n{request.current_plan.json()}"
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

    # Fallback to returning the original plan if revision fails
    return request.current_plan


@router.post("/validate", response_model=PlanValidationResult)
async def validate_plan(plan: WeeklyPlan):
    # This is a simplified, stateless implementation for a single-turn plan validation.
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

    # The validator agent expects the plan as a JSON string in the input.
    content = types.Content(role="user", parts=[types.Part(text=plan.json())])

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

    # Fallback or error response
    return PlanValidationResult(valid=False, issues=["Error: Could not validate plan."])
