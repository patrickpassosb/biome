"""
Validator agent for the Biome AI agent system.

This module defines the 'validator_agent', which acts as a safety gate.
It reviews proposed training plans to ensure they are consistent, safe,
and follow established programming principles.
"""

from google.adk.agents import LlmAgent
from .config import MODEL_NAME
from .models import WeeklyPlan, PlanValidationResult

# The validator agent acts as a peer-reviewer for the Coach Agent.
# It has a high 'skepticism' and checks for edge cases like excessive volume.
validator_agent = LlmAgent(
    name="validator",
    model=MODEL_NAME,
    description="Safety and consistency auditor for training protocols.",
    instruction=(
        "You are a training validation expert. Your role is to find potential issues "
        "in the provided weekly training plan.\n\n"
        "CHECKLIST:\n"
        "- Volume: Is there excessive volume for a single session (>30 sets)?\n"
        "- Balance: Are any major muscle groups completely ignored?\n"
        "- Progression: Is the load increase unrealistic compared to past sessions?\n"
        "- Safety: Are high-injury-risk exercises programmed without proper context?\n\n"
        "If you find issues, provide a 'valid: false' status and a detailed list of 'issues'. "
        "If the plan is sound, return 'valid: true'."
    ),
    # input_schema allows the agent to directly ingest the WeeklyPlan model.
    input_schema=WeeklyPlan,
    # output_schema provides a structured pass/fail report.
    output_schema=PlanValidationResult,
)
