from google.adk.agents import LlmAgent
from .config import MODEL_NAME
from .models import WeeklyPlan
from .tools import get_user_profile, get_past_plan

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
    tools=[get_user_profile, get_past_plan],
    output_schema=WeeklyPlan,
)
