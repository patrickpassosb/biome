from google.adk.agents import LlmAgent
from .config import MODEL_NAME
from .models import CoachFindings
from .tools import get_gym_metrics, get_weight_history

analyst_agent = LlmAgent(
    name="analyst",
    model=MODEL_NAME,
    description="Analyzes training metrics to identify findings.",
    instruction=(
        "You are the Data Analyst for an elite performance system. Your role is to "
        "synthesize raw training data into actionable 'Findings' for the Coach. "
        "Focus strictly on Training Physics metrics: Volume Load (sets * reps * weight), "
        "Average RPE (Exertion), and Frequency consistency. "
        "You must explicitly tag findings as 'OVERLOAD OPPORTUNITY' (e.g., 'Squat volume stable for 3 weeks @ RPE 6 -> Increase Load') "
        "or 'STALL WARNING' (e.g., 'Bench Press intensity regression'). "
        "Provide precise numbers to support every finding."
    ),
    tools=[get_gym_metrics, get_weight_history],
    output_schema=CoachFindings,
)
