from unittest.mock import patch, MagicMock, AsyncMock
import pytest


@pytest.fixture
def mock_runner():
    with patch("routers.plan.Runner") as mock:
        yield mock


@pytest.fixture
def mock_session_service():
    with patch("routers.plan.InMemorySessionService") as mock:
        mock_instance = MagicMock()
        mock_instance.create_session = AsyncMock()
        mock.return_value = mock_instance
        yield mock


class MockEvent:
    def __init__(self, is_final=False, text=None):
        self._is_final = is_final
        if text:
            self.content = MagicMock()
            self.content.parts = [MagicMock(text=text)]
        else:
            self.content = None

    def is_final_response(self):
        return self._is_final


def test_propose_plan_success(client, mock_runner, mock_session_service):
    valid_plan_json = (
        '{"week_start_date": "2023-01-15", "goal": "Test", "workouts": []}'
    )
    mock_runner.return_value.run.return_value = [
        MockEvent(is_final=True, text=valid_plan_json)
    ]

    response = client.post("/plan/propose")
    assert response.status_code == 200
    data = response.json()
    assert data["week_start_date"] == "2023-01-15"
    assert data["goal"] == "Test"


def test_propose_plan_invalid_json(client, mock_runner, mock_session_service):
    mock_runner.return_value.run.return_value = [
        MockEvent(is_final=True, text="not valid json")
    ]

    response = client.post("/plan/propose")
    assert response.status_code == 200
    data = response.json()
    assert "Error" in data["goal"]


def test_propose_plan_no_response(client, mock_runner, mock_session_service):
    mock_runner.return_value.run.return_value = [MockEvent(is_final=False)]

    response = client.post("/plan/propose")
    assert response.status_code == 200
    data = response.json()
    assert "Error" in data["goal"]


def test_revise_plan_success(client, mock_runner, mock_session_service):
    revised_plan_json = (
        '{"week_start_date": "2023-01-22", "goal": "Revised Goal", "workouts": []}'
    )
    mock_runner.return_value.run.return_value = [
        MockEvent(is_final=True, text=revised_plan_json)
    ]

    request_data = {
        "current_plan": {
            "week_start_date": "2023-01-15",
            "goal": "Original Goal",
            "workouts": [],
        },
        "feedback": "Add more upper body",
    }

    response = client.post("/plan/revise", json=request_data)
    assert response.status_code == 200
    data = response.json()
    assert data["goal"] == "Revised Goal"


def test_revise_plan_fallback(client, mock_runner, mock_session_service):
    mock_runner.return_value.run.return_value = [MockEvent(is_final=True, text="bad")]

    request_data = {
        "current_plan": {
            "week_start_date": "2023-01-15",
            "goal": "Original Goal",
            "workouts": [],
        },
        "feedback": "Make it better",
    }

    response = client.post("/plan/revise", json=request_data)
    assert response.status_code == 200
    data = response.json()
    assert data["goal"] == "Original Goal"


def test_validate_plan_success(client, mock_runner, mock_session_service):
    valid_result_json = '{"valid": true, "issues": []}'
    mock_runner.return_value.run.return_value = [
        MockEvent(is_final=True, text=valid_result_json)
    ]

    plan_data = {"week_start_date": "2023-01-15", "goal": "Test Plan", "workouts": []}

    response = client.post("/plan/validate", json=plan_data)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True


def test_validate_plan_failure(client, mock_runner, mock_session_service):
    mock_runner.return_value.run.return_value = [MockEvent(is_final=False)]

    plan_data = {"week_start_date": "2023-01-15", "goal": "Test Plan", "workouts": []}

    response = client.post("/plan/validate", json=plan_data)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert "Error" in data["issues"][0]
