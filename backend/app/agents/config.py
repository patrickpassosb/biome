"""
Configuration constants for the Biome AI agent system.

This module centralizes global settings such as the specific LLM model
version to be used across all specialized agents.
"""

import os


def _normalize_model(name: str) -> str:
    """Strip `models/` prefix so ADK registry can resolve Gemini IDs."""
    return name.split("/", 1)[-1] if name.startswith("models/") else name


# Convert truthy strings to boolean.
def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


# Allow model selection via environment; default to a supported flash tier.
DEFAULT_MODEL = "gemini-2.0-flash"
MODEL_NAME = _normalize_model(os.getenv("GEMINI_MODEL_NAME", DEFAULT_MODEL))

# Shared app/user identifiers for ADK runners to keep sessions aligned.
APP_NAME = os.getenv("AGENT_APP_NAME") or "agents"
USER_ID = os.getenv("AGENT_USER_ID") or "test_user"
LLM_ENABLED = _as_bool(os.getenv("AGENT_ENABLE_LLM"), default=False)

# Public Gemini configuration
_public_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or ""
PUBLIC_API_KEY = _public_key.strip() or None
PUBLIC_ENABLED = PUBLIC_API_KEY is not None

# Vertex AI configuration
USE_VERTEX = _as_bool(
    os.getenv("AGENT_USE_VERTEX"),
    default=_as_bool(os.getenv("GOOGLE_GENAI_USE_VERTEXAI")),
)
VERTEX_PROJECT = os.getenv("VERTEX_PROJECT_ID") or os.getenv("GOOGLE_CLOUD_PROJECT")
VERTEX_LOCATION = (
    os.getenv("VERTEX_LOCATION")
    or os.getenv("GOOGLE_CLOUD_LOCATION")
    or "us-central1"
)
