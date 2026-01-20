"""
Smoke tests and top-level integration tests for the FastAPI application.

Ensures that the API surface is correctly mounted and that core
endpoints return expected structures.
"""


def test_root_endpoint(client):
    """
    Sanity check for the root health-check endpoint.
    """
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "Biome Backend is running"}


def test_profile_endpoint(client):
    """
    Verifies that the /profile endpoint is reachable.
    """
    response = client.get("/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"]
