from fastapi import APIRouter, Query
from typing import List
from models import MetricsOverview, TrendPoint
from analytics.db import analytics

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.get("/overview", response_model=MetricsOverview)
async def get_overview():
    data = analytics.get_overview_metrics()
    return MetricsOverview(**data)

@router.get("/trends", response_model=List[TrendPoint])
async def get_trends(metric: str = Query(..., enum=["volume_load", "average_rpe", "max_weight", "weekly_frequency"])):
    return analytics.get_trends(metric)
