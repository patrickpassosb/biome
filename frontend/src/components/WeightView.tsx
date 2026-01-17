"use client";
import React, { useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Scale, Plus, History, TrendingDown, TrendingUp } from "lucide-react";
import { useAsyncData } from "../app/hooks/useAsyncData";
import { getWeightHistory, logWeight } from "@/lib/api";

function formatDate(input: string) {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return input;
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
    }).format(date);
}

export function WeightView() {
    const [newWeight, setNewWeight] = useState("");
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const historyState = useAsyncData(getWeightHistory, []);

    const handleLogWeight = async (e: React.FormEvent) => {
        e.preventDefault();
        const weight = parseFloat(newWeight);
        if (isNaN(weight) || weight <= 0) return;

        setIsSubmitting(true);
        try {
            await logWeight(weight, newDate);
            setNewWeight("");
            historyState.refresh();
        } catch (error) {
            console.error("Failed to log weight:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const latestWeight = historyState.data?.[historyState.data.length - 1]?.weight_kg;
    const previousWeight = historyState.data?.[historyState.data.length - 2]?.weight_kg;
    const diff = latestWeight && previousWeight ? latestWeight - previousWeight : null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Weight Tracking</h2>
                <p className="text-[color:var(--muted-foreground)]">Monitor your physical evolution and body composition.</p>
            </header>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Stats Card */}
                <div className="md:col-span-1 p-6 rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass-surface)] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-[color:var(--muted-foreground)] text-xs font-medium uppercase tracking-wider mb-2">
                            <Scale className="w-4 h-4" /> Latest Weight
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-white">
                                {latestWeight ? `${latestWeight}kg` : "—"}
                            </span>
                            {diff !== null && (
                                <span className={`text-sm font-medium flex items-center gap-0.5 ${diff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(diff).toFixed(1)}kg
                                </span>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleLogWeight} className="mt-8 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-[color:var(--muted-foreground)] font-medium">New Entry (kg)</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={newWeight}
                                    onChange={(e) => setNewWeight(e.target.value)}
                                    placeholder="00.0"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-white/20 transition-colors"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="p-2 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-[color:var(--muted-foreground)] font-medium">Date</label>
                            <input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-white/20 transition-colors"
                                required
                            />
                        </div>
                    </form>
                </div>

                {/* Chart Card */}
                <div className="md:col-span-2 p-6 rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass-surface)]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <History className="w-5 h-5" /> Weight Evolution
                        </h3>
                    </div>

                    <div className="h-64 w-full">
                        {historyState.data && historyState.data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={historyState.data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#121212',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                                        labelFormatter={formatDate}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="weight_kg"
                                        stroke="#ffffff"
                                        strokeWidth={3}
                                        dot={{ fill: '#ffffff', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                        animationDuration={1000}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                <Scale className="w-12 h-12 mb-4" />
                                <p className="text-sm italic">No weight history recorded yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
