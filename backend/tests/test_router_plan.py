from models import WeeklyPlan, PlanValidationResult
from datetime import date

def test_propose_plan_endpoint(client, mock_agent_instance):
    # Arrange
    expected_plan = WeeklyPlan(
        week_start_date=str(date.today()),
        goal="API Test Goal",
        workouts=[]
    )
    mock_agent_instance.propose_plan.return_value = expected_plan

    # Act
    response = client.post("/plan/propose")

    # Assert
    assert response.status_code == 200
    assert response.json()["goal"] == "API Test Goal"
    mock_agent_instance.propose_plan.assert_called_once()

def test_revise_plan_endpoint(client, mock_agent_instance):
    # Arrange
    current_plan = WeeklyPlan(week_start_date=str(date.today()), goal="Old", workouts=[])
    revised_plan = WeeklyPlan(week_start_date=str(date.today()), goal="New", workouts=[])
    mock_agent_instance.revise_plan.return_value = revised_plan

    # Act
    response = client.post("/plan/revise", json={
        "current_plan": current_plan.model_dump(mode='json'),
        "feedback": "Change it"
    })

    # Assert
    assert response.status_code == 200
    assert response.json()["goal"] == "New"

def test_validate_plan_endpoint(client, mock_agent_instance):
    # Arrange
    plan = WeeklyPlan(week_start_date=str(date.today()), goal="Test", workouts=[])
    validation_result = PlanValidationResult(valid=True, issues=[])
    mock_agent_instance.validate_plan.return_value = validation_result

    # Act
    response = client.post("/plan/validate", json=plan.model_dump(mode='json'))

    # Assert
    assert response.status_code == 200
    assert response.json()["valid"] is True
