import json
from pathlib import Path

# Base path for schemas relative to this file
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
SCHEMAS_DIR = BASE_DIR / "contracts" / "schemas"

def load_schema(schema_name: str) -> dict:
    schema_path = SCHEMAS_DIR / schema_name
    with open(schema_path, "r") as f:
        return json.load(f)

COACH_FINDINGS_SCHEMA = load_schema("CoachFindings.schema.json")
MEMORY_RECORD_SCHEMA = load_schema("MemoryRecord.schema.json")
WEEKLY_PLAN_SCHEMA = load_schema("WeeklyPlan.schema.json")
