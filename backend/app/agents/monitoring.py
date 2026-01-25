import contextvars
import logging
from dataclasses import dataclass, field
from typing import Optional

from google.adk.agents.base_agent import BaseAgent
from google.adk.agents.callback_context import CallbackContext
from google.adk.apps.app import App
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from google.adk.plugins.base_plugin import BasePlugin

logger = logging.getLogger(__name__)


@dataclass
class RequestContext:
    request_id: str
    endpoint: str
    provider: str
    session_id: str
    model_calls: int = 0
    models: set[str] = field(default_factory=set)


_request_context: contextvars.ContextVar[Optional[RequestContext]] = (
    contextvars.ContextVar("llm_request_context", default=None)
)


def start_request_context(
    *,
    request_id: str,
    endpoint: str,
    provider: str,
    session_id: str,
) -> RequestContext:
    context = RequestContext(
        request_id=request_id,
        endpoint=endpoint,
        provider=provider,
        session_id=session_id,
    )
    _request_context.set(context)
    return context


def get_request_context() -> Optional[RequestContext]:
    return _request_context.get()


def clear_request_context() -> None:
    _request_context.set(None)


def record_model_call(model: Optional[str]) -> None:
    context = get_request_context()
    if not context:
        return
    context.model_calls += 1
    if model:
        context.models.add(model)


def build_app(root_agent: BaseAgent, app_name: str) -> App:
    return App(
        name=app_name,
        root_agent=root_agent,
        plugins=[RequestLoggingPlugin()],
    )


class RequestLoggingPlugin(BasePlugin):
    def __init__(self) -> None:
        super().__init__(name="llm_request_logging")

    async def before_model_callback(
        self, *, callback_context: CallbackContext, llm_request: LlmRequest
    ) -> Optional[LlmResponse]:
        model = getattr(llm_request, "model", None)
        record_model_call(model)
        context = get_request_context()
        if context and model:
            logger.debug(
                "LLM model call (request_id=%s endpoint=%s provider=%s model=%s)",
                context.request_id,
                context.endpoint,
                context.provider,
                model,
            )
        return None
