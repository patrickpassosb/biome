from fastapi import APIRouter, Query
from typing import List
from models import MemoryRecord, MemorySearchRequest, MemoryWriteResponse
from memory.store import memory_store

router = APIRouter(prefix="/memory", tags=["Memory"])

@router.post("/write", response_model=MemoryWriteResponse)
async def write_memory(record: MemoryRecord):
    mem_id = memory_store.write_memory(record)
    return MemoryWriteResponse(id=mem_id, status="stored")

@router.post("/search", response_model=List[MemoryRecord])
async def search_memory(params: MemorySearchRequest):
    return memory_store.search_memory(params)

@router.get("/timeline", response_model=List[MemoryRecord])
async def get_timeline(limit: int = Query(20)):
    return memory_store.get_timeline(limit)
