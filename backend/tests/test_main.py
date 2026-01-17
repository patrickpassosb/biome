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


def test_metrics_overview_endpoint(client):
    """
    Verifies that the /metrics/overview endpoint is reachable and
    returns a valid MetricsOverview model structure.
    """
    response = client.get("/metrics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "weekly_frequency" in data
    assert "total_volume_load_current_week" in data


def test_metrics_trends_endpoint(client):
    """
    Verifies the /metrics/trends endpoint with a valid query parameter.
    """
    response = client.get("/metrics/trends?metric=volume_load")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list) # Returns an array of TrendPoint objects
