import pytest
from datetime import date, timedelta
from analytics.db import AnalyticsEngine

def test_analytics_init(in_memory_db):
    # in_memory_db is an instance of AnalyticsEngine using :memory:
    tables = in_memory_db.con.execute("SHOW TABLES").fetchall()
    assert any(t[0] == 'training_history' for t in tables)

def test_get_latest_date(in_memory_db):
    # We seeded '2023-01-01' in conftest.py
    assert in_memory_db.get_latest_date() == date(2023, 1, 1)

def test_get_overview_metrics(in_memory_db):
    # Add data for "current" week based on seeded latest date
    # Seeded: 2023-01-01 (Sunday)
    # latest_date = 2023-01-01
    # start_of_week = 2023-01-01 - 6 days = 2022-12-26 (Monday)
    
    in_memory_db.con.execute("INSERT INTO training_history (date, workout, weight_kg, reps) VALUES ('2023-01-01', 'Weak Point Workout', 50, 10)")
    
    metrics = in_memory_db.get_overview_metrics()
    assert metrics["weekly_frequency"] == 1 # 2023-01-01 is one distinct date
    assert metrics["total_volume_load_current_week"] >= 500 # 50 * 10
    assert metrics["active_weak_points_count"] == 1

def test_get_trends_volume(in_memory_db):
    trends = in_memory_db.get_trends("volume_load")
    assert len(trends) >= 1
    assert trends[0].value > 0
