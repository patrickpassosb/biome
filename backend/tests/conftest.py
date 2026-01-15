import pytest
from unittest.mock import MagicMock, patch
import os
import sys

# Ensure backend is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient

@pytest.fixture
def mock_genai():
    # Patching where it's USED
    with patch("agent.core.genai") as mock:
        yield mock

@pytest.fixture
def mock_model(mock_genai):
    mock_model_instance = MagicMock()
    mock_genai.GenerativeModel.return_value = mock_model_instance
    return mock_model_instance

@pytest.fixture
def mock_analytics():
    with patch("agent.core.analytics") as mock:
        # Default mock metrics
        mock.get_overview_metrics.return_value = {
            "weekly_frequency": 3,
            "total_volume_load_current_week": 10000,
            "active_weak_points_count": 0
        }
        yield mock

@pytest.fixture
def test_agent(mock_genai, mock_analytics):
    """Returns an agent instance with mocked dependencies"""
    from agent.core import BiomeAgent
    # Force API key presence to trigger model init
    with patch.dict(os.environ, {"GOOGLE_API_KEY": "fake-key"}):
        agent = BiomeAgent()
        return agent

@pytest.fixture
def client():
    from main import app
    return TestClient(app)

@pytest.fixture
def mock_agent_instance():
    with patch("routers.plan.agent") as mock:
        yield mock

@pytest.fixture(scope="function")
def in_memory_db():
    """Patches the global analytics engine to use in-memory DuckDB"""
    from analytics.db import AnalyticsEngine
    with patch("analytics.db.DB_PATH", ":memory:"), \
         patch("analytics.db.CSV_PATH", "non_existent_path.csv"):
        # We need to re-instantiate the singleton for the test context
        engine = AnalyticsEngine()
        # Seed it with some data for testing
        engine.con.execute("INSERT INTO training_history (date, workout, exercise, reps, weight_kg) VALUES ('2023-01-01', 'Test Workout', 'Bench', 10, 100)")
        
        # Patch the global 'analytics' instance in the module
        with patch("analytics.db.analytics", engine):
            yield engine

@pytest.fixture
def mock_firestore():
    with patch("google.cloud.firestore.Client") as mock:
        yield mock
