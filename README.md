# Biome - Training Intelligence

Biome is an AI-powered training intelligence dashboard designed to help strength athletes and coaches analyze training data, generate smart workout plans, and maintain a long-term memory of training progress.

## Project Structure

- **`backend/`**: FastAPI application with DuckDB for analytics, Firestore for memory, and Google Gemini for AI-driven coaching.
- **`frontend/`**: Next.js (React) application for the dashboard interface.
- **`contracts/`**: OpenAPI and JSON Schema definitions for the system.
- **`infra/`**: Documentation and setup instructions for production/infrastructure.
- **`context/`**: System context and rules for AI agents.

## Getting Started

### Prerequisites

- Node.js (v20+)
- Python (3.12+)
- `uv` (Fast Python package manager)
- Docker & Docker Compose (optional)

### Quick Start (Local Development)

1.  **Backend Setup**:
    ```bash
    cd backend
    uv sync
    # Set GOOGLE_API_KEY in .env (optional)
    ./dev.sh
    ```

2.  **Frontend Setup**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

### Running with Docker Compose

```bash
docker-compose up --build
```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080/docs`

## Features

- **Automated Analytics**: Reads workout CSVs and provides volume, RPE, and frequency trends.
- **AI Coach**: Proposes, validates, and revises weekly workout plans based on historical metrics.
- **Long-term Memory**: Stores reflections and findings to provide context for future coaching sessions.
- **Contract-Driven**: Strictly follows defined JSON schemas for all AI-generated content.

## License

MIT
