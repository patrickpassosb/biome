"""
Main entry point for the Biome Training Intelligence API.

This module initializes the FastAPI application, configures global middleware (CORS),
and aggregates all specialized routers into a single API surface.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import plan, memory, agent as agent_router, data, profile
import uvicorn

# Initialize the FastAPI application with metadata for documentation.
app = FastAPI(
    title="Biome Training Intelligence API",
    version="1.0.0",
    description="API for Training Intelligence (Biome). Supports data ingestion, AI coaching, and long-term memory.",
)

# Configure CORS (Cross-Origin Resource Sharing) middleware.
# This is necessary for the Next.js frontend (typically running on port 3000)
# to communicate with this API (typically running on port 8000).
# In production, 'allow_origins' should be limited to specific domains.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development convenience.
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Aggregate routers from the 'routers' package.
# Each router handles a specific domain of the application.
app.include_router(plan.router)  # AI-driven plan generation and validation.
app.include_router(memory.router)  # Long-term snapshot storage and search.
app.include_router(agent_router.router)  # Real-time chat with the coaching team.
app.include_router(data.router)  # Data management, demo mode, and CSV imports.
app.include_router(profile.router)  # User profile read/write.


@app.get("/")
async def root():
    """
    Health check and sanity endpoint.
    Verifies that the backend server is up and responsive.
    """
    return {"status": "ok", "message": "Biome Backend is running"}


if __name__ == "__main__":
    # Entry point for local execution using uvicorn.
    # reload=True enables hot-reloading during development.
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
