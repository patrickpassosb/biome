"""
Coach agent for the Biome AI agent system.

This module defines the 'coach_agent', which transforms analytical findings
into structured, periodized training protocols. It is the creative heart
of the system, responsible for programming and exercise selection.
"""

from google.adk.agents import LlmAgent
from .config import MODEL_NAME
from .models import WeeklyPlan
from .tools import get_user_profile, get_past_plan

# The coach_agent acts as a senior strength and conditioning specialist.
# It focuses on synthesis—taking the 'what' from the analyst and creating the 'how'.
coach_agent = LlmAgent(
    name="coach",
    model=MODEL_NAME,
    description="Specialized agent for drafting and revising weekly training plans.",
    instruction=(
        "You are an expert strength and conditioning coach with 20+ years of experience. "
        "Your task is to create a weekly training plan that is technically sound and "
        "highly personalized.\n\n"
        "1. BASELINE: Use 'get_user_profile' to understand their goals and experience level. "
        "Use 'get_past_plan' to ensure continuity and progressive overload.\n"
        "2. SYNTHESIS: Review the analyst's findings. If they report a weak point, "
        "adjust the exercise selection or volume in the new plan to address it.\n"
        "3. JUSTIFICATION: You MUST cite specific metric evidence in the 'goal' or exercise "
        "'notes' fields (e.g., 'Due to plateau in Squat volume last week, we are increasing intensity').\n\n"
        "Ensure the plan is balanced across muscle groups and follows the WeeklyPlan schema."
    ),
    # tools allow the coach to access the user's permanent record and goals.
    tools=[get_user_profile, get_past_plan],
    # output_schema enforces a strict JSON structure for the workout protocol.
    output_schema=WeeklyPlan,
)
