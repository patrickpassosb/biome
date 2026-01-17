# Specification: GCP Cloud Run Deployment

## Overview
Set up a robust CI/CD pipeline to deploy Biome to Google Cloud Platform. This track leverages GCP credits to provide a live environment for the Training Intelligence system.

## Requirements
- **Cloud Run:** Deploy the FastAPI backend and Next.js frontend as separate services.
- **Cloud Build:** Automate the build and deploy process on git push.
- **Artifact Registry:** Store Docker images in a secure GCP repository.
- **Secrets Management:** Use Secret Manager for API keys (Gemini, Firestore credentials).

## Technical Goals
- Create a root-level `cloudbuild.yaml`.
- Update the `backend/Dockerfile` and `frontend/Dockerfile` for production optimization.
- Ensure the Frontend can communicate with the Backend in the Cloud Run environment.
