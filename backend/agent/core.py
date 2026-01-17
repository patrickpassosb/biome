import os
import json
import google.generativeai as genai
from datetime import date

from models import WeeklyPlan, PlanValidationResult, ChatRequest, ChatResponse
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

class BiomeTeam:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.model = None
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-flash-latest')
        else:
            print("Warning: GOOGLE_API_KEY not set. Agent will use mock responses.")

    def _get_context(self) -> str:
        metrics = analytics.get_overview_metrics()
        history = analytics.get_recent_history(limit=30)
        progression = analytics.get_progression_analysis()
        weight_history = analytics.get_weight_history()
        return (
            f"Current Metrics: {json.dumps(metrics)}\n"
            f"Recent Training History (Last 30 sets): {json.dumps(history)}\n"
            f"Progression & Trend Analysis: {json.dumps(progression)}\n"
            f"Weight History (Evolution): {json.dumps(weight_history)}"
        )

    def chat(self, request: ChatRequest) -> ChatResponse:
        if not self.model:
            return ChatResponse(
                message="I'm in mock mode, but I hear you!",
                agent_persona="Mock Coach"
            )

        context = self._get_context()
        schema = ChatResponse.model_json_schema()
        
        # System instructions as part of the prompt for now (Gemini Flash style)
        prompt = f"""
        You are 'Biome Team', a collective of elite AI training specialists:
        1. **Workout Specialist**: Deep knowledge of strength, hypertrophy, and biomechanics. Analyzes gym data, volume, and progressive overload.
        2. **Nutrition Guru**: Experts in fueling for performance, recovery, and gene-specific optimization.
        3. **Sleep/Recovery Expert**: Focused on circadian rhythms, HRV, and CNS recovery.

        IMPORTANT: If the 'Context' below shows no training history, the user is NEW. 
        Your goal is to perform a 'Cold Start Onboarding':
        - Ask about their training experience, goals (Strength vs Hypertrophy), and availability (days per week).
        - Once you have enough info, propose their FIRST Weekly Plan.
        - Be encouraging and helpful.

        Context (User Data & Trends):
        {context}

        Current User Plan:
        {request.current_plan.model_dump_json()}

        Conversation History:
        {[f"{m.role}: {m.content}" for m in request.messages[:-1]]}

        Current Message:
        "{request.messages[-1].content}"

        Operational Rules:
        - Talk naturally and empathetically. Don't be too narrow; be broad and helpful (sleep, nutrition, etc.).
        - Use the data provided. If the user asks about progress, cite the 'Progression & Trend Analysis'.
        - **MANDATORY**: If the user needs a plan change, DO NOT apply it yet. 
            - Include the draft changes in the 'proposed_plan' field.
            - In your 'message', tell the user what you've drafted and ASK for their permission to apply it.
        - Select the most appropriate persona to lead the response (e.g., "Nutrition Guru" for food questions).

        Return JSON matching this schema:
        {json.dumps(schema, indent=2)}
        """

        try:
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return ChatResponse.model_validate_json(response.text)
        except Exception as e:
            print(f"Agent chat failed: {e}")
            return ChatResponse(
                message="I encountered an issue processing that. Can you try again?",
                agent_persona="System"
            )

    def propose_plan(self) -> WeeklyPlan:
        # Re-using the logic but encapsulated in the new BiomeTeam
        # ... (implementation remains similar but internal to BiomeTeam)
        if not self.model:
            return WeeklyPlan(**MOCK_PLAN)
        context = self._get_context()
        schema = WeeklyPlan.model_json_schema()
        prompt = f"You are Biome Workout Specialist. Generate a plan. Context: {context}. Schema: {json.dumps(schema)}"
        try:
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return WeeklyPlan.model_validate_json(response.text)
        except Exception:
            return WeeklyPlan(**MOCK_PLAN)

    def validate_plan(self, plan: WeeklyPlan) -> PlanValidationResult:
        if not self.model:
            return PlanValidationResult(valid=True, issues=[])
        context = self._get_context()
        prompt = f"Validate this plan: {plan.model_dump_json()}. Context: {context}"
        try:
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return PlanValidationResult.model_validate_json(response.text)
        except Exception:
            return PlanValidationResult(valid=True, issues=[])

agent = BiomeTeam()
