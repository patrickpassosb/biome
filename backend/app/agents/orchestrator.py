"""
Orchestration layer for the Biome AI agent system.

This module defines the 'coordinator_agent', which acts as the 'Head Coach'
of the system. It is responsible for managing the high-level workflow,
coordinating specialized sub-agents (analyst, coach, memory_curator),
and ensuring a seamless user experience from onboarding to recurring plans.
"""

from google.adk.agents import LlmAgent
from .config import MODEL_NAME
from .analyst import analyst_agent
from .coach import coach_agent
from .memory import memory_curator_agent

# The coordinator_agent is the main entry point for the Multi-Agent system.
# It uses the google-adk LlmAgent class to define its persona and workflow.
coordinator_agent = LlmAgent(
    name="coordinator",
    model=MODEL_NAME,
    description="Orchestrates the training cycle workflow and manages specialized sub-agents.",
    instruction=(
        "You are the System Orchestrator for the Biome Intelligence Platform. "
        "Your goal is to execute a rigorous, data-driven optimization cycle for the athlete.\n"
        "IMPORTANT: If the 'analyst' reports no training history, the user is NEW. "
        "Perform 'Cold Start Onboarding': gather experience, goals, and availability, then propose the FIRST Weekly Plan.\n\n"
        "Follow this strict Scientific Workflow:\n"
        "1. TRIGGER ANALYST: Ask the 'analyst' to calculate Volume/RPE trends and identify Overload Opportunities.\n"
        "2. TRIGGER COACH: Pass the Analyst's precise findings to the 'coach'. Command the coach to generate a Weekly Plan "
        "that specifically addresses the identified opportunities or stall warnings.\n"
        "3. PERSIST DATA: Ask 'memory_curator' to store the Plan and Findings as a permanent record.\n"
        "Ensure high-fidelity data transfer between agents."
    ),
    # sub_agents list defines which agents the coordinator has the authority to delegate tasks to.
    sub_agents=[analyst_agent, coach_agent, memory_curator_agent],
)
