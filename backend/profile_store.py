"""
Single-user local profile storage for Biome.

Persists profile data in a local DuckDB file for a single user.
"""

from datetime import datetime
import os
from typing import Optional

import duckdb

from models import UserProfile

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

if os.environ.get("TESTING") == "true":
    DB_PATH = ":memory:"
else:
    DB_PATH = os.path.join(DATA_DIR, "profile.duckdb")


class ProfileStore:
    """
    Stores a single user's profile in DuckDB.
    """

    def __init__(self) -> None:
        self.con = duckdb.connect(DB_PATH)
        self._init_db()

    def _init_db(self) -> None:
        self.con.execute(
            """
            CREATE TABLE IF NOT EXISTS user_profile (
                user_id VARCHAR PRIMARY KEY,
                name VARCHAR,
                bio VARCHAR,
                wage_per_hour DOUBLE,
                sex VARCHAR,
                date_of_birth DATE,
                age INTEGER,
                goal VARCHAR,
                experience_level VARCHAR,
                updated_at TIMESTAMP
            )
            """
        )

    def get_profile(self, user_id: str) -> Optional[UserProfile]:
        row = self.con.execute(
            """
            SELECT
                user_id,
                name,
                bio,
                wage_per_hour,
                sex,
                date_of_birth,
                age,
                goal,
                experience_level,
                updated_at
            FROM user_profile
            WHERE user_id = ?
            """,
            [user_id],
        ).fetchone()
        if not row:
            return None

        profile_data = {
            "user_id": row[0],
            "name": row[1],
            "bio": row[2],
            "wage_per_hour": row[3],
            "sex": row[4],
            "date_of_birth": row[5],
            "age": row[6],
            "goal": row[7],
            "experience_level": row[8],
            "updated_at": row[9],
        }
        return UserProfile(**profile_data)

    def upsert_profile(self, profile: UserProfile) -> None:
        updated_at = profile.updated_at or datetime.now()
        self.con.execute("DELETE FROM user_profile WHERE user_id = ?", [profile.user_id])
        self.con.execute(
            """
            INSERT INTO user_profile (
                user_id,
                name,
                bio,
                wage_per_hour,
                sex,
                date_of_birth,
                age,
                goal,
                experience_level,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                profile.user_id,
                profile.name,
                profile.bio,
                profile.wage_per_hour,
                profile.sex,
                profile.date_of_birth,
                profile.age,
                profile.goal,
                profile.experience_level,
                updated_at,
            ],
        )

    def clear_local(self) -> None:
        self.con.execute("DELETE FROM user_profile")


profile_store = ProfileStore()
