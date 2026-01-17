"""
Integration tests for the Memory Management router.

Verifies the HTTP surface for writing, searching, and viewing
the history of agent-generated signals.
"""

from datetime import datetime


def test_memory_write_and_timeline(client):
    """
    Tests the full lifecycle of a memory record:
    1. Write a record via POST /memory/write.
    2. Retrieve the record via GET /memory/timeline.
    """
    # Force use of local storage for predictable, network-free test execution.
    from memory.store import memory_store

    memory_store.use_firestore = False
    memory_store._local_storage = {}

    record = {
        "id": "test-1",
        "type": "reflection",
        "content": {"message": "Great session"},
        "created_at": datetime.now().isoformat(),
    }

    # Step 1: Write
    response = client.post("/memory/write", json=record)
    assert response.status_code == 200
    assert response.json()["id"] == "test-1"

    # Step 2: Check Timeline
    response = client.get("/memory/timeline")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "test-1"


def test_memory_search(client):
    """
    Verifies that the /memory/search endpoint correctly filters records
    based on keywords in the content payload.
    """
    from memory.store import memory_store

    memory_store.use_firestore = False
    memory_store._local_storage = {
        "1": {
            "id": "1",
            "type": "user_feedback",
            "content": {"text": "Patient is tired"},
            "created_at": "2023-01-01T10:00:00",
        },
        "2": {
            "id": "2",
            "type": "reflection",
            "content": {"text": "Improve sleep"},
            "created_at": "2023-01-02T10:00:00",
        },
    }

    # SEARCH BY TYPE: reflection
    search_payload = {"type": "reflection", "limit": 5}
    response = client.post("/memory/search", json=search_payload)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == "2"

    # SEARCH BY CONTENT: 'tired'
    search_payload = {"query": "tired"}
    response = client.post("/memory/search", json=search_payload)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == "1"
