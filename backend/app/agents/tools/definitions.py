"""
Tool definitions for Biome AI agents.

These tools allow LLM-based agents to interact with the application's
internal state, databases, and analytics engine. They follow the
google-adk tool pattern.
"""

from typing import Any, Dict
from analytics.db import analytics


def get_gym_metrics(user_id: str, start_date: str, end_date: str) -> Dict[str, Any]:
    """
    Retrieves aggregated gym metrics for a user within a date range.

    This tool is primarily used by the Analyst Agent to identify training
    trends such as volume load and weekly frequency.

    Args:
        user_id: Unique identifier for the user.
        start_date: Start of the analysis window (ISO format).
        end_date: End of the analysis window (ISO format).

    Returns:
        A dictionary containing weekly KPIs from the analytics engine.
    """
    # For the current prototype, user_id and dates are handled by the session state,
    # and the analytics engine defaults to the latest available data.
    return analytics.get_overview_metrics()


def get_user_profile(user_id: str) -> Dict[str, Any]:
    """
    Retrieves the user's permanent profile including goals and preferences.

    This tool is used by the Coach Agent to ensure training plans align
    with the user's experience level and available equipment.

    Args:
        user_id: Unique identifier for the user.

    Returns:
        A dictionary containing goals, experience level, and training availability.
    """
    # Mock implementation for the hackathon prototype.
    return {
        "user_id": user_id,
        "goals": ["increase_strength", "hypertrophy"],
        "experience_level": "intermediate",
        "available_days": ["Monday", "Wednesday", "Friday"],
    }


def get_past_plan(user_id: str) -> Dict[str, Any]:
    """
    Retrieves the most recent weekly plan for the user.

    This tool provides the Coach Agent with a baseline to ensure
    continuity and to implement progressive overload.

    Args:
        user_id: Unique identifier for the user.

    Returns:
        A dictionary representing the last WeeklyPlan executed by the user.
    """
    # Mock implementation for the hackathon prototype.
    return {
        "week_start_date": "2023-10-23",
        "goal": "Hypertrophy block",
        "workouts": [],  # Should ideally contain the previous workout structures
    }


def save_memory_record(record: Dict[str, Any]) -> str:
    """
    Saves a compressed memory record to the persistent database.

    Used by the Memory Curator Agent to ensure that important coaching
    insights are retained for future sessions.

    Args:
        record: A dictionary matching the MemoryRecord schema.

    Returns:
        The unique ID of the saved record.
    """
    # Mock implementation for the hackathon prototype.
    return "mem_12345"


def get_weight_history() -> Dict[str, Any]:
    """
    Retrieves the user's historical body weight measurements.

    Used by the Analyst Agent to correlate strength gains with changes
    in body composition.

    Returns:
        A dictionary containing a list of weight entries.
    """
    history = analytics.get_weight_history()
    return {"weight_history": history}
