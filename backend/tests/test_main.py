def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "Biome Backend is running"}


def test_metrics_overview_endpoint(client):
    # The global analytics singleton is now patched by the conftest.py
    response = client.get("/metrics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "weekly_frequency" in data
    assert "total_volume_load_current_week" in data


def test_metrics_trends_endpoint(client):
    response = client.get("/metrics/trends?metric=volume_load")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
