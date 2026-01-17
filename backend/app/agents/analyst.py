"""
Analyst agent for the Biome AI agent system.

This module defines the 'analyst_agent', which is specialized in processing
raw gym metrics and body weight data to identify meaningful trends,
weak points, and progress indicators.
"""

from google.adk.agents import LlmAgent
from .config import MODEL_NAME
from .models import CoachFindings
from .tools import get_gym_metrics, get_weight_history

# The analyst_agent acts as a data scientist for strength training.
# It leverages internal tools to fetch data from the DuckDB analytics engine.
analyst_agent = LlmAgent(
    name="analyst",
    model=MODEL_NAME,
    description="Specialized agent for analyzing training metrics and weight history.",
    instruction=(
        "You are the Data Analyst for an elite performance system. Your role is to "
        "synthesize raw training data into actionable 'Findings' for the Coach. "
        "Focus strictly on Training Physics metrics: Volume Load (sets * reps * weight), "
        "Average RPE (Exertion), and Frequency consistency. "
        "You must explicitly tag findings as 'OVERLOAD OPPORTUNITY' (e.g., 'Squat volume stable for 3 weeks @ RPE 6 -> Increase Load') "
        "or 'STALL WARNING' (e.g., 'Bench Press intensity regression'). "
        "Provide precise numbers to support every finding."
    ),
    # tools provide the agent with 'eyes' into the application state/database.
    tools=[get_gym_metrics, get_weight_history],
    # output_schema ensures the LLM's response can be parsed into a Pydantic model.
    output_schema=CoachFindings,
)
