# Biome Build & Deployment Instructions

## Prerequisites
- **Python:** 3.12+
- **Node.js:** 20+
- **Docker**
- **uv** (for Python dependency management): `curl -LsSf https://astral.sh/uv/install.sh | sh`

## Local Development

### Backend
Navigate to `backend/`:
```bash
cd backend
```

1.  **Install Dependencies:**
    ```bash
    uv sync
    ```

2.  **Run Development Server:**
    ```bash
    uv run uvicorn main:app --reload
    ```

3.  **Run Tests:**
    ```bash
    uv run pytest
    ```

4.  **Lint & Format:**
    ```bash
    uv run ruff check .
    uv run ruff format .
    ```

### Frontend
Navigate to `frontend/`:
```bash
cd frontend
```

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Lint:**
    ```bash
    npm run lint
    ```

3.  **Build:**
    ```bash
    npm run build
    ```

## Docker Deployment

### Backend Container
Build the image:
```bash
docker build -t biome-backend -f backend/Dockerfile backend/
```

Run the container:
```bash
docker run -p 8080:8080 biome-backend
```

### Frontend Container
Build the image:
```bash
docker build -t biome-frontend -f frontend/Dockerfile frontend/
```

Run the container:
```bash
docker run -p 80:80 biome-frontend
```

## CI/CD Pipeline
The project uses GitHub Actions for CI.
- **Workflow:** `.github/workflows/ci.yml`
- **Triggers:** Push to `main`, Pull Request to `main`.
- **Jobs:**
    - `backend-quality`: Runs Ruff (lint/format) and Pytest.
    - `frontend-quality`: Runs `npm run lint` and `npm run build`.
