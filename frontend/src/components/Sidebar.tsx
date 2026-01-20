/**
 * Sidebar Component
 *
 * Handles primary application navigation. It provides a fixed vertical
 * menu on large screens, allowing users to switch between the AI Agent chat
 * and Settings.
 */

import { Sparkles, Settings } from "lucide-react";

interface SidebarProps {
    /** The active view ID. */
    currentView: 'agent' | 'settings';
    /** Callback to update the active view in the parent App component. */
    onViewChange: (view: 'agent' | 'settings') => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
    /**
     * Menu item configuration.
     * Defines the ID, display label, and Lucide icon for each navigation link.
     */
    const menuItems = [
        { id: 'agent', label: 'Agents', icon: Sparkles },
        { id: 'settings', label: 'Profile', icon: Settings },
    ] as const;

    return (
        <div className="w-64 h-full border-r border-[color:var(--glass-border)] bg-[color:var(--card)] flex flex-col p-4">
            {/* --- App Branding --- */}
            <div className="flex items-center gap-2 px-4 py-8 mb-4">
                <Sparkles className="w-6 h-6 text-white" />
                <h1 className="text-xl font-bold tracking-tight text-white">Biome</h1>
            </div>

            {/* --- Navigation Links --- */}
            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? "bg-white text-black font-medium shadow-lg shadow-white/10"
                                : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--glass-surface)] hover:text-white"
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? "text-black" : "group-hover:text-white"}`} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* --- System Status / Footer --- */}
            <div className="p-4 text-xs text-[color:var(--muted-foreground)] border-t border-[color:var(--glass-border)]">
                <p>Engine Active</p>
                <p className="opacity-50">v0.1.0-alpha</p>
            </div>
        </div>
    );
}
