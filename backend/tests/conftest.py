import pytest
from unittest.mock import patch
import os
import sys

# Set the TESTING environment variable to use the in-memory database
os.environ["TESTING"] = "true"

# Ensure backend is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient

@pytest.fixture(autouse=True)
def clean_db():
    from analytics.db import analytics
    analytics.con.execute("DELETE FROM training_history")
    analytics.con.execute("DELETE FROM demo_training_history")
    analytics.con.execute("DELETE FROM weight_history")
    yield
@pytest.fixture
def client():
    from main import app
    return TestClient(app)

@pytest.fixture
def mock_firestore():
    with patch("google.cloud.firestore.Client") as mock:
        yield mock

@pytest.fixture
def mock_adk_run():
    with patch("google.adk.runners.Runner.run") as mock:
        yield mock
