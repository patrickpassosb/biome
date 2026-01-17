"""
Integration tests for the AI Agent Chat router.

These tests simulate a stateful conversation with the agent,
verifying that context is maintained across multiple round-trips.
"""

from google.adk.events import Event
from google.genai.types import Content, Part


def test_agent_chat_stateful(client, mock_adk_run):
    """
    Simulates a two-turn conversation to ensure session state works.

    1. Turn 1: User introduces themselves.
    2. Turn 2: User asks for their name.
    """
    # Configure the mock to return different responses for sequential calls.
    mock_adk_run.side_effect = [
        [
            Event(
                author="agent",
                content=Content(parts=[Part(text="I am a helpful assistant.")]),
            )
        ],
        [
            Event(
                author="agent",
                content=Content(parts=[Part(text="Your name is Jules.")]),
            )
        ],
    ]

    # TURN 1: User says name.
    chat_payload = {
        "messages": [{"role": "user", "content": "My name is Jules."}],
        "current_plan": {
            "week_start_date": "2023-01-01",
            "goal": "test",
            "workouts": [],
        },
    }
    response = client.post("/agent/chat", json=chat_payload)
    assert response.status_code == 200

    # TURN 2: User asks for name.
    chat_payload = {
        "messages": [{"role": "user", "content": "What is my name?"}],
        "current_plan": {
            "week_start_date": "2023-01-01",
            "goal": "test",
            "workouts": [],
        },
    }
    response = client.post("/agent/chat", json=chat_payload)
    assert response.status_code == 200
    # The session should have remembered "Jules" from the first turn.
    assert "Jules" in response.json()["message"]
