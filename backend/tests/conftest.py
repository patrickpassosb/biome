import pytest
from unittest.mock import MagicMock, patch
import os
import sys

# Set the TESTING environment variable to use the in-memory database
os.environ["TESTING"] = "true"

# Ensure backend is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient

@pytest.fixture
def client():
    from main import app
    return TestClient(app)

@pytest.fixture
def mock_firestore():
    with patch("google.cloud.firestore.Client") as mock:
        yield mock
