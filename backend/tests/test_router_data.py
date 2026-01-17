"""
Integration tests for the Data Management router.

Verifies the endpoints for importing data, toggling modes, and manual logging.
"""

from io import BytesIO
from analytics.db import analytics


def test_toggle_demo_mode(client):
    """
    Tests the capability to switch between production and demo datasets.
    """
    # Enable demo mode.
    response = client.post("/data/demo", json={"enabled": True})
    assert response.status_code == 200
    assert response.json()["mode"] == "demo"
    assert analytics.active_table == "demo_training_history"

    # Disable demo mode.
    response = client.post("/data/demo", json={"enabled": False})
    assert response.status_code == 200
    assert response.json()["mode"] == "user"
    assert analytics.active_table == "training_history"


def test_log_workout(client):
    """
    Verifies that a manual entry from the dashboard is correctly persisted
    to the underlying DuckDB engine.
    """
    workout_data = {
        "date": "2023-01-02",
        "workout": "Leg Day",
        "exercise": "Squat",
        "set_number": 1,
        "reps": 8,
        "weight_kg": 120,
        "rpe": 9,
        "notes": "Hard set",
    }
    response = client.post("/data/log", json=workout_data)
    assert response.status_code == 200
    assert response.json()["status"] == "success"

    # Check the database directly to confirm the side-effect.
    history = analytics.get_recent_history(limit=10)
    assert any(h["exercise"] == "Squat" for h in history)


def test_import_data_success(client, tmp_path):
    """
    Ensures that a valid CSV file can be uploaded and its contents parsed
    into the training history table.
    """
    # Create a dummy CSV matching the expected DuckDB schema.
    csv_content = "date,workout,exercise,set_number,reps,duration_seconds,weight_kg,machine_level,warm_up,rpe,notes\n2023-01-10,Imported,Deadlift,1,5,,180,,,9,test import"

    # Ensure the 'data/' directory exists for the temporary storage.
    import os

    if not os.path.exists("data"):
        os.makedirs("data")

    # Perform the multipart file upload.
    files = {"file": ("test.csv", BytesIO(csv_content.encode()), "text/csv")}
    response = client.post("/data/import", files=files)

    assert response.status_code == 200
    assert response.json()["message"] == "Data imported successfully"

    # Verify that the 'Deadlift' record from the CSV is now in the DB.
    history = analytics.get_recent_history()
    assert any(h["exercise"] == "Deadlift" for h in history)


def test_import_data_invalid_extension(client):
    """
    Validates the security check that only .csv files are allowed for import.
    """
    files = {"file": ("test.txt", BytesIO(b"not a csv"), "text/plain")}
    response = client.post("/data/import", files=files)
    assert response.status_code == 400
    assert "Only CSV files are allowed" in response.json()["detail"]
