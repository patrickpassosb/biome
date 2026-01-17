# Implementation Plan: coaching_logic_20260117

## Phase 1: Analysis & Prompt Engineering
- [x] Task: Review current `coach.py` prompts and identify non-scientific language.
- [x] Task: Update the `System Prompt` to enforce the "Analytical Scientist" persona.
- [x] Task: Inject specific "Progressive Overload" heuristic rules into the prompt logic.

## Phase 2: Orchestration & Data Flow
- [x] Task: Refine `orchestrator.py` to ensure `Analyst` findings (volume, RPE) are passed with high priority to the `Coach`.
- [x] Task: Verify the "Scientific Transparency" pillar by ensuring the coach cites the specific metric that triggered a change.

## Phase 3: Verification
- [x] Task: Write tests in `backend/tests/test_coach_logic.py` with mock data simulating a training plateau.
- [x] Task: Validate that the Coach output adheres to the Weekly Plan JSON schema.
- [x] Task: Conductor - User Manual Verification 'Coaching Logic Stability' (Protocol in workflow.md)
