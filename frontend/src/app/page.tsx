"use client";
import { useState } from "react";
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

// Header shared across views (minimal)
const Header = () => (
  <header className="mb-10">
    <h2 className="text-4xl font-bold tracking-tighter text-white">Biome</h2>
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

  // Derive final plan (use local if available, otherwise fetched)
  const currentPlan = localPlan ?? planState.data;

  return (
    <div className="flex h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Sidebar - Desktop Only for now */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-10 lg:p-12">
        <Header />

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
