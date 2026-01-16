from google.adk.agents import LlmAgent
from .config import MODEL_NAME
from .models import WeeklyPlan, PlanValidationResult

validator_agent = LlmAgent(
    name="validator",
    model=MODEL_NAME,
    description="Validates a weekly training plan.",
    instruction=(
        "You are a validation expert. Analyze the provided weekly training plan "
        "for any issues, such as excessive volume, poor exercise selection, or "
        "unrealistic progression. Provide a 'valid' status and a list of issues "
        "if any are found."
    ),
    input_schema=WeeklyPlan,
    output_schema=PlanValidationResult
)
