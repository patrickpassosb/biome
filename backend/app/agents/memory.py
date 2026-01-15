from google.adk.agents import LlmAgent
from .config import MODEL_NAME
from .schemas import MEMORY_RECORD_SCHEMA
from .tools import save_memory_record

memory_curator_agent = LlmAgent(
    name="memory_curator",
    model=MODEL_NAME,
    description="Compresses and stores long-term memory records.",
    instruction=(
        "You are a memory curator. Your job is to take raw training plans, analyst findings, "
        "and user feedback, and compress them into concise, high-value memory records. "
        "Do not simply store raw logs; summarize the key insights, successful strategies, "
        "and important context for future retrieval."
    ),
    tools=[save_memory_record],
    output_schema=MEMORY_RECORD_SCHEMA
)
