from dataclasses import dataclass
from typing import List, Optional

from google.adk.agents import LlmAgent
from google.adk.models.base_llm import BaseLlm

from .config import (
    MODEL_NAME,
    PUBLIC_API_KEY,
    PUBLIC_ENABLED,
    USE_VERTEX,
    VERTEX_LOCATION,
    VERTEX_PROJECT,
)
from .llm_provider import ConfiguredGemini
from .orchestrator import build_coordinator_agent
from .validator import build_validator_agent


@dataclass(frozen=True)
class ProviderAgents:
    name: str
    coordinator: LlmAgent
    validator: LlmAgent


def _build_public_llm() -> Optional[BaseLlm]:
    if not PUBLIC_ENABLED or not PUBLIC_API_KEY:
        return None
    return ConfiguredGemini(
        model=MODEL_NAME,
        vertexai=False,
        api_key=PUBLIC_API_KEY,
    )


def _build_vertex_llm() -> Optional[BaseLlm]:
    if not USE_VERTEX:
        return None
    return ConfiguredGemini(
        model=MODEL_NAME,
        vertexai=True,
        project=VERTEX_PROJECT,
        location=VERTEX_LOCATION,
    )


def _build_provider_agents(name: str, llm: BaseLlm) -> ProviderAgents:
    return ProviderAgents(
        name=name,
        coordinator=build_coordinator_agent(llm),
        validator=build_validator_agent(llm),
    )


PROVIDER_AGENTS: List[ProviderAgents] = []

_vertex_llm = _build_vertex_llm()
if _vertex_llm:
    PROVIDER_AGENTS.append(_build_provider_agents("vertex", _vertex_llm))

_public_llm = _build_public_llm()
if _public_llm:
    PROVIDER_AGENTS.append(_build_provider_agents("public", _public_llm))
