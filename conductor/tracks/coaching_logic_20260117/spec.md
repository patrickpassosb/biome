# Specification: "Analytical Scientist" Coaching Logic

## Overview
This track refines the coaching intelligence of Biome. The AI Coach must transition from generic guidance to a data-obsessed "Analytical Scientist" persona that prioritizes progressive overload based on objective training metrics.

## Requirements
- **Persona Alignment:** Prompts must reflect a professional, scientific tone.
- **Progressive Overload Logic:** The agent must explicitly check for volume plateaus or RPE trends before suggesting increases.
- **Contract-Driven:** All coaching output must strictly follow `contracts/schemas/WeeklyPlan.schema.json`.
- **Data Utilization:** The Coach must consume findings from the Analyst agent (derived from DuckDB) to justify its planning decisions.

## Technical Goals
- Update `backend/app/agents/coach.py` prompts.
- Refine the coordination logic in `backend/app/agents/orchestrator.py` to ensure high-fidelity data flow.
- Implement unit tests verifying that the coach suggests weight increases when volume has plateaued for 2+ weeks.
