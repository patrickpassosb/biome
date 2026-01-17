-- Biome Training History Schema
-- This schema is designed for DuckDB to support high-performance analytical queries.
-- It matches the structure of common workout logging CSV exports.

-- Table: training_history
-- This is the primary table for storing individual exercise sets.
CREATE TABLE training_history (
    date DATE,              -- The date the session took place.
    workout VARCHAR,       -- User-defined name for the workout session.
    exercise VARCHAR,      -- The name of the exercise (e.g., 'Squat', 'Bench Press').
    set_number INTEGER,    -- Sequence number for the set within the exercise.
    reps INTEGER,          -- Number of repetitions performed.
    duration_seconds INTEGER, -- Optional: Time taken for the set (for endurance/tempo).
    weight_kg DOUBLE,      -- Resistance weight in kilograms.
    machine_level DOUBLE,  -- Alternative for machine-based exercises (Level 1, 2, etc.).
    warm_up VARCHAR,       -- Flag/Note for warm-up vs work sets.
    rpe DOUBLE,            -- Rate of Perceived Exertion (Scale of 1-10).
    notes VARCHAR          -- User-added notes for specific sets.
);

-- Note on Ingestion:
-- DuckDB's read_csv_auto is typically used in the Python logic (db.py)
-- to dynamically load data without manual COPY commands.
