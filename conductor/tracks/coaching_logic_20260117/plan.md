# Implementation Plan: coaching_logic_20260117

## Phase 1: Analysis & Prompt Engineering
- [ ] Task: Review current `coach.py` prompts and identify non-scientific language.
- [ ] Task: Update the `System Prompt` to enforce the "Analytical Scientist" persona.
- [ ] Task: Inject specific "Progressive Overload" heuristic rules into the prompt logic.

## Phase 2: Orchestration & Data Flow
- [ ] Task: Refine `orchestrator.py` to ensure `Analyst` findings (volume, RPE) are passed with high priority to the `Coach`.
- [ ] Task: Verify the "Scientific Transparency" pillar by ensuring the coach cites the specific metric that triggered a change.

## Phase 3: Verification
- [ ] Task: Write tests in `backend/tests/test_coach_logic.py` with mock data simulating a training plateau.
- [ ] Task: Validate that the Coach output adheres to the Weekly Plan JSON schema.
- [ ] Task: Conductor - User Manual Verification 'Coaching Logic Stability' (Protocol in workflow.md)
