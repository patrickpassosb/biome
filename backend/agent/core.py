import os
import json
import google.generativeai as genai
from datetime import date

from models import WeeklyPlan, PlanValidationResult, RevisePlanRequest
from analytics.db import analytics

# Fallback/Mock data if no API key
MOCK_PLAN = {
    "week_start_date": str(date.today()),
    "goal": "General Strength (Mock)",
    "workouts": [
        {
            "day": "Monday",
            "focus": "Upper Body",
            "exercises": [
                {"name": "Bench Press", "target_sets": 3, "target_reps": "8-12", "target_rpe": 8.0}
            ]
        }
    ]
}

class BiomeAgent:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.model = None
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            print("Warning: GOOGLE_API_KEY not set. Agent will use mock responses.")

    def _get_context(self) -> str:
        metrics = analytics.get_overview_metrics()
        # TODO: Add recent findings or memory context here
        return f"Current Metrics: {json.dumps(metrics)}"

    def propose_plan(self) -> WeeklyPlan:
        if not self.model:
            return WeeklyPlan(**MOCK_PLAN)

        context = self._get_context()
        prompt = f"""
        You are an expert strength coach (Biome).
        Context: {context}
        
        Task: Generate a weekly workout plan (WeeklyPlan) strictly following the JSON schema.
        Focus on addressing any weak points implied by metrics or general strength if none.
        The week starts on {date.today()}.
        """
        
        try:
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return WeeklyPlan.model_validate_json(response.text)
        except Exception as e:
            print(f"Agent generation failed: {e}")
            return WeeklyPlan(**MOCK_PLAN)

    def revise_plan(self, request: RevisePlanRequest) -> WeeklyPlan:
        if not self.model:
            # Simple mock revision
            plan = request.current_plan.model_copy()
            plan.goal += " (Revised)"
            return plan

        prompt = f"""
        You are an expert strength coach.
        Current Plan: {request.current_plan.model_dump_json()}
        User Feedback: {request.feedback}
        
        Task: Revise the plan to address the feedback. Return the full WeeklyPlan as JSON.
        """
        
        try:
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return WeeklyPlan.model_validate_json(response.text)
        except Exception as e:
            print(f"Agent revision failed: {e}")
            return request.current_plan

    def validate_plan(self, plan: WeeklyPlan) -> PlanValidationResult:
        if not self.model:
            return PlanValidationResult(valid=True, issues=[])

        context = self._get_context()
        prompt = f"""
        You are an expert strength coach.
        Context: {context}
        Plan to Validate: {plan.model_dump_json()}
        
        Task: Validate this plan. Check for:
        1. Volume appropriateness.
        2. Recovery (frequency).
        3. Goal alignment.
        
        Return JSON matching PlanValidationResult: {{ "valid": boolean, "issues": [string] }}
        """
        
        try:
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return PlanValidationResult.model_validate_json(response.text)
        except Exception as e:
            print(f"Agent validation failed: {e}")
            return PlanValidationResult(valid=True, issues=["Validation skipped (error)"])

agent = BiomeAgent()
