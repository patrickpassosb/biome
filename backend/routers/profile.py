"""
Router for user profile management.

Provides a minimal profile read/write API to support the MVP flow.
"""

from datetime import date

from fastapi import APIRouter, HTTPException

from analytics.db import analytics
from app.agents.config import USER_ID
from models import UserProfile, UserProfileUpdate
from user_profile import profile_store

router = APIRouter(prefix="/profile", tags=["Profile"])

DEFAULT_USER_ID = USER_ID


def compute_age(dob: date) -> int:
    """
    Compute age from date of birth.
    """
    today = date.today()
    age = today.year - dob.year
    if (today.month, today.day) < (dob.month, dob.day):
        age -= 1
    return age


@router.get("", response_model=UserProfile)
async def get_profile():
    """
    Returns the persisted profile or a default skeleton.
    """
    profile = profile_store.get_profile(DEFAULT_USER_ID)
    if profile:
        return profile

    default_profile = UserProfile(
        user_id=DEFAULT_USER_ID,
        sex="other",
        date_of_birth=date(2000, 1, 1),
        age=25,
        goal="build_muscle",
        experience_level="beginner",
    )
    profile_store.upsert_profile(default_profile)
    return default_profile


@router.post("", response_model=UserProfile)
async def update_profile(update: UserProfileUpdate):
    """
    Upserts user profile and logs to provided weight into analytics.
    """
    if update.current_weight_kg is not None and update.current_weight_kg <= 0:
        raise HTTPException(status_code=400, detail="Weight must be greater than zero.")

    if update.wage_per_hour is not None and update.wage_per_hour < 0:
        raise HTTPException(status_code=400, detail="Wage must be zero or greater.")

    existing = profile_store.get_profile(DEFAULT_USER_ID) or UserProfile(
        user_id=DEFAULT_USER_ID,
        sex="other",
        date_of_birth=date(2000, 1, 1),
        age=25,
        goal="build_muscle",
        experience_level="beginner",
    )
    updated_data = existing.model_dump()

    # Validate age matches DOB if both provided
    if update.age and update.date_of_birth:
        computed = compute_age(update.date_of_birth)
        if update.age != computed:
            raise HTTPException(
                status_code=400,
                detail=f"Age mismatch: Date of birth indicates age {computed}, but you entered {update.age}",
            )

    # Validate DOB not in future
    if update.date_of_birth and update.date_of_birth > date.today():
        raise HTTPException(
            status_code=400, detail="Date of birth cannot be in the future."
        )

    # Validate age range
    if update.age and (update.age < 5 or update.age > 130):
        raise HTTPException(status_code=400, detail="Age must be between 5 and 130.")

    for field in [
        "name",
        "bio",
        "sex",
        "date_of_birth",
        "age",
        "goal",
        "experience_level",
        "current_weight_kg",
        "wage_per_hour",
    ]:
        value = getattr(update, field)
        if value is not None:
            updated_data[field] = value

    updated_profile = UserProfile(**updated_data)

    if update.current_weight_kg is not None:
        log_date = update.weight_date or date.today()
        analytics.log_weight(log_date, update.current_weight_kg)

    profile_store.upsert_profile(updated_profile)
    return updated_profile
