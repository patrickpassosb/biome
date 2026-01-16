"use client";
import { useState, useEffect } from "react";
import { useAsyncData } from "./hooks/useAsyncData";
import {
  getMemoryTimeline,
  getOverviewMetrics,
  getTrend,
  proposeWeeklyPlan,
  chatWithAgent,
} from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { DashboardView } from "@/components/DashboardView";
import { AgentView, type Message } from "@/components/AgentView";
import { SettingsView } from "@/components/SettingsView";
import type { WeeklyPlan } from "@/lib/api";
import { Info } from "lucide-react";

// Header shared across views (minimal)
const Header = ({ isDemo }: { isDemo: boolean }) => (
  <header className="mb-10 flex items-center justify-between">
    <h2 className="text-4xl font-bold tracking-tighter text-white">Biome</h2>
    {isDemo && (
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold animate-pulse">
        <Info className="w-4 h-4" />
        DEMO MODE ACTIVE
      </div>
    )}
  </header>
);

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'agent' | 'settings'>('dashboard');

  // Centralized Data Fetching
  const overviewState = useAsyncData(getOverviewMetrics, []);
  const trendsState = useAsyncData(async () => {
    const [vol, freq] = await Promise.all([
      getTrend("volume_load"),
      getTrend("weekly_frequency"),
    ]);
    return { volume: vol, frequency: freq };
  }, []);
  const planState = useAsyncData(proposeWeeklyPlan, []);
  const memoryState = useAsyncData(() => getMemoryTimeline(10), []);

  // Local state for the plan if modified by the agent
  const [localPlan, setLocalPlan] = useState<WeeklyPlan | null>(null);

  // Persist messages across view changes
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! We are the Biome Team—your specialized coaches for workout, nutrition, and recovery. We've analyzed your latest gym data and trends. How can we help you reach your goals today?",
      timestamp: new Date(),
      agentPersona: "Biome Team"
    }
  ]);

  // Adjust initial message for new users (no data, not demo)
  useEffect(() => {
    if (overviewState.data && !overviewState.data.is_demo && overviewState.data.total_volume_load_current_week === 0 && overviewState.data.weekly_frequency === 0) {
      setMessages([{
        role: 'assistant',
        content: "Welcome to Biome! I see you don't have any training history recorded yet. No problem—I can help you build your first plan from scratch. \n\nWhat are your primary goals (e.g., Strength, Muscle Growth) and how many days a week would you like to train?",
        timestamp: new Date(),
        agentPersona: "Biome Team"
      }]);
    }
  }, [overviewState.data]);

  // Derive final plan (use local if available, otherwise fetched)
  const currentPlan = localPlan ?? planState.data;

  return (
    <div className="flex h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Sidebar - Desktop Only for now */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-10 lg:p-12">
        <Header isDemo={overviewState.data?.is_demo ?? false} />

        <div className="animate-in fade-in duration-1000">
          {currentView === 'dashboard' && (
            <DashboardView
              overview={overviewState.data}
              trends={trendsState.data}
              plan={currentPlan}
              memory={memoryState.data ?? []}
              loading={overviewState.loading || trendsState.loading}
            />
          )}

          {currentView === 'agent' && (
            <AgentView
              currentPlan={currentPlan}
              onPlanUpdate={setLocalPlan}
              chatWithAgent={chatWithAgent}
              messages={messages}
              setMessages={setMessages}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView />
          )}
        </div>
      </main>
    </div>
  );
}
