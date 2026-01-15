"use client";
import { useMemo } from "react";
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
    Dumbbell,
    History,
    TrendingUp,
    ClipboardList
} from "lucide-react";
import type { WeeklyPlan } from "@/lib/api";

/** UTILS */
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

function formatTime(input: string) {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return input;
    return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

/** COMPONENTS */
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
    overview: any;
    trends: any;
    plan: WeeklyPlan | null;
    memory: any[];
    loading: boolean;
}

export function DashboardView({ overview, trends, plan, memory, loading }: DashboardViewProps) {
    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI Section */}
            <div className="grid gap-6 md:grid-cols-3">
                <BentoCard title="Activity" headerIcon={Activity}>
                    <StatCard label="Frequency" value={formatNumber(overview?.weekly_frequency)} subvalue="Sessions this week" />
                </BentoCard>
                <BentoCard title="Volume" headerIcon={BarChart2}>
                    <StatCard label="Volume Load" value={formatNumber(overview?.total_volume_load_current_week)} subvalue="Total kgs moved" trend="up" />
                </BentoCard>
                <BentoCard title="Focus" headerIcon={ClipboardList}>
                    <StatCard label="Active Blip" value={formatNumber(overview?.active_weak_points_count)} subvalue="Identified imbalances" />
                </BentoCard>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Trends Chart */}
                <BentoCard title="Volume Velocity" subtitle="Load progression over time" className="lg:col-span-2">
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={trends?.volume || []}>
                                <defs>
                                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fff" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} dy={10} />
                                <YAxis hide />
                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                                <Bar dataKey="value" fill="url(#colorVolume)" radius={[4, 4, 0, 0]} barSize={20} />
                                <Line type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>

                {/* Memory Stream (Compact) */}
                <BentoCard title="Recent Signals" headerIcon={History}>
                    <div className="space-y-4">
                        {memory.slice(0, 4).map((m, i) => (
                            <div key={i} className="flex gap-3 text-sm">
                                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-white/20 shrink-0" />
                                <div>
                                    <p className="text-white/80 line-clamp-2">
                                        {m.type === 'workout_log' ? 'Training session logged' :
                                            m.type === 'finding_snapshot' ? 'Coach insight generated' : 'Memory checkpoint'}
                                    </p>
                                    <p className="text-[10px] text-white/30">{formatTime(m.created_at)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </BentoCard>
            </div>

            {/* Plan Section */}
            <BentoCard title="Weekly Protocol" subtitle={plan?.goal || "Analyzing protocol..."} headerIcon={Calendar}>
                {!plan ? (
                    <p className="text-sm text-white/40 italic">No plan data available.</p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {plan.workouts.map((workout, i: number) => (
                            <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 hover:bg-white/[0.03] transition-colors">
                                <div className="mb-3 flex items-center justify-between border-b border-white/5 pb-2">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{workout.day.slice(0, 3)}</span>
                                    <span className="text-[10px] text-white/60 bg-white/5 px-2 py-0.5 rounded-full">{workout.focus}</span>
                                </div>
                                <ul className="space-y-2">
                                    {workout.exercises.map((ex, j: number) => (
                                        <li key={j} className="flex flex-col">
                                            <span className="text-sm text-white/80">{ex.name}</span>
                                            <span className="text-[10px] text-white/40">{ex.target_sets} sets • {ex.target_reps} reps</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </BentoCard>
        </div>
    );
}
