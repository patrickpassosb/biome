from datetime import date
from analytics.db import analytics


def test_analytics_init():
    # analytics is an instance of AnalyticsEngine using :memory:
    tables = analytics.con.execute("SHOW TABLES").fetchall()
    assert any(t[0] == "training_history" for t in tables)


def test_get_latest_date():
    # We seeded '2023-01-01' in conftest.py
    analytics.con.execute("INSERT INTO training_history (date) VALUES ('2023-01-01')")
    assert analytics.get_latest_date() == date(2023, 1, 1)


def test_get_overview_metrics():
    # Add data for "current" week based on seeded latest date
    # Seeded: 2023-01-01 (Sunday)
    # latest_date = 2023-01-01
    # start_of_week = 2023-01-01 - 6 days = 2022-12-26 (Monday)

    analytics.con.execute(
        "INSERT INTO training_history (date, workout, weight_kg, reps) VALUES ('2023-01-01', 'Weak Point Workout', 50, 10)"
    )

    metrics = analytics.get_overview_metrics()
    assert metrics["weekly_frequency"] == 1  # 2023-01-01 is one distinct date
    assert metrics["total_volume_load_current_week"] >= 500  # 50 * 10
    assert metrics["active_weak_points_count"] == 1


def test_get_trends_volume():
    # Insert data so there's something to trend
    analytics.con.execute(
        "INSERT INTO training_history (date, weight_kg, reps) VALUES ('2023-01-01', 50, 10)"
    )
    trends = analytics.get_trends("volume_load")
    assert len(trends) >= 1
    assert trends[0].value > 0
