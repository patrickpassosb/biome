from google.adk.agents import LlmAgent
from .config import MODEL_NAME
from .models import WeeklyPlan
from .tools import get_user_profile, get_past_plan

coach_agent = LlmAgent(
    name="coach",
    model=MODEL_NAME,
    description="Proposes and revises weekly training plans.",
    instruction=(
        "You are an expert strength and conditioning coach. Create a weekly training plan "
        "based on the user's profile, past plan, and the analyst's findings. "
        "You MUST cite specific metric evidence (e.g., 'Due to low volume load last week...') "
        "in the 'goal' or exercise 'notes' fields to justify your decisions."
    ),
    tools=[get_user_profile, get_past_plan],
    output_schema=WeeklyPlan
)
