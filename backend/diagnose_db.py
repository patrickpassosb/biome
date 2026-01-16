import duckdb

con = duckdb.connect('/app/data/analytics.duckdb')
table = 'demo_training_history'
query = f"""
    WITH ordered_history AS (
        SELECT date, row_id,
               LAG(date) OVER (ORDER BY row_id) as prev_date
        FROM {table}
    )
    SELECT row_id, date, prev_date
    FROM ordered_history
    WHERE row_id > 270 AND row_id < 285
"""
print("Checking rows around the anomaly:")
results = con.execute(query).fetchall()
for r in results:
    print(r)

anomaly_query = f"""
    WITH ordered_history AS (
        SELECT date, row_id,
               LAG(date) OVER (ORDER BY row_id) as prev_date
        FROM {table}
    )
    SELECT row_id, date, prev_date
    FROM ordered_history
    WHERE date IS NOT NULL AND prev_date IS NOT NULL
      AND EXTRACT(YEAR FROM date) < EXTRACT(YEAR FROM prev_date)
"""
print("\nRunning anomaly check:")
anomalies = con.execute(anomaly_query).fetchall()
print(f"Anomalies found: {anomalies}")
