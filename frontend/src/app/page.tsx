/**
 * Main application entry point for the Biome frontend.
 *
 * This component manages the top-level state, including navigation (view switching),
 * centralized data fetching for metrics and plans, and the persistent chat history
 * with the AI coaching team.
 */

"use client";

import { useState } from "react";
import { useAsyncData } from "./hooks/useAsyncData";
import {
  proposeWeeklyPlan,
  chatWithAgent,
} from "@/lib/api";

// View components
import { Sidebar } from "@/components/Sidebar";
import { AgentView, type Message } from "@/components/AgentView";
import { SettingsView } from "@/components/SettingsView";

// Type definitions
import type { WeeklyPlan } from "@/lib/api";

/**
 * Header component shared across all main views.
 * Displays the application name and a visual indicator if the system is in Demo Mode.
 *
 */
const Header = () => (
  <header className="mb-10 flex items-center justify-between">
    <h2 className="text-4xl font-bold tracking-tighter text-white">Biome</h2>
  </header>
);

/**
 * The root application component.
 * Coordinates all sub-views and handles global data synchronization.
 */
export default function App() {
  // Navigation state: determines which main view is rendered.
  const [currentView, setCurrentView] = useState<'agent' | 'settings'>('agent');

  // Fetches the initial proposed weekly plan from the AI Coach.
  const planState = useAsyncData(proposeWeeklyPlan, []);

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
        <Header />

        {/* View Switcher: Renders the active component based on currentView state. */}
        <div className="animate-in fade-in duration-1000">
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
