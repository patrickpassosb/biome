# Biome - Training Intelligence

Biome is a production-grade, AI-powered training intelligence dashboard designed for strength athletes and coaches. It leverages a multi-agent AI system to analyze training data, generate optimized weekly plans, and maintain a long-term memory of progress and reflections.

## 🚀 Overview

Biome goes beyond simple workout logging. It acts as an automated strength coach by:
1.  **Ingesting Data:** Seamlessly processing workout CSVs.
2.  **Analyzing Trends:** Identifying volume, RPE, and frequency patterns using DuckDB.
3.  **Proposing Plans:** Generating personalized weekly protocols via Google Gemini.
4.  **Maintaining Memory:** Storing long-term reflections in Firestore to provide persistent coaching context.

---

## 🏗️ Architecture

The system is built with a modern, modular architecture:

### 1. AI Agent Orchestration (ADK)
The heart of Biome is a multi-agent system built with the Google Agent Development Kit (ADK).
- **Coordinator Agent:** Manages the overall workflow, delegating tasks to specialized agents.
- **Analyst Agent:** Reviews historical metrics and identifies findings (weak points, progress, fatigue).
- **Coach Agent:** Synthesizes findings into actionable weekly plans, justifying decisions with data.
- **Validator Agent:** Ensures proposed plans are safe, realistic, and consistent.
- **Memory Curator:** Compresses and stores insights for long-term retrieval.

### 2. Backend (FastAPI + DuckDB)
- **Analytics Engine:** High-performance in-process analytics using DuckDB on training CSVs.
- **API Layer:** Robust FastAPI implementation with strict Pydantic model validation.
- **Persistence:** Google Cloud Firestore for long-term memory and DuckDB for local analytics.

### 3. Frontend (Next.js + Tailwind)
- **Dashboard:** Real-time visualization of volume velocity, exercise progress, and recent signals.
- **AI Chat:** Direct interaction with the Biome coaching team for real-time adjustments and advice.
- **Management:** Easy data import, weight tracking, and system configuration.

---

## 🚦 Getting Started

### Prerequisites
- **Node.js:** v20+
- **Python:** 3.12+
- **`uv`:** Fast Python package manager (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **Google API Key:** Required for Gemini AI features.
- **(Optional) Vertex AI:** To use Vertex AI quotas instead of the public Gemini API, set `GOOGLE_GENAI_USE_VERTEXAI=true`, `VERTEX_PROJECT_ID`, and `VERTEX_LOCATION` (e.g., `us-central1`) in your `.env`, and ensure your service account credentials are available via `GOOGLE_APPLICATION_CREDENTIALS` or ADC.

### Local Setup

1.  **Clone and Backend Setup:**
    ```bash
    git clone <repo-url>
    cd biome/backend
    uv sync
    # Create .env and add GOOGLE_API_KEY
    ./dev.sh
    ```

2.  **Frontend Setup:**
    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```

Access the dashboard at `http://localhost:3000` and the API docs at `http://localhost:8000/docs`.

---

## 📊 Data Flow

1.  **Ingestion:** User uploads a CSV or logs a workout. DuckDB processes the raw data.
2.  **Analysis:** The Analyst Agent queries DuckDB tools to identify performance trends.
3.  **Synthesis:** The Coach Agent takes Analyst findings and User profile data to draft a Weekly Plan.
4.  **Validation:** The Validator Agent checks the plan against safety and volume constraints.
5.  **Persistence:** The Memory Curator saves the final plan and insights to Firestore.
6.  **Visualization:** The Next.js frontend fetches metrics and plans via the FastAPI layer.

---

## 🧪 Testing

Biome maintains high quality through comprehensive testing:
- **Backend:** `pytest` with extensive mocking of AI and Firestore components.
- **Frontend:** `vitest` for unit tests and `playwright` for end-to-end flows.

See [backend/TESTING.md](backend/TESTING.md) for more details.

---

## 🛠️ Development

- **Linting:** `ruff` for Python, `eslint` for TypeScript.
- **Formatting:** `ruff format` and `prettier`.
- **Contracts:** Strict adherence to OpenAPI and JSON schemas in the `contracts/` directory.

---

## 📜 License

MIT
