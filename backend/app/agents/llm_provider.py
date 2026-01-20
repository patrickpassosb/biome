from functools import cached_property
from typing import Optional

from google import genai
from google.adk.models.google_llm import Gemini
from google.genai import types


class ConfiguredGemini(Gemini):
    api_key: Optional[str] = None
    vertexai: bool = False
    project: Optional[str] = None
    location: Optional[str] = None

    def _build_client(self, api_version: Optional[str]) -> genai.Client:
        http_options = types.HttpOptions(
            headers=self._tracking_headers,
            retry_options=self.retry_options,
        )
        if api_version:
            http_options.api_version = api_version
        return genai.Client(
            vertexai=self.vertexai,
            api_key=self.api_key,
            project=self.project,
            location=self.location,
            http_options=http_options,
        )

    @cached_property
    def api_client(self) -> genai.Client:
        return self._build_client(api_version=None)

    @cached_property
    def _live_api_client(self) -> genai.Client:
        return self._build_client(api_version=self._live_api_version)
