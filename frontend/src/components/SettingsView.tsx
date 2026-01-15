export function SettingsView() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Settings</h2>
                <p className="text-[color:var(--muted-foreground)]">Manage your preferences and engine configuration.</p>
            </header>

            <div className="grid gap-6">
                {/* Profile Section */}
                <div className="p-6 rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass-surface)]">
                    <h3 className="text-xl font-semibold text-white mb-4">Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-[color:var(--muted-foreground)]">Name</label>
                            <input type="text" value="Patrick" disabled className="w-full bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-xl px-4 py-2 text-white" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-[color:var(--muted-foreground)]">Experience Level</label>
                            <input type="text" value="Intermediate" disabled className="w-full bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-xl px-4 py-2 text-white" />
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div className="p-6 rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass-surface)]">
                    <h3 className="text-xl font-semibold text-white mb-4">Preferences</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Dark Mode</p>
                                <p className="text-sm text-[color:var(--muted-foreground)]">Always active in Biome.</p>
                            </div>
                            <div className="h-6 w-11 bg-white rounded-full relative">
                                <div className="absolute right-1 top-1 h-4 w-4 bg-black rounded-full"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between opacity-50">
                            <div>
                                <p className="text-white font-medium">Unit System</p>
                                <p className="text-sm text-[color:var(--muted-foreground)]">Metric (kg) / Imperial (lbs)</p>
                            </div>
                            <span className="text-xs border border-white/20 px-2 py-1 rounded">Coming Soon</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
