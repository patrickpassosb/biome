"""
Shared test fixtures and environment configuration for the Biome backend.

This module ensures that all tests run against an isolated in-memory DuckDB
instance and provides mocks for external services like Firestore and
Google Generative AI.
"""

import pytest
from unittest.mock import patch
import os
import sys

# Set the TESTING environment variable to trigger ':memory:' database path in db.py.
os.environ["TESTING"] = "true"
os.environ.setdefault("AGENT_ENABLE_LLM", "1")
os.environ.setdefault("GOOGLE_API_KEY", "test-key")

# Add the parent directory to sys.path so we can import modules from 'backend/'.
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def clean_db():
    """
    Automatic fixture that wipes the database before every test.
    Ensures that test cases are independent and side-effect free.
    """
    from analytics.db import analytics

    analytics.con.execute("DELETE FROM training_history")
    analytics.con.execute("DELETE FROM demo_training_history")
    yield


@pytest.fixture
def client():
    """
    Provides a FastAPI TestClient instance.
    Used for simulating HTTP requests to the application routers.
    """
    from main import app

    return TestClient(app)


@pytest.fixture
def mock_firestore():
    """
    Mocks the Firestore client to prevent tests from attempting
    real network connections to Google Cloud.
    """
    with patch("google.cloud.firestore.Client") as mock:
        yield mock


@pytest.fixture
def mock_adk_run():
    """
    Mocks the ADK runner's execution method.
    This is essential for testing AI flows without consuming API quota
    or dealing with non-deterministic LLM output.
    """
    with patch("google.adk.runners.Runner.run") as mock:
        yield mock
