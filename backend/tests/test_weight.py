"""
Unit tests for body weight tracking functionality.
"""

from datetime import date
from analytics.db import analytics

def test_weight_logging_and_retrieval():
    """
    Verifies that weight entries can be logged and retrieved in chronological order.
    """
    # Clear existing data
    analytics.con.execute("DELETE FROM weight_history")
    
    # Log out-of-order entries
    analytics.log_weight(date(2023, 10, 2), 81.5)
    analytics.log_weight(date(2023, 10, 1), 82.0)
    analytics.log_weight(date(2023, 10, 3), 81.0)
    
    # Retrieve history
    history = analytics.get_weight_history()
    
    assert len(history) == 3
    # Check ordering
    assert history[0]["date"] == "2023-10-01"
    assert history[0]["weight_kg"] == 82.0
    assert history[2]["date"] == "2023-10-03"
    assert history[2]["weight_kg"] == 81.0

def test_weight_overwrite():
    """
    Verifies that logging a weight for an existing date updates the record.
    """
    test_date = date(2023, 11, 1)
    analytics.log_weight(test_date, 80.0)
    analytics.log_weight(test_date, 79.5)
    
    history = analytics.get_weight_history()
    entry = next(h for h in history if h["date"] == str(test_date))
    
    assert entry["weight_kg"] == 79.5
