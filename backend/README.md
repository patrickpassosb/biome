# Biome Backend

FastAPI backend for Biome Training Intelligence.

## Requirements
- Python 3.12+
- `uv` (package manager)
- Google Cloud credentials (optional, for Firestore/Gemini)

## Setup

1.  **Install dependencies**:
    ```bash
    uv sync
    ```

2.  **Environment Variables**:
    Create `.env` in `backend/` (optional):
    ```bash
    GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
    GOOGLE_API_KEY="your-gemini-api-key"
    ```
    If these are missing, the app will use:
    - In-memory storage instead of Firestore.
    - Mock AI responses instead of Gemini.

3.  **Data**:
    Ensure `backend/data/gym_data.csv` exists (copied during setup).

## Running

Run the dev server:
```bash
./dev.sh
```
Or directly:
```bash
uv run uvicorn backend.main:app --reload
```

## API Documentation

Once running, visit:
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Architecture

- **Analytics**: `backend/analytics/` - DuckDB integration for reading `gym_data.csv`.
- **Memory**: `backend/memory/` - Firestore (or in-memory) for long-term storage.
- **Agent**: `backend/agent/` - Google Gemini integration for plan generation/validation.
- **Routers**: `backend/routers/` - API endpoints.
