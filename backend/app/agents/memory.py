"""
Memory curator agent for the Biome AI agent system.

This module defines the 'memory_curator_agent', which is responsible for
long-term context retention. It filters and compresses raw coaching
artifacts into meaningful memory records.
"""

from typing import Union

from google.adk.agents import LlmAgent
from google.adk.models.base_llm import BaseLlm

from .config import MODEL_NAME
from models import MemoryRecord
from .tools import save_memory_record

# The memory_curator acts as an efficient librarian.
# It ensures that the LLM's context window isn't cluttered with raw logs,
# but rather enriched with high-value summaries.
ModelType = Union[str, BaseLlm]


def build_memory_curator_agent(model: ModelType) -> LlmAgent:
    return LlmAgent(
        name="memory_curator",
        model=model,
        description="Specialized agent for compressing and persisting coaching artifacts.",
        instruction=(
            "You are a memory curator. Your job is to take raw training plans, analyst findings, "
            "and user feedback, and compress them into concise, high-value memory records.\n\n"
            "1. FILTERING: Do not simply store raw logs. Identify what actually matters for "
            "future coaching (e.g., 'User struggled with 120kg Squat depth').\n"
            "2. SUMMARIZATION: Summarize key insights, successful strategies, and important context.\n"
            "3. PERSISTENCE: Use the 'save_memory_record' tool to save the resulting summary "
            "to the persistent database.\n\n"
            "Format your output according to the MemoryRecord schema."
        ),
        tools=[save_memory_record],
        output_schema=MemoryRecord,
    )


memory_curator_agent = build_memory_curator_agent(MODEL_NAME)
