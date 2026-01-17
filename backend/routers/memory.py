"""
Router for long-term agent memory.

This module provides endpoints for persisting and searching structured
coaching reflections. It interfaces directly with the MemoryStore.
"""

from fastapi import APIRouter, Query
from typing import List
from models import MemoryRecord, MemorySearchRequest, MemoryWriteResponse
from memory.store import memory_store

router = APIRouter(prefix="/memory", tags=["Memory"])


@router.post("/write", response_model=MemoryWriteResponse)
async def write_memory(record: MemoryRecord):
    """
    Saves a new snapshot of coaching findings or plans to the database.
    Used by the Memory Curator Agent.
    """
    mem_id = memory_store.write_memory(record)
    return MemoryWriteResponse(id=mem_id, status="stored")


@router.post("/search", response_model=List[MemoryRecord])
async def search_memory(params: MemorySearchRequest):
    """
    Retrieves filtered memory records based on keywords or record types.
    """
    return memory_store.search_memory(params)


@router.get("/timeline", response_model=List[MemoryRecord])
async def get_timeline(limit: int = Query(20)):
    """
    Fetches a simple chronological stream of recent coaching signals.
    Displayed on the dashboard as 'Recent Signals'.
    """
    return memory_store.get_timeline(limit)
