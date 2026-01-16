import { useState } from "react";
import { Upload, Database, Activity, RefreshCw } from "lucide-react";
import { toggleDemoMode, importUserData } from "@/lib/api";

export function SettingsView() {
    const [isDemo, setIsDemo] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [importMsg, setImportMsg] = useState("");

    const handleDemoToggle = async () => {
        const newState = !isDemo;
        setIsDemo(newState);
        try {
            await toggleDemoMode(newState);
            // Reload to refresh global data state
            window.location.reload();
        } catch (e) {
            console.error(e);
            setIsDemo(!newState); // revert on error
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setUploading(true);
        setImportMsg("");
        try {
            await importUserData(e.target.files[0]);
            setImportMsg("Data imported successfully!");
            // Give user a moment to see success before reload
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            setImportMsg("Import failed. Check CSV format.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Settings</h2>
                <p className="text-[color:var(--muted-foreground)]">Manage your preferences and engine configuration.</p>
            </header>

            <div className="grid gap-6">
                {/* Data Management Section */}
                <div className="p-6 rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass-surface)]">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5" /> Data Management
                    </h3>
                    
                    <div className="space-y-6">
                        {/* Demo Mode Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                            <div>
                                <p className="text-white font-medium flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-400" /> 
                                    Demo Mode
                                </p>
                                <p className="text-sm text-[color:var(--muted-foreground)]">
                                    Populate dashboard with sample data to explore features.
                                </p>
                            </div>
                            <button 
                                onClick={handleDemoToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    isDemo ? 'bg-emerald-500' : 'bg-white/20'
                                }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    isDemo ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                            </button>
                        </div>

                        {/* CSV Import */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                            <div>
                                <p className="text-white font-medium flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-blue-400" /> 
                                    Import History
                                </p>
                                <p className="text-sm text-[color:var(--muted-foreground)]">
                                    Upload a CSV file to replace current training data.
                                </p>
                                {importMsg && (
                                    <p className={`text-xs mt-1 ${importMsg.includes('success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {importMsg}
                                    </p>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={uploading}
                                />
                                <button className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                                    {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {uploading ? "Importing..." : "Upload CSV"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

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