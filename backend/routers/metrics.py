from fastapi import APIRouter, Query
from typing import List, Optional
from models import MetricsOverview, TrendPoint, ExerciseStats, WorkoutInsight, WeightEntry
from analytics.db import analytics

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.get("/overview", response_model=MetricsOverview)
async def get_overview():
    data = analytics.get_overview_metrics()
    return MetricsOverview(**data)

@router.get("/trends", response_model=List[TrendPoint])
async def get_trends(
    metric: str = Query(..., enum=["volume_load", "average_rpe", "max_weight", "weekly_frequency"]),
    exercise: Optional[str] = Query(None)
):
    return analytics.get_trends(metric, exercise)

@router.get("/exercises", response_model=List[str])
async def get_exercises():
    return analytics.get_exercises()

@router.get("/exercise-stats/{exercise_name}", response_model=ExerciseStats)
async def get_exercise_stats(exercise_name: str):
    return analytics.get_exercise_stats(exercise_name)

@router.get("/insights", response_model=List[WorkoutInsight])
async def get_insights(exercise: Optional[str] = Query(None)):
    return await analytics.get_automated_insights(exercise)

@router.post("/weight")
async def log_weight(entry: WeightEntry):
    analytics.log_weight(entry.date, entry.weight_kg)
    return {"status": "success"}

@router.get("/weight/history", response_model=List[WeightEntry])
async def get_weight_history():
    return analytics.get_weight_history()
