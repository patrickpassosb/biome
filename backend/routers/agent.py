"""
Router for AI agent interactions.

This module provides endpoints for real-time chat with the Biome coaching team.
It manages agent sessions and coordinates the execution of the multi-agent
runner using the google-adk framework.
"""

from fastapi import APIRouter
from models import ChatRequest, ChatResponse
from app.agents.orchestrator import coordinator_agent as agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

router = APIRouter(prefix="/agent", tags=["Agent"])

# --- Agent Runner Setup ---
# We define a persistent application name and a static user/session for the prototype.
APP_NAME = "biome_agent"
USER_ID = (
    "test_user"  # In a multi-tenant app, this would be derived from the auth token.
)
SESSION_ID = f"session_for_{USER_ID}"

# InMemorySessionService stores the conversation history in the server's RAM.
session_service = InMemorySessionService()

# The Runner orchestrates the execution of the coordinator agent.
runner = Runner(agent=agent, app_name=APP_NAME, session_service=session_service)


@router.on_event("startup")
async def startup_event():
    """
    Initializes the persistent agent session on application startup.
    This ensures that the conversation context is ready for the first request.
    """
    await session_service.create_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
    )


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

    # 2. TRANSFORM: Wrap the message in the format expected by google-genai.
    content = types.Content(role="user", parts=[types.Part(text=user_message)])

    # 3. EXECUTE: Run the multi-agent coordinator.
    # The runner manages the internal handoffs between Analyst and Coach agents.
    events = runner.run(user_id=USER_ID, session_id=SESSION_ID, new_message=content)

    # 4. PARSE: Identify the final text response from the stream of events.
    final_response = "No response from agent."
    for event in events:
        if event.is_final_response() and event.content and event.content.parts:
            final_response = event.content.parts[0].text.strip()

    return ChatResponse(message=final_response, agent_persona="Biome Coach")
