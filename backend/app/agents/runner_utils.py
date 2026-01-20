from typing import List, Optional

from google.adk.runners import Runner
from google.genai import types


def _parts_to_text(parts: List[types.Part]) -> str:
    texts = []
    for part in parts:
        text = getattr(part, "text", None)
        if text:
            texts.append(text)
    return "\n".join(texts).strip()


async def collect_final_text(
    runner: Runner,
    user_id: str,
    session_id: str,
    content: types.Content,
) -> Optional[str]:
    final_text = None
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=content,
    ):
        if event.is_final_response() and event.content and event.content.parts:
            text = _parts_to_text(event.content.parts)
            if text:
                final_text = text
    return final_text
