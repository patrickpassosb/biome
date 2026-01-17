"""
Unit tests for the MemoryStore logic.

These tests verify that reflections and findings are correctly
persisted, indexed, and retrieved using the local fallback engine.
"""

import pytest
from models import MemoryRecord, MemorySearchRequest
from memory.store import MemoryStore
from datetime import datetime


@pytest.fixture
def local_memory_store():
    """
    Sets up a specialized MemoryStore instance for testing.
    Forces Firestore use to False to test the in-memory fallback.
    """
    store = MemoryStore()
    store.use_firestore = False
    store._local_storage = {}
    return store


def test_write_and_search_memory(local_memory_store):
    """
    Ensures that a record can be written and subsequently found
    via a natural language query against its content.
    """
    # Arrange: Create a finding snapshot.
    record = MemoryRecord(
        type="finding_snapshot",
        content={"message": "User is strong"},
        created_at=datetime.now(),
    )

    # Act: Persist to local store.
    record_id = local_memory_store.write_memory(record)

    # Search for keywords.
    search_req = MemorySearchRequest(query="strong")
    results = local_memory_store.search_memory(search_req)

    # Assert: Verify retrieval.
    assert record_id is not None
    assert len(results) == 1
    assert results[0].content["message"] == "User is strong"


def test_search_memory_by_type(local_memory_store):
    """
    Verifies that the store can filter records by their specific type.
    """
    # Arrange: Add multiple types of records.
    local_memory_store.write_memory(
        MemoryRecord(
            type="finding_snapshot", content={"f": 1}, created_at=datetime.now()
        )
    )
    local_memory_store.write_memory(
        MemoryRecord(type="plan_snapshot", content={"p": 1}, created_at=datetime.now())
    )

    # Act: Search only for findings.
    results = local_memory_store.search_memory(
        MemorySearchRequest(type="finding_snapshot")
    )

    # Assert: Verify filtered result set.
    assert len(results) == 1
    assert results[0].type == "finding_snapshot"


def test_get_timeline(local_memory_store):
    """
    Ensures that the timeline retrieval respects the specified record limit.
    """
    # Arrange: Add two reflections.
    local_memory_store.write_memory(
        MemoryRecord(type="reflection", content={"r": 1}, created_at=datetime.now())
    )
    local_memory_store.write_memory(
        MemoryRecord(type="reflection", content={"r": 2}, created_at=datetime.now())
    )

    # Act: Request only the single most recent record.
    timeline = local_memory_store.get_timeline(limit=1)

    # Assert: Verify limit.
    assert len(timeline) == 1
