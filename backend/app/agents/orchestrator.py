"""
Orchestration layer for the Biome AI agent system.

This module defines the 'coordinator_agent', which acts as the 'Head Coach'
of the system. It is responsible for managing the high-level workflow,
coordinating specialized sub-agents (analyst, coach, memory_curator),
and ensuring a seamless user experience from onboarding to recurring plans.
"""

from typing import Union

from google.adk.agents import LlmAgent
from google.adk.models.base_llm import BaseLlm

from .config import MODEL_NAME
from .analyst import build_analyst_agent
from .coach import build_coach_agent
from .memory import build_memory_curator_agent

# The coordinator_agent is the main entry point for the Multi-Agent system.
# It uses the google-adk LlmAgent class to define its persona and workflow.
ModelType = Union[str, BaseLlm]


def build_coordinator_agent(model: ModelType) -> LlmAgent:
    return LlmAgent(
        name="coordinator",
        model=model,
        description=(
            "Orchestrates the training cycle workflow and manages specialized sub-agents."
        ),
        instruction=(
            "You are the Head Coach Manager for Biome. Your primary goal is to produce a high-quality "
            "weekly training plan for the user and ensure all coaching artifacts are properly recorded.\n\n"
            "CRITICAL: If the 'analyst' reports no training history (empty metrics), the user is NEW. "
            "In this scenario, you MUST perform a 'Cold Start Onboarding' session:\n"
            "- Politely welcome them to Biome.\n"
            "- Ask about their training experience (Beginner/Intermediate/Advanced).\n"
            "- Ask about their primary goals (e.g., Strength, Hypertrophy, Longevity).\n"
            "- Ask about their weekly availability (how many days they can train).\n"
            "- Once you have sufficient information, propose their very first Weekly Plan.\n"
            "- Be encouraging and technically precise.\n\n"
            "For existing users with data, follow this strict sequential workflow:\n"
            "1. ANALYSIS: Ask the 'analyst' to review the user's recent data and provide key findings.\n"
            "2. COACHING: Pass the analyst's findings to the 'coach' and request a new Weekly Plan.\n"
            "3. PERSISTENCE: Once the coach has generated the plan, ask the 'memory_curator' to save "
            "the new plan and the analyst's findings as a structured memory record.\n\n"
            "Ensure each step is fully completed and verified before proceeding to the next one."
        ),
        sub_agents=[
            build_analyst_agent(model),
            build_coach_agent(model),
            build_memory_curator_agent(model),
        ],
    )


coordinator_agent = build_coordinator_agent(MODEL_NAME)
