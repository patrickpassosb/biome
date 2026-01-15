from fastapi import APIRouter
from models import WeeklyPlan, RevisePlanRequest, PlanValidationResult
from agent.core import agent

router = APIRouter(prefix="/plan", tags=["Plan"])

@router.post("/propose", response_model=WeeklyPlan)
async def propose_plan():
    return agent.propose_plan()

@router.post("/revise", response_model=WeeklyPlan)
async def revise_plan(request: RevisePlanRequest):
    return agent.revise_plan(request)

@router.post("/validate", response_model=PlanValidationResult)
async def validate_plan(plan: WeeklyPlan):
    return agent.validate_plan(plan)
