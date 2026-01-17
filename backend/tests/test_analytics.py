"""
Unit tests for the DuckDB-based analytics engine.

These tests verify the core SQL aggregation logic, including metric
calculations, trend generation, and automated insight heuristics.
"""

from datetime import date
from analytics.db import analytics


def test_analytics_init():
    """
    Verifies that the AnalyticsEngine correctly initializes the
    required tables in the DuckDB instance.
    """
    # analytics is a singleton instance using ':memory:' due to conftest.py env var.
    tables = analytics.con.execute("SHOW TABLES").fetchall()
    assert any(t[0] == "training_history" for t in tables)


def test_get_latest_date():
    """
    Ensures that the engine can correctly identify the most recent
    activity date, which is used for 'current week' windowing.
    """
    analytics.con.execute("INSERT INTO training_history (date) VALUES ('2023-01-01')")
    assert analytics.get_latest_date() == date(2023, 1, 1)


def test_get_overview_metrics():
    """
    Tests the high-level KPI calculation for a specific training week.
    Verifies frequency, volume load, and weak point detection.
    """
    # Insert seed data for a 'Weak Point' session on Jan 1st, 2023.
    analytics.con.execute(
        "INSERT INTO training_history (date, workout, weight_kg, reps) VALUES ('2023-01-01', 'Weak Point Workout', 50, 10)"
    )

    metrics = analytics.get_overview_metrics()
    assert metrics["weekly_frequency"] == 1  # One distinct day
    assert metrics["total_volume_load_current_week"] >= 500  # 50kg * 10 reps
    assert metrics["active_weak_points_count"] == 1  # Correct workout string match


def test_get_trends_volume():
    """
    Tests the time-series aggregation for volume load trends.
    """
    # Add historical data point.
    analytics.con.execute(
        "INSERT INTO training_history (date, weight_kg, reps) VALUES ('2023-01-01', 50, 10)"
    )
    trends = analytics.get_trends("volume_load")
    assert len(trends) >= 1
    assert trends[0].value > 0
