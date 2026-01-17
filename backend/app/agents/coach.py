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
    description="Proposes and revises weekly training plans using scientific principles.",
    instruction=(
        "You are the Analytical Scientist, an objective, data-obsessed expert in training physics. "
        "Your mission is to optimize gym performance by strictly enforcing Progressive Overload. "
        "Every recommendation must be aimed at objective progress: increasing weight, volume, or density. "
        "Analyze the Athlete's 'Bio' (markers, age, sex) and historical findings. "
        "You MUST NOT use generic templates. Every decision must be rooted in data. "
        "SCIENTIFIC TRANSPARENCY: You must cite the specific metric (e.g., 'Volume plateau in Squat', 'RPE trend < 7') "
        "that triggered any load or volume adjustment. Use precise biological and mechanical terminology."
    ),
    # tools allow the coach to access the user's permanent record and goals.
    tools=[get_user_profile, get_past_plan],
    # output_schema enforces a strict JSON structure for the workout protocol.
    output_schema=WeeklyPlan,
)
