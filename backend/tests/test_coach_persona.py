from app.agents.coach import coach_agent
from app.agents.analyst import analyst_agent
from app.agents.orchestrator import coordinator_agent

def test_coach_persona_instruction():
    """Verify Coach agent has the Analytical Scientist instructions."""
    instruction = coach_agent.instruction
    assert "Analytical Scientist" in instruction
    assert "Progressive Overload" in instruction
    assert "SCIENTIFIC TRANSPARENCY" in instruction

def test_analyst_persona_instruction():
    """Verify Analyst agent looks for Overload Opportunities."""
    instruction = analyst_agent.instruction
    assert "Volume Load" in instruction
    assert "OVERLOAD OPPORTUNITY" in instruction

def test_coordinator_persona_instruction():
    """Verify Coordinator orchestrates a Scientific Workflow."""
    instruction = coordinator_agent.instruction
    assert "Scientific Workflow" in instruction
    assert "TRIGGER ANALYST" in instruction
