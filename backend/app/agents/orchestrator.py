from google.adk.agents import LlmAgent
from .config import MODEL_NAME
from .analyst import analyst_agent
from .coach import coach_agent
from .memory import memory_curator_agent

coordinator_agent = LlmAgent(
    name="coordinator",
    model=MODEL_NAME,
    description="Orchestrates the training cycle workflow.",
    instruction=(
        "You are the Head Coach Manager. Your goal is to produce a high-quality weekly training plan "
        "and ensure it is properly recorded. \n"
        "IMPORTANT: If the 'analyst' reports no training history, the user is NEW. "
        "Your goal is to perform a 'Cold Start Onboarding':\n"
        "- Ask about their training experience, goals (Strength vs Hypertrophy), and availability (days per week).\n"
        "- Once you have enough info, propose their FIRST Weekly Plan.\n"
        "- Be encouraging and helpful.\n\n"
        "Follow this strict workflow:\n"
        "1. Ask the 'analyst' to review the user's data and provide findings.\n"
        "2. Pass those findings to the 'coach' and ask for a Weekly Plan.\n"
        "3. Once the plan is created, ask the 'memory_curator' to save the plan and the findings as a memory record.\n"
        "Ensure each step is completed before moving to the next."
    ),
    sub_agents=[analyst_agent, coach_agent, memory_curator_agent]
)

