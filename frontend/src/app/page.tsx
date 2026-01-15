"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAsyncData } from "./hooks/useAsyncData";
import {
  getMemoryTimeline,
  getOverviewMetrics,
  getTrend,
  proposeWeeklyPlan,
  reviseWeeklyPlan,
  searchMemoryRecords,
} from "@/lib/api";
import type {
  CoachFinding,
  TrendMetric,
  TrendPoint,
  WeeklyPlan,
} from "@/lib/types";

const trendMetrics: Array<{ key: TrendMetric; label: string }> = [
  { key: "volume_load", label: "Volume Load" },
  { key: "average_rpe", label: "Average RPE" },
  { key: "max_weight", label: "Max Weight" },
  { key: "weekly_frequency", label: "Weekly Frequency" },
];

const navItems = [
  { id: "overview", label: "Overview KPIs" },
  { id: "trends", label: "Training Trends" },
  { id: "weak-points", label: "Weak Points" },
  { id: "coach", label: "AI Coach Panel" },
  { id: "plan", label: "Weekly Plan" },
  { id: "memory", label: "Memory Timeline" },
];

function formatNumber(value: number | undefined, suffix?: string) {
  if (value === undefined || Number.isNaN(value)) return "—";
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
  return suffix ? `${formatted}${suffix}` : formatted;
}

function formatDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDateTime(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function SectionCard({
  id,
  title,
  subtitle,
  action,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-3xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-6 shadow-[0_0_40px_-20px_rgba(0,0,0,0.6)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {subtitle && (
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              {subtitle}
            </p>
          )}
          <h2 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function StatusPanel({
  status,
  emptyMessage,
  children,
}: {
  status: { loading: boolean; error: string | null; empty: boolean };
  emptyMessage: string;
  children: React.ReactNode;
}) {
  if (status.loading) {
    return (
      <div className="grid gap-4">
        <div className="h-20 animate-pulse rounded-2xl bg-[color:var(--panel-strong)]" />
        <div className="h-20 animate-pulse rounded-2xl bg-[color:var(--panel-strong)]" />
      </div>
    );
  }

  if (status.error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
        {status.error}
      </div>
    );
  }

  if (status.empty) {
    return (
      <div className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel-strong)] px-4 py-3 text-sm text-[color:var(--muted)]">
        {emptyMessage}
      </div>
    );
  }

  return <>{children}</>;
}

export default function DashboardPage() {
  const overviewState = useAsyncData(getOverviewMetrics, []);
  const trendsState = useAsyncData(async () => {
    const results = await Promise.all(
      trendMetrics.map(async (metric) => ({
        metric,
        data: await getTrend(metric.key),
      })),
    );

    return results;
  }, []);
  const planState = useAsyncData(proposeWeeklyPlan, []);
  const memoryState = useAsyncData(() => getMemoryTimeline(16), []);
  const findingsState = useAsyncData(
    () =>
      searchMemoryRecords({
        type: "finding_snapshot",
        limit: 8,
      }),
    [],
  );

  const [feedback, setFeedback] = useState("");
  const [coachStatus, setCoachStatus] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });
  const [revisedPlan, setRevisedPlan] = useState<WeeklyPlan | null>(null);

  const overview = overviewState.data;
  const trends = trendsState.data ?? [];
  const plan = revisedPlan ?? planState.data;
  const memory = memoryState.data ?? [];

  const coachFindings = useMemo(() => {
    const records = findingsState.data ?? [];
    const findings: Array<CoachFinding & { created_at: string }> = [];

    records.forEach((record) => {
      const content = record.content as { findings?: CoachFinding[] };
      if (Array.isArray(content.findings)) {
        content.findings.forEach((finding) => {
          findings.push({ ...finding, created_at: record.created_at });
        });
      }
    });

    return findings;
  }, [findingsState.data]);

  const handleCoachSubmit = async () => {
    if (!plan) {
      setCoachStatus({ loading: false, error: "No plan available to revise." });
      return;
    }

    if (!feedback.trim()) {
      setCoachStatus({ loading: false, error: "Add feedback to revise the plan." });
      return;
    }

    setCoachStatus({ loading: true, error: null });

    try {
      const updatedPlan = await reviseWeeklyPlan(plan, feedback.trim());
      setRevisedPlan(updatedPlan);
      setFeedback("");
      setCoachStatus({ loading: false, error: null });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to revise plan.";
      setCoachStatus({ loading: false, error: message });
    }
  };

  const memoryHighlights = memory.map((record) => {
    const summary = Object.keys(record.content ?? {}).slice(0, 3);
    return {
      record,
      summary:
        summary.length > 0
          ? summary.join(" · ")
          : "Structured entry",
    };
  });

  return (
    <div className="relative min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 left-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(95,211,195,0.35),transparent_65%)] blur-2xl" />
        <div className="absolute -top-40 right-0 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(255,139,94,0.3),transparent_60%)] blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(120,140,170,0.25),transparent_65%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-6 py-10 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">
              Biome Training Intelligence
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[color:var(--foreground)] md:text-4xl">
              Performance Pulse Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
              Live insights, coach guidance, and training continuity powered by
              Biome analytics. Every panel reflects backend intelligence only.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-full border border-[color:var(--panel-border)] bg-[color:var(--panel)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
            <span className="h-2 w-2 rounded-full bg-[color:var(--accent-secondary)] shadow-[0_0_12px_var(--accent-secondary)]" />
            Synced with backend APIs
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav className="hidden flex-col gap-4 rounded-3xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-5 text-sm text-[color:var(--muted)] lg:flex">
            <p className="text-xs uppercase tracking-[0.3em]">Navigate</p>
            <div className="grid gap-3">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--panel-border)] hover:bg-[color:var(--panel-strong)]"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <div className="mt-auto rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel-strong)] p-4 text-xs">
              <p className="font-semibold text-[color:var(--foreground)]">
                Tip of the week
              </p>
              <p className="mt-2 text-[color:var(--muted)]">
                Keep feedback specific to load, intensity, or recovery so the AI
                coach can tune your plan faster.
              </p>
            </div>
          </nav>

          <main className="grid gap-8">
            <SectionCard
              id="overview"
              title="Overview KPIs"
              subtitle="Weekly signal strength"
            >
              <StatusPanel
                status={{
                  loading: overviewState.loading,
                  error: overviewState.error,
                  empty: !overview,
                }}
                emptyMessage="No KPI metrics available yet."
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel-strong)] p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                      Weekly Frequency
                    </p>
                    <p className="mt-3 text-3xl font-semibold">
                      {formatNumber(overview?.weekly_frequency)}
                    </p>
                    <p className="mt-2 text-xs text-[color:var(--muted)]">
                      Sessions logged
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel-strong)] p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                      Volume Load
                    </p>
                    <p className="mt-3 text-3xl font-semibold">
                      {formatNumber(
                        overview?.total_volume_load_current_week,
                      )}
                    </p>
                    <p className="mt-2 text-xs text-[color:var(--muted)]">
                      Current week total
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel-strong)] p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                      Active Weak Points
                    </p>
                    <p className="mt-3 text-3xl font-semibold">
                      {formatNumber(overview?.active_weak_points_count)}
                    </p>
                    <p className="mt-2 text-xs text-[color:var(--muted)]">
                      Focus areas open
                    </p>
                  </div>
                </div>
              </StatusPanel>
            </SectionCard>

            <SectionCard
              id="trends"
              title="Training Trends"
              subtitle="Load, intensity, and frequency"
            >
              <StatusPanel
                status={{
                  loading: trendsState.loading,
                  error: trendsState.error,
                  empty: trends.length === 0,
                }}
                emptyMessage="Trend data is not available yet."
              >
                <div className="grid gap-6 xl:grid-cols-2">
                  {trends.map(({ metric, data }) => (
                    <div
                      key={metric.key}
                      className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel-strong)] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[color:var(--foreground)]">
                          {metric.label}
                        </p>
                        <span className="text-xs text-[color:var(--muted)]">
                          {data.length} points
                        </span>
                      </div>
                      <div className="mt-4 h-48">
                        {data.length === 0 ? (
                          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[color:var(--panel-border)] text-xs text-[color:var(--muted)]">
                            Awaiting trend samples
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            {/* Recharts responsive chart usage per Context7: https://github.com/recharts/recharts/blob/main/storybook/stories/API/ResponsiveContainer.mdx */}
                            <LineChart data={data as TrendPoint[]}>
                              <CartesianGrid stroke="rgba(120,140,170,0.15)" />
                              <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                stroke="rgba(246,241,232,0.5)"
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                stroke="rgba(246,241,232,0.5)"
                                tickLine={false}
                                axisLine={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  background: "#121826",
                                  borderRadius: "12px",
                                  border: "1px solid rgba(120,140,170,0.3)",
                                  color: "#f6f1e8",
                                }}
                                labelFormatter={(label) =>
                                  `Date: ${formatDate(label)}`
                                }
                              />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#f6b26b"
                                strokeWidth={2.5}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </StatusPanel>
            </SectionCard>

            <SectionCard
              id="weak-points"
              title="Weak Points & Imbalances"
              subtitle="Coach findings"
            >
              <StatusPanel
                status={{
                  loading: findingsState.loading,
                  error: findingsState.error,
                  empty: coachFindings.length === 0,
                }}
                emptyMessage="No coach findings were returned."
              >
                <div className="grid gap-4">
                  {coachFindings.map((finding) => (
                    <div
                      key={`${finding.message}-${finding.created_at}`}
                      className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel-strong)] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[color:var(--foreground)]">
                          {finding.type.replace("_", " ")}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                            finding.severity === "critical"
                              ? "bg-red-500/20 text-red-200"
                              : finding.severity === "warning"
                                ? "bg-amber-400/20 text-amber-100"
                                : "bg-emerald-400/20 text-emerald-100"
                          }`}
                        >
                          {finding.severity}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-[color:var(--muted)]">
                        {finding.message}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--muted)]">
                        {finding.related_metric && (
                          <span className="rounded-full border border-[color:var(--panel-border)] px-3 py-1">
                            {finding.related_metric.replace("_", " ")}
                          </span>
                        )}
                        {finding.related_exercise && (
                          <span className="rounded-full border border-[color:var(--panel-border)] px-3 py-1">
                            {finding.related_exercise}
                          </span>
                        )}
                        <span className="rounded-full border border-[color:var(--panel-border)] px-3 py-1">
                          {formatDateTime(finding.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </StatusPanel>
            </SectionCard>

            <SectionCard
              id="coach"
              title="AI Coach Panel"
              subtitle="Human feedback loop"
              action={
                <button
                  onClick={handleCoachSubmit}
                  disabled={coachStatus.loading}
                  className="rounded-full bg-[color:var(--accent)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#1b120a] transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {coachStatus.loading ? "Updating" : "Submit Feedback"}
                </button>
              }
            >
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div>
                  <p className="text-sm text-[color:var(--muted)]">
                    Give the AI coach tactical feedback. The service will revise
                    the weekly plan using `/plan/revise` and update the viewer
                    below.
                  </p>
                  <textarea
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    placeholder="Example: Emphasize posterior chain volume and reduce RPE on Wednesday..."
                    className="mt-4 min-h-[140px] w-full rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel-strong)] p-4 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)] focus:outline-none"
                  />
                  {coachStatus.error && (
                    <p className="mt-3 text-sm text-red-200">
                      {coachStatus.error}
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel-strong)] p-4 text-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    Coach Status
                  </p>
                  <p className="mt-3 text-sm text-[color:var(--foreground)]">
                    {coachStatus.loading
                      ? "Revising plan with new guidance."
                      : "Ready to refine the plan."}
                  </p>
                  <div className="mt-4 rounded-xl border border-[color:var(--panel-border)] px-3 py-2 text-xs text-[color:var(--muted)]">
                    Uses backend plan revision endpoint and no local analytics.
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              id="plan"
              title="Weekly Plan Viewer"
              subtitle="Generated schedule"
            >
              <StatusPanel
                status={{
                  loading: planState.loading,
                  error: planState.error,
                  empty: !plan,
                }}
                emptyMessage="No weekly plan returned yet."
              >
                {plan && (
                  <div className="grid gap-6">
                    <div className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel-strong)] p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                        Week of {formatDate(plan.week_start_date)}
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {plan.goal}
                      </p>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {plan.workouts.map((workout) => (
                        <div
                          key={`${workout.day}-${workout.focus}`}
                          className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel-strong)] p-4"
                        >
                          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                            {workout.day}
                          </p>
                          <p className="mt-2 text-base font-semibold">
                            {workout.focus}
                          </p>
                          <div className="mt-4 grid gap-3">
                            {workout.exercises.map((exercise) => (
                              <div
                                key={`${exercise.name}-${exercise.target_sets}-${exercise.target_reps}`}
                                className="rounded-xl border border-[color:var(--panel-border)] bg-[#0f1320] px-3 py-2 text-xs text-[color:var(--muted)]"
                              >
                                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                                  {exercise.name}
                                </p>
                                <p className="mt-1">
                                  {exercise.target_sets} sets · {exercise.target_reps} reps
                                  {exercise.target_rpe
                                    ? ` · RPE ${formatNumber(exercise.target_rpe)}`
                                    : ""}
                                </p>
                                {exercise.notes && (
                                  <p className="mt-1 text-[color:var(--muted)]">
                                    {exercise.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </StatusPanel>
            </SectionCard>

            <SectionCard
              id="memory"
              title="Memory Timeline"
              subtitle="Chronological insights"
            >
              <StatusPanel
                status={{
                  loading: memoryState.loading,
                  error: memoryState.error,
                  empty: memory.length === 0,
                }}
                emptyMessage="No memory records returned."
              >
                <div className="grid gap-4">
                  {memoryHighlights.map(({ record, summary }) => (
                    <div
                      key={`${record.created_at}-${record.type}`}
                      className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel-strong)] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[color:var(--foreground)]">
                          {record.type.replace("_", " ")}
                        </p>
                        <span className="text-xs text-[color:var(--muted)]">
                          {formatDateTime(record.created_at)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[color:var(--muted)]">
                        {summary}
                      </p>
                      {record.tags && record.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--muted)]">
                          {record.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-[color:var(--panel-border)] px-3 py-1"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </StatusPanel>
            </SectionCard>
          </main>
        </div>
      </div>
    </div>
  );
}
