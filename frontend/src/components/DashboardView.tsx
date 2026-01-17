/**
 * DashboardView Component
 *
 * The primary interface for Biome. It visualizes training performance through
 * interactive charts, aggregates high-level KPIs, and displays the current
 * AI-generated training protocol.
 */

"use client";

import React, { useState, useMemo } from "react";
import {
    CartesianGrid,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Bar,
    ComposedChart,
} from "recharts";
import {
    Activity,
    BarChart2,
    Calendar,
    History,
    TrendingUp,
    ClipboardList,
    Plus,
    Sparkles,
    Info,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";

// API & Hooks
import type { WeeklyPlan, OverviewMetrics, TrendPoint, MemoryRecord, WorkoutInsight } from "@/lib/api";
import { getTrend, getExercises, getExerciseStats, getInsights } from "@/lib/api";
import { useAsyncData } from "../app/hooks/useAsyncData";

// Specialized Components
import { ExerciseSelector } from "./ExerciseSelector";
import { WorkoutLogger } from "./WorkoutLogger";

/**
 * formatNumber
 * Utility to standardize numeric displays on the dashboard.
 */
function formatNumber(value: number | undefined, suffix?: string) {
    if (value === undefined || Number.isNaN(value)) return "—";
    const formatted = new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 1,
    }).format(value);
    return suffix ? `${formatted}${suffix}` : formatted;
}

/**
 * formatDate
 * Translates ISO strings into 'Month Day' format (e.g., Oct 23).
 */
function formatDate(input: string) {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return input;
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
    }).format(date);
}

/**
 * formatTime
 * Translates timestamps into 'HH:MM' for the memory stream.
 */
