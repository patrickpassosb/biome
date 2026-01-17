/**
 * SettingsView Component
 *
 * Provides administrative controls for the application, specifically
 * focusing on data source management (Demo Mode) and CSV ingestion.
 */

import { useEffect, useState } from "react";
import { Upload, Database, Activity, RefreshCw } from "lucide-react";
import { toggleDemoMode, importUserData, getUserBio, saveUserBio } from "@/lib/api";
import type { UserBioInput } from "@/lib/types";
import { useAsyncData } from "../app/hooks/useAsyncData";

const USER_ID = "test_user";
const GOAL_OPTIONS = [
    { value: "build_muscle", label: "Build Muscle" },
    { value: "lose_fat", label: "Lose Fat" },
    { value: "maintain", label: "Maintain" },
] as const;
const SEX_OPTIONS = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
] as const;

export function SettingsView() {
    // Boolean state for demo mode, synchronized with backend on change.
    const [isDemo, setIsDemo] = useState(false);
    // Boolean state to show loading spinner during CSV upload.
    const [uploading, setUploading] = useState(false);
    // Success/Error message for the import process.
    const [importMsg, setImportMsg] = useState("");
    const [savingBio, setSavingBio] = useState(false);
    const [bioMessage, setBioMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const bioState = useAsyncData(async () => {
        try {
            return await getUserBio(USER_ID);
        } catch (error) {
            if (error instanceof Error && error.message.includes("User bio not found")) {
                return null;
            }
            throw error;
        }
    }, []);

    // Context7: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react-dom/components/input.md
    const [bioForm, setBioForm] = useState({
        sex: "male",
        date_of_birth: "",
        age: "",
        weight: "",
        weight_unit: "kg",
        goals: [] as string[],
    });

    useEffect(() => {
        if (!bioState.data) return;
        setBioForm({
            sex: bioState.data.sex,
            date_of_birth: bioState.data.date_of_birth,
            age: String(bioState.data.age),
            weight: String(bioState.data.weight),
            weight_unit: bioState.data.weight_unit,
            goals: bioState.data.goals,
        });
    }, [bioState.data]);

    /**
     * handleDemoToggle
     *
     * Communicates with the /data/demo endpoint to switch the active DuckDB tables.
     * Triggers a page reload to refresh all global metrics and charts.
     */
    const handleDemoToggle = async () => {
        const newState = !isDemo;
        setIsDemo(newState);
        try {
            await toggleDemoMode(newState);
            // Full reload ensures all useAsyncData hooks across the app re-fetch.
            window.location.reload();
        } catch (e) {
            console.error("Failed to toggle demo mode", e);
            // Revert local state if the API call fails.
            setIsDemo(!newState);
        }
    };

    /**
     * handleFileUpload
     *
     * Processes raw CSV files for training history migration.
     */
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // Prevent upload if no file is selected.
        if (!e.target.files?.[0]) return;

        setUploading(true);
        setImportMsg("");

        try {
            // Upload using multipart/form-data via the importUserData client.
            await importUserData(e.target.files[0]);
            setImportMsg("Data imported successfully!");

            // Give the user a moment to see the success message before reloading.
            setTimeout(() => window.location.reload(), 1500);
        } catch {
            setImportMsg("Import failed. Check CSV format.");
        } finally {
            setUploading(false);
        }
    };

    const computeAge = (dateOfBirth: string) => {
        if (!dateOfBirth) return null;
        const dob = new Date(dateOfBirth);
        if (Number.isNaN(dob.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age -= 1;
        }
        return age;
    };

    const validateBio = () => {
        if (!bioForm.date_of_birth) return "Date of birth is required.";
        const dob = new Date(bioForm.date_of_birth);
        const today = new Date();
        if (dob > today) return "Date of birth cannot be in the future.";

        const age = Number(bioForm.age);
        if (!Number.isFinite(age)) return "Age must be a number.";
        if (age < 5 || age > 130) return "Age must be between 5 and 130.";

        const weight = Number(bioForm.weight);
        if (!Number.isFinite(weight)) return "Weight must be a number.";
        if (weight <= 0) return "Weight must be greater than 0.";

        const computedAge = computeAge(bioForm.date_of_birth);
        if (computedAge !== null && computedAge !== age) {
            return "Age does not match the date of birth.";
        }

        return null;
    };

    const handleBioSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setBioMessage(null);

        const error = validateBio();
        if (error) {
            setBioMessage({ type: "error", text: error });
            return;
        }

        const payload: UserBioInput = {
            user_id: USER_ID,
            sex: bioForm.sex as UserBioInput["sex"],
            date_of_birth: bioForm.date_of_birth,
            age: Number(bioForm.age),
            weight: Number(bioForm.weight),
            weight_unit: bioForm.weight_unit as UserBioInput["weight_unit"],
            goals: bioForm.goals as UserBioInput["goals"],
        };

        setSavingBio(true);
        try {
            const saved = await saveUserBio(payload);
            setBioForm({
                sex: saved.sex,
                date_of_birth: saved.date_of_birth,
                age: String(saved.age),
                weight: String(saved.weight),
                weight_unit: saved.weight_unit,
                goals: saved.goals,
            });
            setBioMessage({ type: "success", text: "Bio saved successfully." });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Bio save failed.";
            setBioMessage({ type: "error", text: message });
        } finally {
            setSavingBio(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* --- View Header --- */}
            <header>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Settings</h2>
                <p className="text-[color:var(--muted-foreground)]">Manage your preferences and engine configuration.</p>
            </header>

            <div className="grid gap-6">
                {/* --- Data Management Section --- */}
                <div className="p-6 rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass-surface)]">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5" /> Data Management
                    </h3>

                    <div className="space-y-6">
                        {/* Demo Mode Toggle: Switches between sample and real data. */}
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
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDemo ? 'bg-emerald-500' : 'bg-white/20'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDemo ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        {/* CSV Import Module: Handles historical data migration. */}
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
                                {/* Hidden file input overlaid by a styled button. */}
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

                {/* --- Profile Section (Read-only Prototype) --- */}
                <div className="p-6 rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass-surface)]">
                    <h3 className="text-xl font-semibold text-white mb-4">Bio Profile</h3>
                    <form onSubmit={handleBioSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm text-[color:var(--muted-foreground)]">Sex</label>
                                <select
                                    value={bioForm.sex}
                                    onChange={(event) =>
                                        setBioForm((prev) => ({ ...prev, sex: event.target.value }))
                                    }
                                    className="w-full bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-xl px-4 py-2 text-white"
                                >
                                    {SEX_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-[color:var(--muted-foreground)]">Date of Birth</label>
                                <input
                                    type="date"
                                    value={bioForm.date_of_birth}
                                    onChange={(event) =>
                                        setBioForm((prev) => ({
                                            ...prev,
                                            date_of_birth: event.target.value,
                                        }))
                                    }
                                    className="w-full bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-xl px-4 py-2 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-[color:var(--muted-foreground)]">Age</label>
                                <input
                                    type="number"
                                    min={5}
                                    max={130}
                                    value={bioForm.age}
                                    onChange={(event) =>
                                        setBioForm((prev) => ({ ...prev, age: event.target.value }))
                                    }
                                    className="w-full bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-xl px-4 py-2 text-white"
                                />
                                {bioForm.date_of_birth && (
                                    <p className="text-xs text-[color:var(--muted-foreground)]">
                                        Computed age: {computeAge(bioForm.date_of_birth) ?? "—"}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-[color:var(--muted-foreground)]">Weight</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        value={bioForm.weight}
                                        onChange={(event) =>
                                            setBioForm((prev) => ({ ...prev, weight: event.target.value }))
                                        }
                                        className="w-full bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-xl px-4 py-2 text-white"
                                    />
                                    <select
                                        value={bioForm.weight_unit}
                                        onChange={(event) =>
                                            setBioForm((prev) => ({
                                                ...prev,
                                                weight_unit: event.target.value,
                                            }))
                                        }
                                        className="bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-xl px-4 py-2 text-white"
                                    >
                                        <option value="kg">kg</option>
                                        <option value="lb">lb</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-[color:var(--muted-foreground)]">Goals</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {GOAL_OPTIONS.map((goal) => {
                                    const checked = bioForm.goals.includes(goal.value);
                                    return (
                                        <label
                                            key={goal.value}
                                            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(event) => {
                                                    setBioForm((prev) => {
                                                        const nextGoals = event.target.checked
                                                            ? [...prev.goals, goal.value]
                                                            : prev.goals.filter((value) => value !== goal.value);
                                                        return { ...prev, goals: nextGoals };
                                                    });
                                                }}
                                                className="h-4 w-4 accent-emerald-400"
                                            />
                                            {goal.label}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {bioState.loading && (
                            <p className="text-xs text-[color:var(--muted-foreground)]">Loading bio...</p>
                        )}
                        {bioState.error && (
                            <p className="text-xs text-rose-400">{bioState.error}</p>
                        )}
                        {bioMessage && (
                            <p
                                className={`text-xs ${bioMessage.type === "success" ? "text-emerald-400" : "text-rose-400"
                                    }`}
                            >
                                {bioMessage.text}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={savingBio}
                            className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            {savingBio ? "Saving..." : "Save Bio"}
                        </button>
                    </form>
                </div>

                {/* --- Visual Preferences --- */}
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
                        {/* Placeholder for future features. */}
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
