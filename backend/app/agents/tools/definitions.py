"""
Tool definitions for Biome AI agents.

These tools allow LLM-based agents to interact with application's
internal state, databases, and analytics engine. They follow the
google-adk tool pattern.
"""

from typing import Any, Dict

from analytics.db import analytics
from app.agents.config import USER_ID
from profile_store import profile_store
from memory.store import memory_store


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
    Retrieves user's permanent profile including goals and preferences.

    This tool is used by Coach Agent to ensure training plans align
    with user's experience level and available equipment.

    Args:
        user_id: Unique identifier for the user.

    Returns:
        A dictionary containing goals, experience level, and training availability.
    """
    resolved_user_id = user_id or USER_ID
    profile = profile_store.get_profile(resolved_user_id)
    if profile:
        return profile.model_dump()

    # Return default empty profile if none exists
    return {
        "user_id": resolved_user_id,
        "name": None,
        "bio": None,
        "wage_per_hour": None,
        "sex": None,
        "date_of_birth": None,
        "age": None,
        "goal": None,
        "experience_level": None,
    }


def get_past_plan(user_id: str) -> Dict[str, Any]:
    """
    Retrieves most recent weekly plan for the user.

    This tool provides Coach Agent with a baseline to ensure
    continuity and to implement progressive overload.

    Args:
        user_id: Unique identifier for the user.

    Returns:
        A dictionary representing the last WeeklyPlan executed by the user.
    """
    # TODO: Implement plan persistence. Currently plans are generated
    # via agent but not stored anywhere. Returning empty structure.
    return {
        "week_start_date": None,
        "goal": None,
        "workouts": [],
    }


def save_memory_record(record: Dict[str, Any]) -> str:
    """
    Saves a compressed memory record to persistent database.

    Used by Memory Curator Agent to ensure that important coaching
    insights are retained for future sessions.

    Args:
        record: A dictionary matching the MemoryRecord schema.

    Returns:
        The unique ID of the saved record.
    """
    from models import MemoryRecord

    return memory_store.write_memory(MemoryRecord(**record))
