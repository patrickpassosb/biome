from fastapi import APIRouter
from models import ChatRequest, ChatResponse
from agent.core import agent

router = APIRouter(prefix="/agent", tags=["Agent"])

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    return agent.chat(request)
