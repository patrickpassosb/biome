# Testing Biome Backend

This project uses `pytest` for testing, with `pytest-cov` for coverage reporting.

## Prerequisites

- Python 3.12+
- `uv` installed

## Running Tests

### All Tests
```bash
uv run pytest
```

### With Coverage Report
```bash
uv run pytest --cov=. --cov-report=term-missing
```

### Specific Test File
```bash
uv run pytest tests/test_agent.py
```

## Test Structure

- `backend/tests/conftest.py`: Contains global fixtures and mocks (GenAI, Analytics/DuckDB, Firestore).
- `backend/tests/test_agent.py`: Unit tests for the Biome AI Agent.
- `backend/tests/test_analytics.py`: Tests for the DuckDB analytics engine.
- `backend/tests/test_memory.py`: Tests for the Memory Store (in-memory fallback).
- `backend/tests/test_router_plan.py`: API tests for the plan generation endpoints.
- `backend/tests/test_main.py`: Integration/smoke tests for the entire API.

## CI/CD

Tests are automatically run on every push and pull request to the `main` branch via GitHub Actions. The CI enforces a minimum coverage threshold of 70%.
