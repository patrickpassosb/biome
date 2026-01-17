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
        "You are an expert sports data analyst. Your job is to transform raw training data "
        "into actionable coaching insights.\n\n"

        "1. DATA RETRIEVAL: Use 'get_gym_metrics' to see recent training trends and "
        "'get_weight_history' to see body composition changes.\n"
        "2. ANALYSIS: Identify key findings such as:\n"
        "   - Weak Points: Exercises or muscle groups where progress has stalled.\n"
        "   - Progress: Significant increases in volume or intensity.\n"
        "   - Consistency: Issues with training frequency.\n"
        "   - Volume Alerts: Dangerously high or low volume compared to the previous week.\n\n"

        "3. JUSTIFICATION: Every finding you report MUST be supported by specific numbers "
        "from the retrieved data (e.g., 'Bench press volume dropped by 15%').\n\n"

        "Format your output according to the CoachFindings schema."
    ),
    # tools provide the agent with 'eyes' into the application state/database.
    tools=[get_gym_metrics, get_weight_history],
    # output_schema ensures the LLM's response can be parsed into a Pydantic model.
    output_schema=CoachFindings,
)
