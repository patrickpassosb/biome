"""
Router for training performance metrics.

This module provides the analytical backbone for the frontend dashboard.
It aggregates data from the DuckDB engine into visualized trends and insights.
"""

from fastapi import APIRouter, Query
from typing import List, Optional
from models import (
    MetricsOverview,
    TrendPoint,
    ExerciseStats,
    WorkoutInsight,
    WeightEntry,
)
from analytics.db import analytics

router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.get("/overview", response_model=MetricsOverview)
async def get_overview():
    """
    Returns the top-level KPIs (Frequency, Volume, Weak Points)
    for the current ISO training week.
    """
    data = analytics.get_overview_metrics()
    return MetricsOverview(**data)


@router.get("/trends", response_model=List[TrendPoint])
async def get_trends(
    metric: str = Query(
        ..., enum=["volume_load", "average_rpe", "max_weight", "weekly_frequency"]
    ),
    exercise: Optional[str] = Query(None),
):
    """
    Returns a time-series dataset for charting on the dashboard.
    Supports filtering by specific exercises.
    """
    return analytics.get_trends(metric, exercise)


@router.get("/exercises", response_model=List[str])
async def get_exercises():
    """
    Returns a sorted list of all unique exercise names found in the history.
    Used for the exercise selection dropdown.
    """
    return analytics.get_exercises()


@router.get("/exercise-stats/{exercise_name}", response_model=ExerciseStats)
async def get_exercise_stats(exercise_name: str):
    """
    Calculates lifetime aggregates (Max Weight, Total sets) for a single exercise.
    """
    return analytics.get_exercise_stats(exercise_name)


@router.get("/insights", response_model=List[WorkoutInsight])
async def get_insights(exercise: Optional[str] = Query(None)):
    """
    Triggers the heuristic insight engine to find anomalies or progress markers.
    """
    return await analytics.get_automated_insights(exercise)


@router.post("/weight")
async def log_weight(entry: WeightEntry):
    """
    Records a new body weight measurement.
    """
    analytics.log_weight(entry.date, entry.weight_kg)
    return {"status": "success"}


@router.get("/weight/history", response_model=List[WeightEntry])
async def get_weight_history():
    """
    Returns the complete list of body weight measurements.
    """
    return analytics.get_weight_history()
