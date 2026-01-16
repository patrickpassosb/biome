from pydantic import BaseModel
from typing import List, Literal, Optional
from datetime import date, datetime
from typing import Dict, Any

# --- Coach Findings Models ---

class Finding(BaseModel):
    type: Literal[
        "weak_point",
        "progress",
        "consistency",
        "volume_alert",
        "technique_note"
    ]
    message: str
    severity: Literal["info", "warning", "critical"]
    related_metric: Optional[Literal[
        "volume_load",
        "average_rpe",
        "max_weight",
        "weekly_frequency",
        "set_count",
        "failure_rate"
    ]] = None
    related_exercise: Optional[str] = None

class CoachFindings(BaseModel):
    findings: List[Finding]

# --- Weekly Plan Models ---

class Exercise(BaseModel):
    name: str
    target_sets: int
    target_reps: str
    target_rpe: Optional[float] = None
    notes: Optional[str] = None

class Workout(BaseModel):
    day: Literal["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    focus: str
    exercises: List[Exercise]

class WeeklyPlan(BaseModel):
    week_start_date: date
    goal: str
    workouts: List[Workout]

class PlanValidationResult(BaseModel):
    valid: bool
    issues: List[str]

# --- Memory Models ---

class MemoryRecord(BaseModel):
    id: Optional[str] = None
    created_at: datetime
    type: Literal["plan_snapshot", "finding_snapshot", "user_feedback", "reflection"]
    content: Dict[str, Any]
    tags: Optional[List[str]] = []
