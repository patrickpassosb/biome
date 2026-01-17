from google.adk.agents import LlmAgent
from .config import MODEL_NAME
from .models import CoachFindings
from .tools import get_gym_metrics, get_weight_history

analyst_agent = LlmAgent(
    name="analyst",
    model=MODEL_NAME,
    description="Analyzes training metrics to identify findings.",
    instruction=(
        "You are an expert sports data analyst. Analyze the provided gym metrics "
        "and identify key findings such as weak points, progress, consistency issues, "
        "or volume alerts. Ensure every finding is supported by the data."
    ),
    tools=[get_gym_metrics, get_weight_history],
    output_schema=CoachFindings,
)
