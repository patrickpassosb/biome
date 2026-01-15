-- Strict schema definition derived from gym_data - Sheet1.csv

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

-- Copy command for ingestion (configured for the specific CSV format)
-- Uses auto-detect for date format if possible, or explicit format if needed. 
-- Assuming standard CSV behavior.
-- COPY training_history FROM 'gym_data - Sheet1.csv' (AUTO_DETECT TRUE);
