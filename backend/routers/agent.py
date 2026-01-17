"""
Router for AI agent interactions.

This module provides endpoints for real-time chat with the Biome coaching team.
It manages agent sessions and coordinates the execution of the multi-agent
runner using the google-adk framework.
"""

from fastapi import APIRouter
from models import ChatRequest, ChatResponse, calculate_age
from app.agents.orchestrator import coordinator_agent as agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.errors.already_exists_error import AlreadyExistsError
from google.genai import types
from bio.store import bio_store

router = APIRouter(prefix="/agent", tags=["Agent"])

# --- Agent Runner Setup ---
# We define a persistent application name and a static user/session for the prototype.
APP_NAME = "biome_agent"
USER_ID = "test_user"  # In a multi-tenant app, this would be derived from the auth token.
SESSION_ID = f"session_for_{USER_ID}"

# InMemorySessionService stores the conversation history in the server's RAM.
session_service = InMemorySessionService()

# The Runner orchestrates the execution of the coordinator agent.
runner = Runner(agent=agent, app_name=APP_NAME, session_service=session_service)


@router.on_event("startup")
async def startup_event():
    # Create a persistent session for the user at application startup
    try:
        await session_service.create_session(
            app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
        )
    except AlreadyExistsError:
        print(f"Session {SESSION_ID} already exists. Skipping creation.")


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Primary endpoint for chatting with the Biome AI.

    Takes a list of conversation history and the current state (WeeklyPlan),
    and returns the agent's natural language response along with any
    proposed plan updates.
    """
    # 1. EXTRACT: Get the most recent user input from the request.
    user_message = ""
    if request.messages and request.messages[-1].role == "user":
        user_message = request.messages[-1].content

    bio = bio_store.get_bio(USER_ID)
    bio_context = "User bio not set."
    if bio:
        computed_age = calculate_age(bio.date_of_birth)
        goals = ", ".join(bio.goals)
        bio_context = (
            "User bio: "
            f"sex={bio.sex}, "
            f"date_of_birth={bio.date_of_birth.isoformat()}, "
            f"age={computed_age}, "
            f"weight={bio.weight}{bio.weight_unit}, "
            f"goals={goals if goals else 'none'}."
        )

    # Prepare the message for the ADK runner
    content = types.Content(
        role="user", parts=[types.Part(text=f"{bio_context}\n\n{user_message}")]
    )

    # 3. EXECUTE: Run the multi-agent coordinator.
    # The runner manages the internal handoffs between Analyst and Coach agents.
    events = runner.run(user_id=USER_ID, session_id=SESSION_ID, new_message=content)

    # 4. PARSE: Identify the final text response from the stream of events.
    final_response = "No response from agent."
    for event in events:
        if event.is_final_response() and event.content and event.content.parts:
            final_response = event.content.parts[0].text.strip()

    return ChatResponse(message=final_response, agent_persona="Biome Coach")
