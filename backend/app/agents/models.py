"""
Data models for the Biome AI agent system.

This module defines the Pydantic models used for internal agent-to-agent
communication. These models mirror the public API contracts but are
optimized for LLM ingestion and structured output parsing.
"""

from pydantic import BaseModel
from typing import List, Literal, Optional
from datetime import date, datetime
from typing import Dict, Any

# --- Coach Findings Models ---
# These models define how the Analyst Agent communicates its discoveries.

class Finding(BaseModel):
    """
    A single data-backed observation about training performance or status.
    """
    type: Literal[
        "weak_point", "progress", "consistency", "volume_alert", "technique_note"
    ]
    message: str # Natural language description of the finding
    severity: Literal["info", "warning", "critical"]
    related_metric: Optional[
        Literal[
            "volume_load",
            "average_rpe",
            "max_weight",
            "weekly_frequency",
            "set_count",
            "failure_rate",
        ]
    ] = None
    related_exercise: Optional[str] = None


class CoachFindings(BaseModel):
    """
    Aggregate container for all findings identified during an analysis cycle.
    """
    findings: List[Finding]


# --- Weekly Plan Models ---
# These models define the structural protocol of a training week.

class Exercise(BaseModel):
    """
    Technical definition of an exercise set/rep protocol.
    """
    name: str
    target_sets: int
    target_reps: str # Flexible string to handle ranges (e.g., "8-12")
    target_rpe: Optional[float] = None
    notes: Optional[str] = None


class Workout(BaseModel):
    """
    Grouping of exercises for a specific training session.
    """
    day: Literal[
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ]
    focus: str # The main objective of this specific session
    exercises: List[Exercise]


class WeeklyPlan(BaseModel):
    """
    The complete output of a coaching session, covering a full training week.
    """
    week_start_date: date
    goal: str # Overarching goal for the microcycle
    workouts: List[Workout]


class PlanValidationResult(BaseModel):
    """
    Structured report from the Validator Agent.
    """
    valid: bool
    issues: List[str]


# --- Memory Models ---
# Models for summarizing and persisting insights.

class MemoryRecord(BaseModel):
    """
    Long-term persistence model for snapshots and reflections.
    """
    id: Optional[str] = None
    created_at: datetime
    type: Literal["plan_snapshot", "finding_snapshot", "user_feedback", "reflection"]
    content: Dict[str, Any] # Flexible payload for summarized insights
    tags: Optional[List[str]] = []
