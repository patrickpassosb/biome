from typing import Any, Dict
from analytics.db import analytics


def get_gym_metrics(user_id: str, start_date: str, end_date: str) -> Dict[str, Any]:
    """
    Retrieves aggregated gym metrics for a user within a date range.
    """
    return analytics.get_overview_metrics()


def get_user_profile(user_id: str) -> Dict[str, Any]:
    """
    Retrieves the user's profile including goals and preferences.

    Args:
        user_id: The ID of the user.

    Returns:
        A dictionary containing user profile data.
    """
    # Mock implementation
    return {
        "user_id": user_id,
        "goals": ["increase_strength", "hypertrophy"],
        "experience_level": "intermediate",
        "available_days": ["Monday", "Wednesday", "Friday"],
    }


def get_past_plan(user_id: str) -> Dict[str, Any]:
    """
    Retrieves the most recent weekly plan for the user.

    Args:
        user_id: The ID of the user.

    Returns:
        A dictionary representing the last WeeklyPlan.
    """
    # Mock implementation
    return {
        "week_start_date": "2023-10-23",
        "goal": "Hypertrophy block",
        "workouts": [],
    }


def save_memory_record(record: Dict[str, Any]) -> str:
    """
    Saves a compressed memory record to the database.

    Args:
        record: The MemoryRecord object to save.

    Returns:
        The ID of the saved record.
    """
    # Mock implementation
    return "mem_12345"


def get_weight_history() -> Dict[str, Any]:
    """
    Retrieves the user's weight history.
    """
    history = analytics.get_weight_history()
    return {"weight_history": history}
