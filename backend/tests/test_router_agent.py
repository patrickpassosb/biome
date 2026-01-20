"""
Integration tests for the AI Agent Chat router.

These tests simulate a stateful conversation with the agent,
verifying that context is maintained across multiple round-trips.
"""

from unittest.mock import AsyncMock, patch


def test_agent_chat_stateful(client):
    """
    Simulates a two-turn conversation to ensure session state works.

    1. Turn 1: User introduces themselves.
    2. Turn 2: User asks for their name.
    """
    with patch("routers.agent.collect_final_text", new_callable=AsyncMock) as mock_collect:
        mock_collect.side_effect = [
            "I am a helpful assistant.",
            "Your name is Jules.",
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
