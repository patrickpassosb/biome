/**
 * Main application entry point for the Biome frontend.
 *
 * This component manages the top-level state, including navigation (view switching),
 * centralized data fetching for metrics and plans, and the persistent chat history
 * with the AI coaching team.
 */

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

// View components
import { Sidebar } from "@/components/Sidebar";
import { DashboardView } from "@/components/DashboardView";
import { AgentView, type Message } from "@/components/AgentView";
import { SettingsView } from "@/components/SettingsView";
import { WeightView } from "@/components/WeightView";

// Type definitions
import type { WeeklyPlan } from "@/lib/api";
import { Info } from "lucide-react";

/**
 * Header component shared across all main views.
 * Displays the application name and a visual indicator if the system is in Demo Mode.
 *
 * @param isDemo - Boolean flag indicating if demo data is currently active.
 */
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

/**
 * The root application component.
 * Coordinates all sub-views and handles global data synchronization.
 */
export default function App() {
  // Navigation state: determines which main view is rendered.
  const [currentView, setCurrentView] = useState<'dashboard' | 'agent' | 'weight' | 'settings'>('dashboard');

  // Centralized Data Fetching using a custom hook to manage loading/error states.

  // Fetches high-level KPIs (Frequency, Volume, Weak Points).
  const overviewState = useAsyncData(getOverviewMetrics, []);

  // Fetches multiple trend datasets (Volume and Frequency) in parallel.
  const trendsState = useAsyncData(async () => {
    const [vol, freq] = await Promise.all([
      getTrend("volume_load"),
      getTrend("weekly_frequency"),
    ]);
    return { volume: vol, frequency: freq };
  }, []);

  // Fetches the initial proposed weekly plan from the AI Coach.
  const planState = useAsyncData(proposeWeeklyPlan, []);

  // Fetches the latest 10 items from the long-term memory store.
  const memoryState = useAsyncData(() => getMemoryTimeline(10), []);

  // Local state for the training plan.
  // If the user uses the AI Chat to modify their plan, the updated version is stored here.
  const [localPlan, setLocalPlan] = useState<WeeklyPlan | null>(null);

  // Persistent chat message history.
  // Initialized with a welcome message from the Biome Team.
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! We are the Biome Team—your specialized coaches for workout, nutrition, and recovery. We've analyzed your latest gym data and trends. How can we help you reach your goals today?",
      timestamp: new Date(),
      agentPersona: "Biome Team"
    }
  ]);

  /**
   * Effect: Handles 'Cold Start' onboarding for new users.
   * If the system detects zero training history and demo mode is off,
   * it prompts the user to define their goals and availability.
   */
  useEffect(() => {
    if (overviewState.data &&
        !overviewState.data.is_demo &&
        overviewState.data.total_volume_load_current_week === 0 &&
        overviewState.data.weekly_frequency === 0) {

      // Small timeout to prevent React from warning about cascading renders.
      const timer = setTimeout(() => {
        setMessages([{
          role: 'assistant',
          content: "Welcome to Biome! I see you don't have any training history recorded yet. No problem—I can help you build your first plan from scratch. \n\nWhat are your primary goals (e.g., Strength, Muscle Growth) and how many days a week would you like to train?",
          timestamp: new Date(),
          agentPersona: "Biome Team"
        }]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [overviewState.data]);

  // Derived state: Use the AI-updated plan if available, otherwise use the initially fetched one.
  const fallbackPlan: WeeklyPlan = {
    week_start_date: new Date().toISOString().slice(0, 10),
    goal: "Starter plan placeholder (AI generation unavailable).",
    workouts: [],
  };
  const currentPlan = localPlan ?? planState.data ?? fallbackPlan;

  return (
    <div className="flex h-screen bg-black text-white selection:bg-white selection:text-black">
      {/*
          Sidebar: Manages navigation.
          It updates the 'currentView' state when an icon is clicked.
      */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content Area: Scrollable container for the dynamic views. */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-10 lg:p-12">
        {/* Global Header */}
        <Header isDemo={overviewState.data?.is_demo ?? false} />

        {/* View Switcher: Renders the active component based on currentView state. */}
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

          {currentView === 'weight' && (
            <WeightView />
          )}
        </div>
      </main>
    </div>
  );
}
