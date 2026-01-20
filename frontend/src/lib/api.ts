/**
 * API client module for interacting with the Biome backend.
 *
 * This module provides a set of typed asynchronous functions for fetching
 * metrics, trends, AI-generated plans, and managing persistent memory.
 */

import type {
  MemoryRecord,
  OverviewMetrics,
  TrendMetric,
  TrendPoint,
  WeeklyPlan,
  RevisePlanRequest,
  ChatRequest,
  ChatResponse,
  ExerciseStats,
  WorkoutInsight,
  WorkoutLogEntry,
  WeightEntry,
  UserProfile,
  UserProfileUpdatePayload,
} from "./types";

// Re-export types for convenient access from other modules.
export type {
  MemoryRecord,
  OverviewMetrics,
  TrendMetric,
  TrendPoint,
  WeeklyPlan,
  RevisePlanRequest,
  ChatRequest,
  ChatResponse,
  WorkoutInsight,
  ExerciseStats,
  WorkoutLogEntry,
  WeightEntry,
  UserProfile,
  UserProfileUpdatePayload,
};

// Base URL for the API, defaults to relative path in development/production.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * Generic helper to perform typed fetch requests with error handling.
 *
 * @param path - The API endpoint relative path.
 * @param options - Standard fetch RequestInit options.
 * @returns A promise resolving to the parsed JSON body of type T.
 * @throws Error if the response status is not OK (2xx).
 */
async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

/**
 * Retrieves high-level weekly KPIs (Frequency, Volume, Weak Points).
 */
export function getOverviewMetrics() {
  return fetchJson<OverviewMetrics>("/metrics/overview");
}

/**
 * Retrieves historical trend data for charting.
 *
 * @param metric - The specific KPI to trend (e.g., 'volume_load').
 * @param exercise - Optional exercise name to filter the trend.
 */
export function getTrend(metric: TrendMetric, exercise?: string) {
  const params = new URLSearchParams({ metric });
  if (exercise) params.append("exercise", exercise);
  return fetchJson<TrendPoint[]>(`/metrics/trends?${params.toString()}`);
}

/**
 * Fetches a unique list of all exercises recorded in the user's history.
 */
export function getExercises() {
  return fetchJson<string[]>("/metrics/exercises");
}

/**
 * Retrieves aggregated statistics for a specific exercise.
 *
 * @param exercise - The encoded exercise name.
 */
export function getExerciseStats(exercise: string) {
  return fetchJson<ExerciseStats>(`/metrics/exercise-stats/${encodeURIComponent(exercise)}`);
}

/**
 * Triggers heuristic analysis to find patterns like stagnation or significant progress.
 */
export function getInsights(exercise?: string) {
  const params = new URLSearchParams();
  if (exercise) params.append("exercise", exercise);
  return fetchJson<WorkoutInsight[]>(`/metrics/insights?${params.toString()}`);
}

/**
 * Requests the AI Coach to generate a fresh weekly training protocol.
 */
export function proposeWeeklyPlan() {
  return fetchJson<WeeklyPlan>("/plan/propose", {
    method: "POST",
  });
}

/**
 * Requests a plan revision based on natural language feedback.
 */
export function reviseWeeklyPlan(req: RevisePlanRequest) {
  return fetchJson<WeeklyPlan>("/plan/revise", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

/**
 * Retrieves the recent chronological history of coaching signals.
 */
export function getMemoryTimeline(limit: number) {
  return fetchJson<MemoryRecord[]>(
    `/memory/timeline?limit=${encodeURIComponent(limit)}`,
  );
}

/**
 * Performs a keyword search across the long-term memory store.
 */
export function searchMemoryRecords(body: {
  query?: string;
  type?: string;
  limit?: number;
}) {
  return fetchJson<MemoryRecord[]>("/memory/search", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Sends a message to the Multi-Agent system and receives a stateful response.
 */
export function chatWithAgent(req: ChatRequest) {
  return fetchJson<ChatResponse>("/agent/chat", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

/**
 * Switches the backend between user data and a demo dataset.
 */
export function toggleDemoMode(enabled: boolean) {
  return fetchJson<{ status: string; mode: string }>("/data/demo", {
    method: "POST",
    body: JSON.stringify({ enabled }),
  });
}

/**
 * Uploads a raw CSV file for data ingestion.
 * Note: Uses FormData instead of JSON body.
 */
export function importUserData(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return fetch(`${API_BASE_URL}/data/import`, {
    method: "POST",
    body: formData,
  }).then(async (res) => {
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Import failed");
    }
    return res.json();
  });
}

/**
 * Persists a single exercise set manually logged from the dashboard.
 */
export function logWorkout(entry: WorkoutLogEntry) {
  return fetchJson<{ status: string }>("/data/log", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

/**
 * Persists a body weight measurement.
 */
export function logWeight(weight_kg: number, date: string) {
  return fetchJson<{ status: string }>("/metrics/weight", {
    method: "POST",
    body: JSON.stringify({ weight_kg, date }),
  });
}

/**
 * Fetches the complete body weight history for visualization.
 */
export function getWeightHistory() {
  return fetchJson<WeightEntry[]>("/metrics/weight/history");
}

/**
 * Retrieves the user's profile.
 */
export function getProfile() {
  return fetchJson<UserProfile>("/profile");
}

/**
 * Updates the user's profile.
 */
export function updateProfile(body: UserProfileUpdatePayload) {
  return fetchJson<UserProfile>("/profile", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
