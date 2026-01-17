# Specification: Bio-Marker Integration

## Overview
Implement the system for storing and managing user biological markers (sex, age, weight, goals). This data is the foundation for the AI Agent's personalized coaching.

## Requirements
- **Backend:** Create CRUD endpoints in `backend/routers/data.py` for user bios.
- **Persistence:** Store data in Google Cloud Firestore.
- **Frontend:** Create a `SettingsView` or `Profile` component in Next.js to allow users to update their bio.
- **Agent Integration:** Ensure the "Bio" is accessible as a tool or context for the AI Orchestrator.

## Technical Goals
- Implement `MemoryRecord` schema validation for bios.
- Build a responsive React form for biological data entry.
- Ensure 80% test coverage for the new data router.
