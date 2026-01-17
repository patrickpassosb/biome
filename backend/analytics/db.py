"""
Analytics engine for the Biome application.

This module provides the AnalyticsEngine class, which uses DuckDB to perform
high-performance, in-process analytics on workout data stored in CSV files.
It handles data ingestion, schema management, and complex SQL queries to
derive training insights.
"""

import duckdb
import os
from datetime import date, timedelta
from typing import List, Dict, Any, Optional
from models import TrendPoint, WorkoutLogEntry

# Environment-based configuration for database paths.
# During testing, we use an in-memory database to ensure isolation.
if os.environ.get("TESTING") == "true":
    DB_PATH = ":memory:"
    CSV_PATH = "data/gym_data.csv"
else:
    DB_PATH = "data/analytics.duckdb"
    CSV_PATH = "data/gym_data.csv"


class AnalyticsEngine:
    """
    Handles data ingestion, storage, and analytical queries using DuckDB.

    The engine manages two main training history tables: one for actual user data
    and one for demo purposes. It also tracks body weight history.
    """

    def __init__(self):
        """
        Initializes the analytics engine and establishes a connection to DuckDB.
        """
        self.con = duckdb.connect(DB_PATH)
        # Defaults to actual user data.
        self.active_table = "training_history"
        self._init_db()

    def _init_db(self):
        """
        Initializes the database schema and loads initial data.

        Note: In a production environment, this should be handled via a migration
        system (e.g., Alembic for DuckDB if supported, or custom scripts).
        For this prototype, we force recreation of the training_history table
        to ensure schema consistency.
        """
        # Ensure training_history schema is up-to-date.
        self.con.execute("DROP TABLE IF EXISTS training_history")

        # Define the primary training history table.
        # machine_level is used for exercises where weight isn't the only metric.
        # rpe (Rate of Perceived Exertion) is critical for fatigue management.
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS training_history (
                row_id BIGINT,
                date DATE,
                workout VARCHAR,
                exercise VARCHAR,
                set_number INTEGER,
                reps INTEGER,
                duration_seconds INTEGER,
                weight_kg DOUBLE,
                machine_level DOUBLE,
                warm_up VARCHAR,
                rpe DOUBLE,
                notes VARCHAR
            );
        """)

        # Define a demo table that can be reset/toggled easily.
        self.con.execute("DROP TABLE IF EXISTS demo_training_history")
        self.con.execute("""
            CREATE TABLE demo_training_history (
                row_id BIGINT,
                date DATE,
                workout VARCHAR,
                exercise VARCHAR,
                set_number INTEGER,
                reps INTEGER,
                duration_seconds INTEGER,
                weight_kg DOUBLE,
                machine_level DOUBLE,
                warm_up VARCHAR,
                rpe DOUBLE,
                notes VARCHAR
            );
        """)

        # Define the weight history table for body composition tracking.
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS weight_history (
                date DATE PRIMARY KEY,
                weight_kg DOUBLE
            );
        """)

        # Load Initial Data from CSV if the file exists.
        # This allows for a 'cold start' with existing records.
        if os.path.exists(CSV_PATH):
            try:
                # Synchronize both tables initially.
                for target in ["training_history", "demo_training_history"]:
                    self.con.execute(f"DELETE FROM {target}")
                    self.con.execute(f"""
                        INSERT INTO {target}
                        SELECT row_number() OVER () as row_id, *
                        FROM read_csv_auto('{CSV_PATH}', header=True)
                    """)
                print(f"Loaded CSV into both tables from {CSV_PATH}")
            except Exception as e:
                # Log error but don't crash if CSV is malformed.
                print(f"Error loading CSV: {e}")

    def toggle_demo_mode(self, enabled: bool):
        """
        Switches the active data source between user and demo tables.

        Args:
            enabled: If True, all subsequent queries use demo_training_history.
        """
        self.active_table = "demo_training_history" if enabled else "training_history"
        print(f"Switched to {self.active_table} (Demo: {enabled})")

    def import_user_data(self, file_path: str):
        """
        Replaces user data with content from a new CSV file.

        This is an 'overwrite' operation. It assigns new row IDs for
        chronological integrity checks.

        Args:
            file_path: Path to the CSV file.
        """
        try:
            self.con.execute("DELETE FROM training_history")
            self.con.execute(f"""
                INSERT INTO training_history
                SELECT row_number() OVER () as row_id, *
                FROM read_csv_auto('{file_path}', header=True)
            """)
            return {
                "status": "success",
                "rows": self.con.execute(
                    "SELECT COUNT(*) FROM training_history"
                ).fetchone()[0],
            }
        except Exception as e:
            # Propagate exception to the router for proper HTTP response.
            raise e

    def log_workout(self, entry: WorkoutLogEntry):
        """
        Inserts a single workout log entry into the primary user table.
        This operation is always performed on 'training_history'.

        Args:
            entry: A Pydantic model containing workout details.
        """
        # Auto-calculate next row_id based on current maximum.
        res = self.con.execute("SELECT MAX(row_id) FROM training_history").fetchone()
        next_id = (res[0] or 0) + 1 if res else 1

        query = """
            INSERT INTO training_history (row_id, date, workout, exercise, set_number, reps, weight_kg, rpe, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        self.con.execute(
            query,
            [
                next_id,
                entry.date,
                entry.workout,
                entry.exercise,
                entry.set_number,
                entry.reps,
                entry.weight_kg,
                entry.rpe,
                entry.notes,
            ],
        )

    def log_weight(self, date_val: date, weight_kg: float):
        """
        Logs weight for a specific date, overwriting if an entry already exists.

        Args:
            date_val: The date of the measurement.
            weight_kg: Body weight in kg.
        """
        query = """
            INSERT INTO weight_history (date, weight_kg)
            VALUES (?, ?)
            ON CONFLICT (date) DO UPDATE SET weight_kg = EXCLUDED.weight_kg
        """
        self.con.execute(query, [date_val, weight_kg])

    def get_weight_history(self) -> List[Dict[str, Any]]:
        """
        Retrieves ordered weight history for trend visualization.
        """
        query = "SELECT date, weight_kg FROM weight_history ORDER BY date ASC"
        results = self.con.execute(query).fetchall()
        return [{"date": str(r[0]), "weight_kg": r[1]} for r in results]

    def get_latest_date(self) -> date:
        """
        Returns the date of the most recent entry in the active table.
        Used for determining the 'current week' window.
        """
        res = self.con.execute(f"SELECT MAX(date) FROM {self.active_table}").fetchone()
        if res and res[0]:
            return res[0]
        return date.today()

    def get_overview_metrics(self) -> Dict[str, Any]:
        """
        Calculates high-level KPIs for the current training week.

        Returns:
            Weekly frequency, total volume load, and count of 'Weak Point' workouts.
        """
        latest_date = self.get_latest_date()
        # Assume ISO week start (Monday).
        start_of_week = latest_date - timedelta(days=latest_date.weekday())

        # Frequency: Number of unique days trained this week.
        freq = (
            self.con.execute(
                f"""
            SELECT COUNT(DISTINCT date) 
            FROM {self.active_table} 
            WHERE date >= ? AND date <= ?
        """,
                [start_of_week, latest_date],
            ).fetchone()[0]
            or 0
        )

        # Volume Load: Sum of (Weight * Reps) for all sets this week.
        vol = (
            self.con.execute(
                f"""
            SELECT SUM(weight_kg * reps) 
            FROM {self.active_table} 
            WHERE date >= ? AND date <= ? AND weight_kg IS NOT NULL AND reps IS NOT NULL
        """,
                [start_of_week, latest_date],
            ).fetchone()[0]
            or 0.0
        )

        # Weak Points: Count of sessions tagged as targeting a specific weakness.
        weak_count = (
            self.con.execute(
                f"""
            SELECT COUNT(*) 
            FROM {self.active_table} 
            WHERE date >= ? AND date <= ? AND workout ILIKE '%Weak Point%'
        """,
                [start_of_week, latest_date],
            ).fetchone()[0]
            or 0
        )

        return {
            "weekly_frequency": freq,
            "total_volume_load_current_week": vol,
            "active_weak_points_count": weak_count,
            "is_demo": self.active_table == "demo_training_history",
        }

    def get_trends(
        self, metric: str, exercise: Optional[str] = None
    ) -> List[TrendPoint]:
        """
        Aggregates historical data into trend points for charting.

        Args:
            metric: The name of the metric to trend (volume_load, average_rpe, etc.)
            exercise: Optional filter to trend a single exercise.
        """
        filter_clause = "AND exercise = ?" if exercise else ""
        params = [exercise] if exercise else []
        table = self.active_table

        if metric == "volume_load":
            query = f"""
                SELECT date, SUM(weight_kg * reps) as value
                FROM {table}
                WHERE weight_kg IS NOT NULL AND reps IS NOT NULL {filter_clause}
                GROUP BY date
                ORDER BY date
            """
        elif metric == "average_rpe":
            query = f"""
                SELECT date, AVG(rpe) as value
                FROM {table}
                WHERE rpe IS NOT NULL {filter_clause}
                GROUP BY date
                ORDER BY date
            """
        elif metric == "max_weight":
            # Handles both free weights and machines by coalescing.
            query = f"""
                SELECT date, MAX(COALESCE(machine_level, 0) + COALESCE(weight_kg, 0)) as value
                FROM {table}
                WHERE (weight_kg IS NOT NULL OR machine_level IS NOT NULL) {filter_clause}
                GROUP BY date
                ORDER BY date
            """
        elif metric == "weekly_frequency":
            query = f"""
                SELECT date_trunc('week', date) as week_start, COUNT(DISTINCT date) as value
                FROM {table}
                {"WHERE exercise = ?" if exercise else ""}
                GROUP BY week_start
                ORDER BY week_start
            """
        else:
            return []

        results = self.con.execute(query, params).fetchall()
        return [TrendPoint(date=r[0], value=float(r[1])) for r in results]

    def get_recent_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Retrieves the raw log entries for recent activity.
        """
        query = f"""
            SELECT date, workout, exercise, set_number, reps, weight_kg, rpe, notes
            FROM {self.active_table}
            ORDER BY date DESC
            LIMIT ?
        """
        results = self.con.execute(query, [limit]).fetchall()
        return [
            {
                "date": str(r[0]),
                "workout": r[1],
                "exercise": r[2],
                "set_number": r[3],
                "reps": r[4],
                "weight_kg": r[5],
                "rpe": r[6],
                "notes": r[7],
            }
            for r in results
        ]

    def get_progression_analysis(self) -> Dict[str, Any]:
        """
        Identifies exercises with the most significant strength increases.
        Compares the starting weight with the most recent weight for each exercise.
        """
        table = self.active_table
        progression_query = f"""
            WITH exercise_bounds AS (
                SELECT 
                    exercise, 
                    MIN(date) as first_date, 
                    MAX(date) as last_date
                FROM {table}
                WHERE weight_kg IS NOT NULL
                GROUP BY exercise
            ),
            first_weights AS (
                SELECT t.exercise, AVG(t.weight_kg) as start_weight
                FROM {table} t
                JOIN exercise_bounds e ON t.exercise = e.exercise AND t.date = e.first_date
                GROUP BY t.exercise
            ),
            last_weights AS (
                SELECT t.exercise, AVG(t.weight_kg) as end_weight
                FROM {table} t
                JOIN exercise_bounds e ON t.exercise = e.exercise AND t.date = e.last_date
                GROUP BY t.exercise
            )
            SELECT 
                f.exercise, 
                f.start_weight, 
                l.end_weight, 
                (l.end_weight - f.start_weight) as weight_diff
            FROM first_weights f
            JOIN last_weights l ON f.exercise = l.exercise
            WHERE weight_diff != 0
            ORDER BY weight_diff DESC
        """
        progression = self.con.execute(progression_query).fetchall()

        # Brief summary of the last few workouts.
        summary_query = f"""
            SELECT date, workout, COUNT(*) as sets, SUM(weight_kg * reps) as volume
            FROM {table}
            GROUP BY date, workout
            ORDER BY date DESC
            LIMIT 5
        """
        summaries = self.con.execute(summary_query).fetchall()
        return {
            "top_progressions": [
                {
                    "exercise": r[0],
                    "start_weight": r[1],
                    "end_weight": r[2],
                    "diff": r[3],
                }
                for r in progression[:5]
            ],
            "recent_workout_summaries": [
                {"date": str(r[0]), "workout": r[1], "sets": r[2], "volume": r[3]}
                for r in summaries
            ],
        }

    def get_exercises(self) -> List[str]:
        """
        Returns a sorted list of all unique exercise names recorded.
        """
        res = self.con.execute(
            f"SELECT DISTINCT exercise FROM {self.active_table} ORDER BY exercise"
        ).fetchall()
        return [r[0] for r in res if r[0]]

    def get_exercise_stats(self, exercise: str) -> Dict[str, Any]:
        """
        Calculates lifetime stats for a specific exercise.
        """
        query = f"""
            SELECT 
                MAX(weight_kg) as max_weight,
                MAX(machine_level) as max_level,
                AVG(rpe) as avg_rpe,
                SUM((COALESCE(machine_level, 0) + COALESCE(weight_kg, 0)) * reps) as total_volume,
                COUNT(*) as total_sets
            FROM {self.active_table}
            WHERE exercise = ?
        """
        res = self.con.execute(query, [exercise]).fetchone()
        if not res or (res[0] is None and res[1] is None):
            return {
                "max_weight": 0.0,
                "max_level": 0.0,
                "average_rpe": 0.0,
                "total_volume": 0.0,
                "total_sets": 0,
            }

        return {
            "max_weight": res[0] or 0.0,
            "max_level": res[1] or 0.0,
            "average_rpe": res[2] or 0.0,
            "total_volume": res[3] or 0.0,
            "total_sets": res[4] or 0,
        }

    async def get_automated_insights(
        self, exercise: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Heuristic-based insight generation engine.

        Identifies:
        1. Data Integrity Issues (log entries out of sequence).
        2. Stagnation (no load increase in 3 sessions).
        3. Significant Progress (>5% increase in 30 days).
        4. High RPE Alerts (Avg RPE > 9 in the last week).
        """
        insights = []
        table = self.active_table

        # 0. Data Integrity Check (Chronology Anomaly)
        # Identifies when a record appears later in the file but has an earlier year.
        integrity_query = f"""
            WITH ordered_history AS (
                SELECT date, row_id,
                       LAG(date) OVER (ORDER BY row_id) as prev_date
                FROM {table}
            )
            SELECT DISTINCT date, prev_date
            FROM ordered_history
            WHERE date IS NOT NULL AND prev_date IS NOT NULL
              AND EXTRACT(YEAR FROM date) < EXTRACT(YEAR FROM prev_date)
            LIMIT 1
        """
        try:
            anomalies = self.con.execute(integrity_query).fetchall()
            for date_err, prev_date in anomalies:
                insights.append(
                    {
                        "type": "critical",
                        "category": "integrity",
                        "message": f"Data entry error? {date_err.strftime('%b %d, %Y')} follows {prev_date.strftime('%b %d, %Y')} in your logs.",
                    }
                )
        except Exception as e:
            print(f"Integrity check error: {e}")

        filter_clause = "AND exercise = ?" if exercise else ""
        params = [exercise] if exercise else []

        # 1. Stagnation Detection
        # Triggers if the maximum weight for an exercise hasn't changed in the last 3 sessions.
        stagnation_query = f"""
            WITH ranked_workouts AS (
                SELECT 
                    exercise, 
                    date, 
                    MAX(COALESCE(weight_kg, machine_level)) as max_val,
                    ROW_NUMBER() OVER(PARTITION BY exercise ORDER BY date DESC) as rn
                FROM {table}
                WHERE (weight_kg IS NOT NULL OR machine_level IS NOT NULL) {filter_clause}
                GROUP BY exercise, date
            )
            SELECT exercise, max_val
            FROM ranked_workouts
            WHERE rn <= 3
            GROUP BY exercise, max_val
            HAVING COUNT(*) >= 3
        """
        stagnated = self.con.execute(stagnation_query, params).fetchall()
        for s in stagnated:
            insights.append(
                {
                    "type": "warning",
                    "category": "stagnation",
                    "exercise": s[0],
                    "message": f"Your performance on {s[0]} hasn't changed in the last 3 sessions. Consider increasing load or reps.",
                }
            )

        # 2. Significant Progress
        # Celebrates a >5% increase in load over the last 30 days.
        progress_query = f"""
            WITH exercise_range AS (
                SELECT 
                    exercise,
                    MIN(COALESCE(weight_kg, machine_level)) FILTER (WHERE date >= current_date - interval '30 days') as min_val,
                    MAX(COALESCE(weight_kg, machine_level)) FILTER (WHERE date >= current_date - interval '30 days') as max_val
                FROM {table}
                WHERE (weight_kg IS NOT NULL OR machine_level IS NOT NULL) {filter_clause}
                GROUP BY exercise
            )
            SELECT exercise, min_val, max_val
            FROM exercise_range
            WHERE max_val > min_val * 1.05
        """
        try:
            progressed = self.con.execute(progress_query, params).fetchall()
            for p in progressed:
                insights.append(
                    {
                        "type": "success",
                        "category": "progress",
                        "exercise": p[0],
                        "message": f"Solid progress on {p[0]}! You've increased your load recently.",
                    }
                )
        except Exception:
            pass

        # 3. High RPE Alert
        # Warns of potential overtraining if average RPE is dangerously high (>9).
        rpe_query = f"""
            SELECT exercise, AVG(rpe) as avg_rpe
            FROM {table}
            WHERE date >= current_date - interval '7 days' AND rpe IS NOT NULL {filter_clause}
            GROUP BY exercise
            HAVING AVG(rpe) > 9
        """
        try:
            high_rpe = self.con.execute(rpe_query, params).fetchall()
            for h in high_rpe:
                insights.append(
                    {
                        "type": "warning",
                        "category": "fatigue",
                        "exercise": h[0],
                        "message": f"Intensity alert for {h[0]} (Avg RPE {h[1]:.1f}). Consider a deload.",
                    }
                )
        except Exception:
            pass

        # Limit findings to keep the UI clean.
        limit = 3 if exercise else 5
        return insights[:limit]


# Singleton instance shared across routers.
analytics = AnalyticsEngine()
