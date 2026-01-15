from unittest.mock import MagicMock
from models import WeeklyPlan, ChatRequest, ChatMessage
from datetime import date
import json

def test_propose_plan_success(test_agent):
    # Arrange
    expected_plan = {
        "week_start_date": str(date.today()),
        "goal": "Generated Goal",
        "workouts": []
    }
    mock_response = MagicMock()
    mock_response.text = json.dumps(expected_plan)
    # Mock the model that is already inside the agent
    test_agent.model.generate_content.return_value = mock_response

    # Act
    plan = test_agent.propose_plan()

    # Assert
    assert isinstance(plan, WeeklyPlan)
    assert plan.goal == "Generated Goal"
    test_agent.model.generate_content.assert_called_once()

def test_propose_plan_failure_fallback(test_agent):
    # Arrange
    test_agent.model.generate_content.side_effect = Exception("API Error")

    # Act
    plan = test_agent.propose_plan()

    # Assert
    assert isinstance(plan, WeeklyPlan)
    assert "(Mock)" in plan.goal  # Should fall back to MOCK_PLAN

def test_chat(test_agent):
    # Arrange
    current_plan = WeeklyPlan(week_start_date=str(date.today()), goal="Old Goal", workouts=[])
    request = ChatRequest(
        messages=[ChatMessage(role="user", content="How are my rows?")],
        current_plan=current_plan
    )
    
    chat_response_dict = {
        "message": "Your rows are progressing well!",
        "proposed_plan": None,
        "agent_persona": "Workout Specialist"
    }
    mock_response = MagicMock()
    mock_response.text = json.dumps(chat_response_dict)
    test_agent.model.generate_content.return_value = mock_response

    # Act
    result = test_agent.chat(request)

    # Assert
    assert result.message == "Your rows are progressing well!"
    assert result.agent_persona == "Workout Specialist"
    assert result.proposed_plan is None

def test_validate_plan(test_agent):
    # Arrange
    plan = WeeklyPlan(week_start_date=str(date.today()), goal="Test", workouts=[])
    
    validation_result = {"valid": False, "issues": ["Too much volume"]}
    mock_response = MagicMock()
    mock_response.text = json.dumps(validation_result)
    test_agent.model.generate_content.return_value = mock_response

    # Act
    result = test_agent.validate_plan(plan)

    # Assert
    assert result.valid is False
    assert "Too much volume" in result.issues

def test_agent_initialization_without_key():
    from agent.core import BiomeTeam
    import os
    from unittest.mock import patch
    
    with patch.dict(os.environ, {}, clear=True):
        agent = BiomeTeam()
        assert agent.model is None
