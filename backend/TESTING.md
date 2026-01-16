# Testing Biome

This repository contains a full suite of tests for both the backend (Python) and frontend (Next.js).

## Backend Testing (Python)

Uses `pytest` and `pytest-cov`.

### Prerequisites
- Python 3.12+
- `uv` installed

### Run Tests
```bash
cd backend
uv run pytest
```

### Coverage Report
```bash
cd backend
uv run pytest --cov=. --cov-report=term-missing
```
*Note: CI enforces a minimum of 80% coverage for the backend.*

---

## Frontend Testing (Next.js)

Uses `Vitest` for unit/component tests and `Playwright` for E2E tests.

### Prerequisites
- Node.js 20+
- `npm` installed

### Unit & Component Tests
```bash
cd frontend
npm test
```

### Frontend Coverage
```bash
cd frontend
npm run test:coverage
```

### E2E / Smoke Tests
```bash
cd frontend
npx playwright install # First time only
npm run test:e2e
```

---

## CI/CD Integration

Tests are automatically executed on every push and pull request to the `main` branch via GitHub Actions (`.github/workflows/ci.yml`).

### Backend Pipeline
- Linting and Formatting (Ruff)
- Unit & Integration Tests (Pytest)
- Coverage Enforcement (80%)

### Frontend Pipeline
- Linting (ESLint)
- Unit & Component Tests (Vitest)
- Production Build Check