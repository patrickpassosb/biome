/**
 * Central type definitions for the Biome frontend.
 *
 * These interfaces and types strictly mirror the backend Pydantic models
 * to ensure end-to-end type safety and predictable data flow.
 */

/**
 * Complete definition of a weekly training protocol.
 */
export type WeeklyPlan = {
  week_start_date: string;
  goal: string; // High-level objective
  workouts: Array<{
    day:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";
    focus: string; // Session focus (e.g. 'Push', 'Pull')
    exercises: Array<{
      name: string;
      target_sets: number;
      target_reps: string;
      target_rpe?: number;
      notes?: string; // AI-generated coaching cues
    }>;
  }>;
};

/**
 * Request payload for AI-driven plan updates.
 */
export type RevisePlanRequest = {
  current_plan: WeeklyPlan;
  feedback: string;
};

/**
 * Individual entry in the agent chat interface.
 */
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  agent_persona?: string; // e.g. 'Nutrition Specialist'
};

/**
 * Request for a stateful multi-agent conversation.
 */
export type ChatRequest = {
  messages: ChatMessage[];
  current_plan: WeeklyPlan; // System state context
};

/**
 * Response from the AI Coordinator.
 */
export type ChatResponse = {
  message: string;
  proposed_plan?: WeeklyPlan; // Optional new plan generated during chat
  agent_persona: string;
};

/**
 * User profile payload stored in the backend.
 */
export type UserProfile = {
  user_id: string;
  name?: string | null;
  bio?: string | null;
  wage_per_hour?: number | null;
  
  sex: "male" | "female" | "other";
  date_of_birth: string; // ISO format: YYYY-MM-DD
  age: number;
  goal: "build_muscle" | "lose_fat";
  experience_level: "beginner" | "intermediate" | "advanced";
  updated_at: string;
};

/**
 * Update payload for the profile form.
 */
export type UserProfileUpdatePayload = {
  name?: string;
  bio?: string;
  wage_per_hour?: number;
  
  sex?: "male" | "female" | "other";
  date_of_birth?: string;
  age?: number;
  goal?: "build_muscle" | "lose_fat";
  experience_level?: "beginner" | "intermediate" | "advanced";
};
