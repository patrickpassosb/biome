from google.adk.events import Event
from google.genai.types import Content, Part

def test_agent_chat_stateful(client, mock_adk_run):
    # Configure the mock to return different responses for sequential calls
    mock_adk_run.side_effect = [
        [Event(author="agent", content=Content(parts=[Part(text="I am a helpful assistant.")]))],
        [Event(author="agent", content=Content(parts=[Part(text="Your name is Jules.")]))],
    ]

    # First message
    chat_payload = {
        "messages": [{"role": "user", "content": "My name is Jules."}],
        "current_plan": {"week_start_date": "2023-01-01", "goal": "test", "workouts": []}
    }
    response = client.post("/agent/chat", json=chat_payload)
    assert response.status_code == 200

    # Second message
    chat_payload = {
        "messages": [{"role": "user", "content": "What is my name?"}],
        "current_plan": {"week_start_date": "2023-01-01", "goal": "test", "workouts": []}
    }
    response = client.post("/agent/chat", json=chat_payload)
    assert response.status_code == 200
    assert "Jules" in response.json()["message"]
