# Biome Build & Deployment Instructions

This guide provides comprehensive instructions for setting up, building, and deploying the Biome ecosystem. Biome is designed with a container-first philosophy, making it suitable for both local development and production-grade cloud environments.

## 📋 Prerequisites
Ensure the following tools are installed on your system:
- **Python:** 3.12+ (managed via `pyenv` recommended)
- **Node.js:** 20+ (managed via `nvm` recommended)
- **Docker:** For containerized deployment and environment parity.
- **uv:** The high-performance Python package manager. Install via:
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```

---

## 💻 Local Development

### 1. Backend Setup (FastAPI)
The backend manages AI orchestration and DuckDB analytics.

Navigate to the `backend/` directory:
```bash
cd backend
```

- **Dependency Management:** Use `uv` to create a virtual environment and sync dependencies.
  ```bash
  uv sync
  ```
- **Environment Configuration:** Create a `.env` file based on `.env.example` and add your `GOOGLE_API_KEY`.
- **Run Development Server:**
  ```bash
  uv run uvicorn main:app --reload --port 8000
  ```
- **Validation:** Run the test suite and linter to ensure stability.
  ```bash
  uv run pytest
  uv run ruff check .
  ```

### 2. Frontend Setup (Next.js)
The frontend provides the interactive dashboard and chat interface.

Navigate to the `frontend/` directory:
```bash
cd frontend
```

- **Install Dependencies:**
  ```bash
  npm install
  ```
- **Run Development Server:**
  ```bash
  npm run dev
  ```
- **Production Build Simulation:**
  ```bash
  npm run build
  npm run start
  ```

---

## 🐳 Docker Deployment
Biome uses multi-stage Docker builds to produce optimized, slim images.

### Backend Container
Build the production-ready image:
```bash
docker build -t biome-backend -f backend/Dockerfile backend/
```

Run the container (exposing port 8080):
```bash
docker run -p 8080:8080 --env-file backend/.env biome-backend
```

### Frontend Container
Build the static-optimized image:
```bash
docker build -t biome-frontend -f frontend/Dockerfile frontend/
```

Run the container:
```bash
docker run -p 80:80 biome-frontend
```

---

## 🔄 CI/CD Pipeline
The project utilizes GitHub Actions for automated quality assurance.

- **Workflow Path:** `.github/workflows/ci.yml`
- **Quality Gates:**
    - **Backend:** Executes Ruff for linting/formatting and Pytest for integration coverage.
    - **Frontend:** Executes ESLint and a full production build to verify component integrity.
- **Continuous Deployment:** Merges to `main` can be configured to trigger Google Cloud Build for deployment to Cloud Run.
