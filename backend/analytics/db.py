import duckdb
import os
from datetime import date, timedelta
from typing import List, Dict, Any
from models import TrendPoint

DB_PATH = "data/analytics.duckdb"
CSV_PATH = "data/gym_data.csv"

class AnalyticsEngine:
    def __init__(self):
        self.con = duckdb.connect(DB_PATH)
        self._init_db()

    def _init_db(self):
        # Check if table exists
        tables = self.con.execute("SHOW TABLES").fetchall()
        if not any(t[0] == 'training_history' for t in tables):
            # Create table matching schema.sql
            self.con.execute("""
                CREATE TABLE training_history (
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
            
            # Load data if CSV exists
            if os.path.exists(CSV_PATH):
                try:
                    # Use AUTO_DETECT to handle formats
                    self.con.execute(f"COPY training_history FROM '{CSV_PATH}' (AUTO_DETECT TRUE, HEADER TRUE);")
                except Exception as e:
                    print(f"Error loading CSV: {e}")

    def get_latest_date(self) -> date:
        res = self.con.execute("SELECT MAX(date) FROM training_history").fetchone()
        if res and res[0]:
            return res[0]
        return date.today()

    def get_overview_metrics(self) -> Dict[str, Any]:
        latest_date = self.get_latest_date()
        # Start of week (Monday) for the latest date
        start_of_week = latest_date - timedelta(days=latest_date.weekday())
        
        # Weekly Frequency (workouts in current week)
        freq_query = """
            SELECT COUNT(DISTINCT date) 
            FROM training_history 
            WHERE date >= ? AND date <= ?
        """
        freq = self.con.execute(freq_query, [start_of_week, latest_date]).fetchone()[0] or 0

        # Total Volume Load Current Week
        vol_query = """
            SELECT SUM(weight_kg * reps) 
            FROM training_history 
            WHERE date >= ? AND date <= ? AND weight_kg IS NOT NULL AND reps IS NOT NULL
        """
        vol = self.con.execute(vol_query, [start_of_week, latest_date]).fetchone()[0] or 0.0

        # Active Weak Points (Workouts labeled 'Weak Point' in current week)
        # Based on contracts/metrics.md interpretation
        weak_query = """
            SELECT COUNT(*) 
            FROM training_history 
            WHERE date >= ? AND date <= ? AND workout ILIKE '%Weak Point%'
        """
        weak_count = self.con.execute(weak_query, [start_of_week, latest_date]).fetchone()[0] or 0

        return {
            "weekly_frequency": freq,
            "total_volume_load_current_week": vol,
            "active_weak_points_count": weak_count
        }

    def get_trends(self, metric: str) -> List[TrendPoint]:
        if metric == "volume_load":
            query = """
                SELECT date, SUM(weight_kg * reps) as value
                FROM training_history
                WHERE weight_kg IS NOT NULL AND reps IS NOT NULL
                GROUP BY date
                ORDER BY date
            """
        elif metric == "average_rpe":
            query = """
                SELECT date, AVG(rpe) as value
                FROM training_history
                WHERE rpe IS NOT NULL
                GROUP BY date
                ORDER BY date
            """
        elif metric == "max_weight":
            query = """
                SELECT date, MAX(weight_kg) as value
                FROM training_history
                WHERE weight_kg IS NOT NULL
                GROUP BY date
                ORDER BY date
            """
        elif metric == "weekly_frequency":
            # Group by week start date
            query = """
                SELECT date_trunc('week', date) as week_start, COUNT(DISTINCT date) as value
                FROM training_history
                GROUP BY week_start
                ORDER BY week_start
            """
        else:
            return []

        results = self.con.execute(query).fetchall()
        return [TrendPoint(date=r[0], value=float(r[1])) for r in results]

# Singleton instance
analytics = AnalyticsEngine()
