from google.adk.agents import LlmAgent
from .config import MODEL_NAME
from .schemas import COACH_FINDINGS_SCHEMA
from .tools import get_gym_metrics

analyst_agent = LlmAgent(
    name="analyst",
    model=MODEL_NAME,
    description="Analyzes training metrics to identify findings.",
    instruction=(
        "You are an expert sports data analyst. Analyze the provided gym metrics "
        "and identify key findings such as weak points, progress, consistency issues, "
        "or volume alerts. Ensure every finding is supported by the data."
    ),
    tools=[get_gym_metrics],
    output_schema=COACH_FINDINGS_SCHEMA
)
