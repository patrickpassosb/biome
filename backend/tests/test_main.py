
def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "Biome Backend is running"}

def test_metrics_overview_endpoint(client, in_memory_db):
    # in_memory_db patches the global analytics singleton used by the app
    response = client.get("/metrics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "weekly_frequency" in data
    assert "total_volume_load_current_week" in data

def test_metrics_trends_endpoint(client, in_memory_db):
    response = client.get("/metrics/trends?metric=volume_load")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "date" in data[0]
        assert "value" in data[0]