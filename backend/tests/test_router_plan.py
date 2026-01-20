"""
Integration tests for the Training Plan router.

These tests focus on the 'Coach' loop, including proposal generation,
feedback-driven revisions, and safety validation. It mocks the
underlying AI execution to ensure fast and deterministic results.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.fixture
def enable_llm():
    with patch("routers.plan.LLM_ENABLED", True):
        yield


@pytest.fixture
def mock_provider_agents():
    provider = MagicMock()
    provider.name = "public"
    provider.coordinator = MagicMock()
    provider.validator = MagicMock()
    with patch("routers.plan.PROVIDER_AGENTS", [provider]):
        yield provider


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


@pytest.fixture
def mock_collect_final_text():
    with patch("routers.plan.collect_final_text", new_callable=AsyncMock) as mock:
        yield mock


def test_propose_plan_success(
    client,
    enable_llm,
    mock_provider_agents,
    mock_runner,
    mock_session_service,
    mock_collect_final_text,
):
    valid_plan_json = (
        '{"week_start_date": "2023-01-15", "goal": "Test", "workouts": []}'
    )
    mock_collect_final_text.return_value = valid_plan_json

    response = client.post("/plan/propose")
    assert response.status_code == 200
    data = response.json()
    assert data["week_start_date"] == "2023-01-15"
    assert data["goal"] == "Test"


def test_propose_plan_invalid_json(
    client,
    enable_llm,
    mock_provider_agents,
    mock_runner,
    mock_session_service,
    mock_collect_final_text,
):
    mock_collect_final_text.return_value = "not valid json"

    response = client.post("/plan/propose")
    assert response.status_code == 502


def test_propose_plan_no_response(
    client,
    enable_llm,
    mock_provider_agents,
    mock_runner,
    mock_session_service,
    mock_collect_final_text,
):
    mock_collect_final_text.return_value = None

    response = client.post("/plan/propose")
    assert response.status_code == 502


def test_revise_plan_success(
    client,
    enable_llm,
    mock_provider_agents,
    mock_runner,
    mock_session_service,
    mock_collect_final_text,
):
    revised_plan_json = (
        '{"week_start_date": "2023-01-22", "goal": "Revised Goal", "workouts": []}'
    )
    mock_collect_final_text.return_value = revised_plan_json

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


def test_revise_plan_fallback(
    client,
    enable_llm,
    mock_provider_agents,
    mock_runner,
    mock_session_service,
    mock_collect_final_text,
):
    mock_collect_final_text.return_value = "bad"

    request_data = {
        "current_plan": {
            "week_start_date": "2023-01-15",
            "goal": "Original Goal",
            "workouts": [],
        },
        "feedback": "Make it better",
    }

    response = client.post("/plan/revise", json=request_data)
    assert response.status_code == 502


def test_validate_plan_success(
    client,
    enable_llm,
    mock_provider_agents,
    mock_runner,
    mock_session_service,
    mock_collect_final_text,
):
    valid_result_json = '{"valid": true, "issues": []}'
    mock_collect_final_text.return_value = valid_result_json

    plan_data = {"week_start_date": "2023-01-15", "goal": "Test Plan", "workouts": []}

    response = client.post("/plan/validate", json=plan_data)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True


def test_validate_plan_failure(
    client,
    enable_llm,
    mock_provider_agents,
    mock_runner,
    mock_session_service,
    mock_collect_final_text,
):
    mock_collect_final_text.return_value = None

    plan_data = {"week_start_date": "2023-01-15", "goal": "Test Plan", "workouts": []}

    response = client.post("/plan/validate", json=plan_data)
    assert response.status_code == 502
