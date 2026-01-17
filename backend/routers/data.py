"""
Router for data management and ingestion.

This module provides endpoints for maintaining the training database,
including CSV imports, demo mode toggling, and manual entry logging.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Body
import shutil
import os
from analytics.db import analytics
from models import WorkoutLogEntry

router = APIRouter(prefix="/data", tags=["Data Management"])


@router.post("/import")
async def import_data(file: UploadFile = File(...)):
    """
    Overwrites the current user training history with data from a CSV file.

    This is the primary way for users to migrate their existing gym logs
    into the Biome ecosystem.
    """
    # Safety check: Only allow .csv extensions.
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")

    # 1. PERSIST: Save the uploaded file to a temporary location.
    temp_path = f"data/temp_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. INGEST: Trigger the analytics engine to parse and load the CSV.
        result = analytics.import_user_data(temp_path)
        return {"message": "Data imported successfully", "details": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
    finally:
        # 3. CLEANUP: Ensure the temporary file is deleted even if ingestion fails.
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/demo")
async def toggle_demo(enabled: bool = Body(..., embed=True)):
    """
    Global toggle to switch between real user data and a pre-populated demo dataset.
    Used for exploration and feature walkthroughs.
    """
    analytics.toggle_demo_mode(enabled)
    return {"status": "success", "mode": "demo" if enabled else "user"}


@router.post("/log")
async def log_workout(entry: WorkoutLogEntry):
    """
    Manually logs a single exercise set.
    This is used by the 'Log Workout' buttons on the dashboard.
    """
    try:
        analytics.log_workout(entry)
        return {"status": "success", "message": "Workout logged"}
    except Exception as e:
        # Catch DuckDB or validation errors.
        raise HTTPException(status_code=500, detail=str(e))