function formatTime(input: string) {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return input;
    return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

/**
 * BentoCard Component
 * A consistent wrapper for dashboard modules (Charts, Stats, Memory).
 */
function BentoCard({
    title,
    subtitle,
    children,
    className = "",
    action,
    headerIcon: Icon,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
    headerIcon?: React.ElementType;
}) {
    return (
        <div className={`group relative flex flex-col overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04] ${className}`}>
            <div className="relative z-10 flex items-center justify-between border-b border-white/5 px-6 py-4">
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-5 w-5 text-white/70" />}
                    <div>
                        <h3 className="text-sm font-semibold text-white/90">{title}</h3>
                        {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
                    </div>
                </div>
                {action}
            </div>
            <div className="relative z-10 p-6 flex-1">{children}</div>
        </div>
    );
}

/**
 * StatCard Component
 * Displays a single KPI with its label and trend indicator.
 */
function StatCard({ label, value, subvalue, trend }: { label: string; value: string; subvalue?: string; trend?: "up" | "down" | "neutral" }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-white/40">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-white">{value}</span>
                {trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
            </div>
            {subvalue && <p className="text-xs text-white/30">{subvalue}</p>}
        </div>
    );
}

interface DashboardViewProps {
    overview: OverviewMetrics | null; // Weekly aggregates
    trends: { volume: TrendPoint[]; frequency: TrendPoint[] } | null; // Global trends
    plan: WeeklyPlan | null; // Active workout protocol
    memory: MemoryRecord[]; // Snapshot stream
    loading: boolean; // Global loading state
}

/**
 * InsightIcon Helper
 * Returns the appropriate Lucide icon based on the insight severity/category.
 */
function InsightIcon({ type, category }: { type: WorkoutInsight['type'], category?: string }) {
    if (category === 'integrity') return <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" />;
    switch (type) {
        case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
        case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
        case 'critical': return <AlertTriangle className="h-4 w-4 text-rose-500" />;
        default: return <Info className="h-4 w-4 text-blue-400" />;
    }
}

export function DashboardView({ overview, trends: globalTrends, plan, memory, loading: globalLoading }: DashboardViewProps) {
    // State for filtering the entire dashboard by a single exercise.
    const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
    // State for triggering the 'Log Workout' modal.
    const [loggingExercise, setLoggingExercise] = useState<{ name: string, sets: number } | null>(null);

    // Dynamic data fetching: Exercise metadata.
    const exerciseListState = useAsyncData(getExercises, []);

    // Dynamic data fetching: Automated findings for the current selection.
    const insightsState = useAsyncData(
        () => getInsights(selectedExercise || undefined),
        [selectedExercise]
    );

    // Dynamic data fetching: Specific statistics for the selected exercise.
    const exerciseStatsState = useAsyncData(
        () => selectedExercise ? getExerciseStats(selectedExercise) : Promise.resolve(null),
        [selectedExercise]
    );

    // Dynamic data fetching: Time-series trends (Volume, RPE, Weight) for the selection.
    const exerciseTrendState = useAsyncData(
        async () => {
            if (!selectedExercise) return null;
            const [volume, rpe, weight] = await Promise.all([
                getTrend("volume_load", selectedExercise),
                getTrend("average_rpe", selectedExercise),
                getTrend("max_weight", selectedExercise),
            ]);
            return { volume, rpe, weight };
        },
        [selectedExercise]
    );

    /**
     * Memoized categorization of AI insights.
     * Separates 'Data Integrity' issues (critical) from 'Performance' notes.
     */
    const { integrityInsights, performanceInsights } = useMemo(() => {
        const integrity = (insightsState.data || []).filter(i => i.category === 'integrity');
        const performance = (insightsState.data || []).filter(i => i.category !== 'integrity');
        return { integrityInsights: integrity, performanceInsights: performance };
    }, [insightsState.data]);

    // Handle initial loading state for the main dashboard.
    if (globalLoading && !selectedExercise) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white" />
            </div>
        );
    }

    // Determine which dataset to visualize based on user selection.
    const currentTrends = selectedExercise ? exerciseTrendState.data : globalTrends;
    const stats = exerciseStatsState.data;

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Modal: Manually log an exercise from the protocol list. */}
            {loggingExercise && (
                <WorkoutLogger
                    exerciseName={loggingExercise.name}
                    targetSets={loggingExercise.sets}
                    onClose={() => setLoggingExercise(null)}
                />
            )}

            {/* --- Dashboard Header --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Performance Overview</h2>
                        <p className="text-sm text-white/40">Analyze your progress and get AI-powered insights</p>
                    </div>

                    {/* Critical Alert Banner: Flashes if data entry errors are detected. */}
                    {integrityInsights.length > 0 && (
                        <div className="hidden xl:flex items-center gap-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 animate-pulse">
                            <AlertTriangle className="h-5 w-5 text-rose-500" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] leading-none mb-1">Critical Integrity Alert</span>
                                <p className="text-sm font-medium text-rose-200/90 leading-tight">
                                    {integrityInsights[0].message}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-4">
                    <ExerciseSelector
                        exercises={exerciseListState.data || []}
                        selectedExercise={selectedExercise}
                        onSelect={setSelectedExercise}
                    />
                </div>
            </div>

            {/* --- Top Stat Grid (4 columns) --- */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Module 1: Activity/Frequency */}
                <BentoCard title={selectedExercise ? "Exercise Reps" : "Activity"} headerIcon={Activity}>
                    <StatCard
                        label={selectedExercise ? "Total Sets" : "Frequency"}
                        value={selectedExercise ? formatNumber(stats?.total_sets) : formatNumber(overview?.weekly_frequency)}
                        subvalue={selectedExercise ? "Lifetime sets recorded" : "Sessions this week"}
                    />
                </BentoCard>

                {/* Module 2: Volume/Max Load */}
                <BentoCard title={selectedExercise ? "Max load / Level" : "Volume"} headerIcon={BarChart2}>
                    <StatCard
                        label={selectedExercise ? (stats?.max_level ? "Best Level" : "Best Weight") : "Volume Load"}
                        value={selectedExercise
                            ? (stats?.max_level
                                ? `L${stats.max_level}${stats.max_weight > 0 ? " + " + stats.max_weight + "kg" : ""}`
                                : formatNumber(stats?.max_weight, "kg"))
                            : formatNumber(overview?.total_volume_load_current_week)}
                        subvalue={selectedExercise ? "Personal Record" : "Total kgs moved"}
                        trend="up"
                    />
                </BentoCard>

                {/* Module 3: Average Effort/Weak Points */}
                <BentoCard title={selectedExercise ? "Avg Effort" : "Focus"} headerIcon={ClipboardList}>
                    <StatCard
                        label={selectedExercise ? "Average RPE" : "Active Blip"}
                        value={selectedExercise ? formatNumber(stats?.average_rpe) : formatNumber(overview?.active_weak_points_count)}
                        subvalue={selectedExercise ? "Difficulty score" : "Identified imbalances"}
                    />
                </BentoCard>

                {/* Module 4: Performance Insights (Scrollable List) */}
                <BentoCard title="Performance Insights" headerIcon={Sparkles} className="lg:col-span-1">
                    <div className="space-y-4 max-h-[120px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                        {performanceInsights.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-2 text-center">
                                <p className="text-[10px] text-white/20 italic">No movement insights identified.</p>
                            </div>
                        )}
                        {performanceInsights.map((insight, i) => (
                            <div key={i} className="group relative flex gap-2 rounded-xl border border-white/5 p-2 transition-colors bg-white/(0.02) hover:bg-white/(0.04)">
                                <div className="mt-0.5 shrink-0">
                                    <InsightIcon type={insight.type} category={insight.category} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-white/90 leading-tight uppercase tracking-wider">{insight.category}</p>
                                    <p className="text-[10px] text-white/40 leading-snug line-clamp-2">{insight.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </BentoCard>
            </div>

            {/* --- Main Chart & Memory Stream --- */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Progress Chart: Visualizes load velocity. */}
                <BentoCard
                    title={selectedExercise ? `${selectedExercise} Progress` : "Volume Velocity"}
                    subtitle={selectedExercise ? "Weight and Volume trends" : "Load progression over time"}
                    className="lg:col-span-2"
                >
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={currentTrends?.volume || []}>
                                <defs>
                                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fff" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                    dy={10}
                                />
                                <YAxis hide yAxisId="volume" />
                                <YAxis hide yAxisId="weight" orientation="right" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0a0a0a',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '16px',
                                        fontSize: '12px',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="value" yAxisId="volume" fill="url(#colorVolume)" radius={[4, 4, 0, 0]} barSize={20} name="Volume" />

                                {selectedExercise && currentTrends && 'weight' in currentTrends && (
                                    <>
                                        {/* Overlay lines for Max Weight and Average RPE for detailed exercise analysis. */}
                                        <Line
                                            yAxisId="weight"
                                            type="monotone"
                                            data={currentTrends.weight}
                                            dataKey="value"
                                            stroke="#8b5cf6"
                                            strokeWidth={2}
                                            dot={true}
                                            name="Max Weight"
                                        />
                                        <Line
                                            yAxisId="volume"
                                            type="monotone"
                                            data={'rpe' in currentTrends ? currentTrends.rpe : []}
                                            dataKey="value"
                                            stroke="#10b981"
                                            strokeWidth={1}
                                            strokeDasharray="4 4"
                                            dot={false}
                                            name="Avg RPE"
                                        />
                                    </>
                                )}
                                {!selectedExercise && (
                                    <Line type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} dot={false} />
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>

                {/* Signals Stream: Compact view of long-term memory updates. */}
                <BentoCard title="Recent Signals" headerIcon={History}>
                    <div className="space-y-4">
                        {memory.slice(0, 5).map((m, i) => (
                            <div key={i} className="flex gap-3 text-xs">
                                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-white/20 shrink-0" />
                                <div>
                                    <p className="text-white/70 line-clamp-2 leading-relaxed">
                                        {m.type === 'plan_snapshot' ? 'Weekly plan updated' :
                                            m.type === 'finding_snapshot' ? 'Coach insight generated' :
                                                m.type === 'user_feedback' ? 'User feedback recorded' :
                                                    m.type === 'reflection' ? 'Agent reflection generated' : 'Memory checkpoint'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[9px] font-medium text-white/20 uppercase tracking-wider">{formatTime(m.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </BentoCard>
            </div>

            {/* --- Training Plan Section --- */}
            <BentoCard title="Current Protocol" subtitle={plan?.goal || "Analyzing protocol..."} headerIcon={Calendar}>
                {!plan ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Calendar className="h-10 w-10 text-white/5 mb-4" />
                        <p className="text-sm text-white/20 italic">No plan data available.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {plan.workouts.map((workout, i: number) => (
                            <div key={i} className="group relative rounded-3xl border border-white/5 bg-white/[0.01] p-5 transition-all hover:bg-white/[0.03] hover:border-white/10">
                                <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
                                    <span className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">{workout.day.slice(0, 3)}</span>
                                    <span className="text-[10px] font-bold text-white/70 bg-white/5 px-3 py-1 rounded-full border border-white/5">{workout.focus}</span>
                                </div>
                                <ul className="space-y-3">
                                    {workout.exercises.map((ex, j: number) => (
                                        <li key={j} className="flex items-center justify-between group/item">
                                            <div className="flex flex-col">
                                                <span className={`text-sm transition-colors ${selectedExercise === ex.name ? 'text-emerald-400 font-semibold' : 'text-white/80 group-hover/item:text-white'}`}>
                                                    {ex.name}
                                                </span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-medium text-white/30 uppercase">{ex.target_sets} sets</span>
                                                    <span className="h-1 w-1 rounded-full bg-white/10" />
                                                    <span className="text-[10px] font-medium text-white/30 uppercase">{ex.target_reps} reps</span>
                                                </div>
                                            </div>
                                            {/* Quick-log button for each exercise in the plan. */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setLoggingExercise({ name: ex.name, sets: ex.target_sets });
                                                }}
                                                className="opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-white/10 rounded-lg transition-all"
                                                title="Log Workout"
                                            >
                                                <Plus className="w-3 h-3 text-white/60" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <div className="absolute top-0 right-0 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                                    <TrendingUp className="h-4 w-4 text-white/10" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </BentoCard>
        </div>
    );
}
