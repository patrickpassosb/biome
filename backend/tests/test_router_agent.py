from unittest.mock import MagicMock, patch

def test_agent_chat_endpoint(client, mock_genai):
    # Setup mock response for Gemini
    mock_model_instance = MagicMock()
    mock_genai.GenerativeModel.return_value = mock_model_instance
    
    # Mock the return value of generate_content
    mock_response = MagicMock()
    mock_response.text = '{"message": "Keep pushing!", "agent_persona": "Workout Specialist", "proposed_plan": null}'
    mock_model_instance.generate_content.return_value = mock_response

    chat_payload = {
        "messages": [
            {"role": "user", "content": "How am I doing?"}
        ],
        "current_plan": {
            "week_start_date": "2023-01-01",
            "goal": "Gain strength",
            "workouts": []
        }
    }

    # We need to make sure the global agent in routers.agent is using the mocked model
    # The 'agent' fixture in conftest.py creates a NEW BiomeTeam, but routers.agent already has one.
    # So we patch the model on the existing agent instance in the router.
    with patch("routers.agent.agent.model", mock_model_instance), \
         patch("routers.agent.agent.api_key", "fake-key"):
        response = client.post("/agent/chat", json=chat_payload)
        
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Keep pushing!"
    assert data["agent_persona"] == "Workout Specialist"

def test_agent_chat_mock_mode(client):
    # Test when API key is missing (mock mode)
    with patch("routers.agent.agent.model", None):
        chat_payload = {
            "messages": [{"role": "user", "content": "Hi"}],
            "current_plan": {"week_start_date": "2023-01-01", "goal": "test", "workouts": []}
        }
        response = client.post("/agent/chat", json=chat_payload)
    
    assert response.status_code == 200
    assert "mock mode" in response.json()["message"]
