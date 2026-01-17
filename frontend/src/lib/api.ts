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
  UserBio,
  UserBioInput,
} from "./types";

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
  UserBio,
  UserBioInput,
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

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

export function getOverviewMetrics() {
  return fetchJson<OverviewMetrics>("/metrics/overview");
}

export function getTrend(metric: TrendMetric, exercise?: string) {
  const params = new URLSearchParams({ metric });
  if (exercise) params.append("exercise", exercise);
  return fetchJson<TrendPoint[]>(`/metrics/trends?${params.toString()}`);
}

export function getExercises() {
  return fetchJson<string[]>("/metrics/exercises");
}

export function getExerciseStats(exercise: string) {
  return fetchJson<ExerciseStats>(`/metrics/exercise-stats/${encodeURIComponent(exercise)}`);
}

export function getInsights(exercise?: string) {
  const params = new URLSearchParams();
  if (exercise) params.append("exercise", exercise);
  return fetchJson<WorkoutInsight[]>(`/metrics/insights?${params.toString()}`);
}

export function proposeWeeklyPlan() {
  return fetchJson<WeeklyPlan>("/plan/propose", {
    method: "POST",
  });
}

export function reviseWeeklyPlan(req: RevisePlanRequest) {
  return fetchJson<WeeklyPlan>("/plan/revise", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function getMemoryTimeline(limit: number) {
  return fetchJson<MemoryRecord[]>(
    `/memory/timeline?limit=${encodeURIComponent(limit)}`,
  );
}

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

export function chatWithAgent(req: ChatRequest) {
  return fetchJson<ChatResponse>("/agent/chat", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function toggleDemoMode(enabled: boolean) {
  return fetchJson<{ status: string; mode: string }>("/data/demo", {
    method: "POST",
    body: JSON.stringify({ enabled }),
  });
}

export function importUserData(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  // Custom fetch because fetchJson assumes JSON body/headers
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

export function logWorkout(entry: WorkoutLogEntry) {
  return fetchJson<{ status: string }>("/data/log", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export function logWeight(weight_kg: number, date: string) {
  return fetchJson<{ status: string }>("/metrics/weight", {
    method: "POST",
    body: JSON.stringify({ weight_kg, date }),
  });
}

export function getWeightHistory() {
  return fetchJson<WeightEntry[]>("/metrics/weight/history");
}

export function getUserBio(userId: string) {
  return fetchJson<UserBio>(`/data/bio/${encodeURIComponent(userId)}`);
}

export function saveUserBio(bio: UserBioInput) {
  return fetchJson<UserBio>("/data/bio", {
    method: "POST",
    body: JSON.stringify(bio),
  });
}
