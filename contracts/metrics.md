# Computed Metrics

These metrics are derived directly from the `training_history` table.

## Base Metrics
- **Volume Load**: `weight_kg * reps` (for weight exercises)
- **Tonnage**: Sum of Volume Load per workout/week.
- **Intensity (RPE)**: Average RPE per exercise/workout.
- **Frequency**: Count of distinct `date` per week.

## Derived Metrics
- **Max Strength**: Max `weight_kg` for a specific `exercise` (e.g., "1RM est" if formula applied, or simple max).
- **ConsistencyScore**: (Actual Workouts / Planned Workouts) - *Requires Plan context, but base consistency is just frequency*.
- **ProgressOverload**: Change in `weight_kg` or `reps` for same `exercise` over time.
- **SetVolume**: Count of sets (`set_number`) per muscle group (derived from mapping `exercise` to muscle group, identifying implied muscle group from `Workout` name like "Pull day").

## Weak Point Analysis
- **WeakPointFrequency**: Count of workouts labeled "Weak Point" in `workout` column.
- **FailureRate**: Implicit if RPE = 10 (or failure flagged in notes).

## Strict Schema usage
JSON schemas will reference these keys:
- `volume_load`
- `average_rpe`
- `max_weight`
- `weekly_frequency`
- `set_count`
