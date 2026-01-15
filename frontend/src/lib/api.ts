import type {
  MemoryRecord,
  OverviewMetrics,
  TrendMetric,
  TrendPoint,
  WeeklyPlan,
  RevisePlanRequest,
  ChatRequest,
  ChatResponse,
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

export function getTrend(metric: TrendMetric) {
  return fetchJson<TrendPoint[]>(
    `/metrics/trends?metric=${encodeURIComponent(metric)}`,
  );
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
