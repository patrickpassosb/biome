/**
 * Central type definitions for the Biome frontend.
 *
 * These interfaces and types strictly mirror the backend Pydantic models
 * to ensure end-to-end type safety and predictable data flow.
 */

/**
 * Top-level metrics displayed in the dashboard header.
 */
export type OverviewMetrics = {
  weekly_frequency: number;       // Days trained in the current week.
  total_volume_load_current_week: number; // Total weight * reps moved.
  active_weak_points_count: number; // Number of flagged weak points.
  is_demo: boolean;               // True if viewing sample data.
};

/**
 * Valid metrics for time-series trend requests.
 */
export type TrendMetric =
  | "volume_load"
  | "average_rpe"
  | "max_weight"
  | "weekly_frequency";

/**
 * A single point in a trend chart.
 */
export type TrendPoint = {
  date: string; // ISO format
  value: number;
};

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
 * A data-backed insight from the AI Analyst.
 */
export type CoachFinding = {
  type:
  | "weak_point"
  | "progress"
  | "consistency"
  | "volume_alert"
  | "technique_note";
  message: string;
  severity: "info" | "warning" | "critical";
  related_metric?:
  | "volume_load"
  | "average_rpe"
  | "max_weight"
  | "weekly_frequency"
  | "set_count"
  | "failure_rate";
  related_exercise?: string;
};

/**
 * Persistent snapshot of a coaching event.
 */
export type MemoryRecord = {
  id?: string;
  created_at: string;
  type: "plan_snapshot" | "finding_snapshot" | "user_feedback" | "reflection";
  content: Record<string, unknown>; // Compressed insights
  tags?: string[];
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
 * Aggregated stats for a specific exercise.
 */
export type ExerciseStats = {
  max_weight: number;
  max_level: number;
  average_rpe: number;
  total_volume: number;
  total_sets: number;
};

/**
 * Heuristic-based insight for exercise performance.
 */
export type WorkoutInsight = {
  type: "info" | "warning" | "success" | "critical";
  category: string; // 'stagnation', 'fatigue', etc.
  exercise?: string;
  message: string;
};

/**
 * Data structure for manual workout logging.
 */
export type WorkoutLogEntry = {
  date: string;
  workout: string;
  exercise: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  rpe?: number;
  notes?: string;
};

/**
 * Individual weight measurement entry.
 */
export type WeightEntry = {
  date: string;
  weight_kg: number;
};

/**
 * User profile payload stored in the backend.
 */
export type UserProfile = {
  user_id: string;
  name?: string | null;
  bio?: string | null;
  current_weight_kg?: number | null;
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
  current_weight_kg?: number;
  wage_per_hour?: number;
  
  sex?: "male" | "female" | "other";
  date_of_birth?: string;
  age?: number;
  goal?: "build_muscle" | "lose_fat";
  experience_level?: "beginner" | "intermediate" | "advanced";
  weight_date?: string;
};
