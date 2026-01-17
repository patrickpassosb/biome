# Technology Stack

## Backend
- **Language:** Python (>=3.12)
- **Framework:** FastAPI (High-performance API layer)
- **Orchestration:** **ADK (Agent Development Kit)** - Utilizing `google-adk` for agent definition, tracing, and multi-agent coordination.
- **Package Management:** `uv` (Extremely fast Python package installer and resolver)

## AI & Data
- **AI Model:** Google Generative AI (Gemini) - Powering the Coach, Analyst, and Orchestrator agents.
- **Analytics Engine:** DuckDB - Used for high-performance in-process analytics on training metrics (workout CSVs).
- **Persistence & Memory:** Google Cloud Firestore - Storing biological markers, training history, and long-term agent reflections.

## Frontend
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS (consistent with the High-Tech Dark Mode aesthetic)
- **State Management:** React Hooks for metric fetching and real-time agent updates.

## Infrastructure & Deployment (GCP Native)
- **Compute:** **Google Cloud Run** - Fully managed serverless environment for both the FastAPI backend and Next.js frontend.
- **Containerization:** Docker with images hosted in **Google Artifact Registry**.
- **CI/CD:** **Google Cloud Build** - Automating deployments directly from the repository to Cloud Run.
- **Storage:** **Google Cloud Storage (GCS)** - For persisting training CSVs and other large artifacts if necessary.

## Development & Tooling
- **Linting:** Ruff
- **Testing:** Pytest (Backend) & Vitest/Playwright (Frontend)
- **API Contracts:** OpenAPI (Swagger) and JSON Schema for strict AI output validation.
