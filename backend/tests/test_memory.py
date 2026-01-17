import pytest
from models import MemoryRecord, MemorySearchRequest
from memory.store import MemoryStore
from datetime import datetime


@pytest.fixture
def local_memory_store():
    # Force use_firestore to False
    store = MemoryStore()
    store.use_firestore = False
    store._local_storage = {}
    return store


def test_write_and_search_memory(local_memory_store):
    # Arrange
    record = MemoryRecord(
        type="finding_snapshot",
        content={"message": "User is strong"},
        created_at=datetime.now(),
    )

    # Act
    record_id = local_memory_store.write_memory(record)

    # Search
    search_req = MemorySearchRequest(query="strong")
    results = local_memory_store.search_memory(search_req)

    # Assert
    assert record_id is not None
    assert len(results) == 1
    assert results[0].content["message"] == "User is strong"


def test_search_memory_by_type(local_memory_store):
    # Arrange
    local_memory_store.write_memory(
        MemoryRecord(
            type="finding_snapshot", content={"f": 1}, created_at=datetime.now()
        )
    )
    local_memory_store.write_memory(
        MemoryRecord(type="plan_snapshot", content={"p": 1}, created_at=datetime.now())
    )

    # Act
    results = local_memory_store.search_memory(
        MemorySearchRequest(type="finding_snapshot")
    )

    # Assert
    assert len(results) == 1
    assert results[0].type == "finding_snapshot"


def test_get_timeline(local_memory_store):
    # Arrange
    local_memory_store.write_memory(
        MemoryRecord(type="reflection", content={"r": 1}, created_at=datetime.now())
    )
    local_memory_store.write_memory(
        MemoryRecord(type="reflection", content={"r": 2}, created_at=datetime.now())
    )

    # Act
    timeline = local_memory_store.get_timeline(limit=1)

    # Assert
    assert len(timeline) == 1
