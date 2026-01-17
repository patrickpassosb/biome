from fastapi import APIRouter, UploadFile, File, HTTPException, Body
import shutil
import os
from analytics.db import analytics
from models import WorkoutLogEntry

router = APIRouter(prefix="/data", tags=["Data Management"])


@router.post("/import")
async def import_data(file: UploadFile = File(...)):
    """Upload a CSV file to replace current user data."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")

    # Save temp file
    temp_path = f"data/temp_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = analytics.import_user_data(temp_path)
        return {"message": "Data imported successfully", "details": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/demo")
async def toggle_demo(enabled: bool = Body(..., embed=True)):
    """Toggle between User Data and Demo Data."""
    analytics.toggle_demo_mode(enabled)
    return {"status": "success", "mode": "demo" if enabled else "user"}


@router.post("/log")
async def log_workout(entry: WorkoutLogEntry):
    """Log a single workout set/exercise."""
    try:
        analytics.log_workout(entry)
        return {"status": "success", "message": "Workout logged"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
