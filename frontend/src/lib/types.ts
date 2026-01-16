export type OverviewMetrics = {
  weekly_frequency: number;
  total_volume_load_current_week: number;
  active_weak_points_count: number;
  is_demo: boolean;
};

export type TrendMetric =
  | "volume_load"
  | "average_rpe"
  | "max_weight"
  | "weekly_frequency";

export type TrendPoint = {
  date: string;
  value: number;
};

export type WeeklyPlan = {
  week_start_date: string;
  goal: string;
  workouts: Array<{
    day:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";
    focus: string;
    exercises: Array<{
      name: string;
      target_sets: number;
      target_reps: string;
      target_rpe?: number;
      notes?: string;
    }>;
  }>;
};

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

export type MemoryRecord = {
  id?: string;
  created_at: string;
  type: "plan_snapshot" | "finding_snapshot" | "user_feedback" | "reflection";
  content: Record<string, unknown>;
  tags?: string[];
};

export type RevisePlanRequest = {
  current_plan: WeeklyPlan;
  feedback: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  agent_persona?: string;
};

export type ChatRequest = {
  messages: ChatMessage[];
  current_plan: WeeklyPlan;
};

export type ChatResponse = {
  message: string;
  proposed_plan?: WeeklyPlan;
  agent_persona: string;
};

export type ExerciseStats = {
  max_weight: number;
  max_level: number;
  average_rpe: number;
  total_volume: number;
  total_sets: number;
};

export type WorkoutInsight = {
  type: "info" | "warning" | "success" | "critical";
  category: string;
  exercise?: string;
  message: string;
};

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