/**
 * SettingsView Component
 *
 * Simplified profile + data management surface. Users can edit their basic
 * profile (bio, wage) and manage demo/data import settings.
 */

"use client";

import { useEffect, useState } from "react";
import { Upload, Database, Activity, RefreshCw, UserRound, Save } from "lucide-react";
import { toggleDemoMode, importUserData, getProfile, updateProfile } from "@/lib/api";
import type { UserProfileUpdatePayload } from "@/lib/types";

type ProfileFormState = {
    name: string;
    bio: string;
    wage: string;
    sex: UserProfileUpdatePayload["sex"] | "";
    dateOfBirth: string;
    age: string;
    goal: UserProfileUpdatePayload["goal"] | "";
    experienceLevel: UserProfileUpdatePayload["experience_level"] | "";
};

const normalizeSex = (value: string | null | undefined): UserProfileUpdatePayload["sex"] | undefined => {
    if (value === "male" || value === "female" || value === "other") {
        return value;
    }
    return undefined;
};

const normalizeGoal = (value: string | null | undefined): UserProfileUpdatePayload["goal"] | undefined => {
    if (value === "build_muscle" || value === "lose_fat") {
        return value;
    }
    return undefined;
};

const normalizeExperience = (
    value: string | null | undefined
): UserProfileUpdatePayload["experience_level"] | undefined => {
    if (value === "beginner" || value === "intermediate" || value === "advanced") {
        return value;
    }
    return undefined;
};

export function SettingsView() {
    const [isDemo, setIsDemo] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [importMsg, setImportMsg] = useState("");

    const [profileLoading, setProfileLoading] = useState(true);
    const [profileStatus, setProfileStatus] = useState("");
    const [profileError, setProfileError] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState<ProfileFormState>({
        name: "",
        bio: "",
        wage: "",
        sex: "",
        dateOfBirth: "",
        age: "",
        goal: "",
        experienceLevel: "",
    });

    useEffect(() => {
        const loadProfile = async () => {
            setProfileLoading(true);
            setProfileError("");
            try {
                const data = await getProfile();
                setProfileForm({
                    name: data.name ?? "",
                    bio: data.bio ?? "",
                    wage: data.wage_per_hour ? data.wage_per_hour.toString() : "",
                    sex: normalizeSex(data.sex) ?? "",
                    dateOfBirth: data.date_of_birth ?? "",
                    age: data.age ? data.age.toString() : "",
                    goal: normalizeGoal(data.goal) ?? "",
                    experienceLevel: normalizeExperience(data.experience_level) ?? "",
                });
            } catch (err) {
                console.error("Failed to load profile", err);
                setProfileError("Unable to load profile right now.");
            } finally {
                setProfileLoading(false);
            }
        };

        void loadProfile();
    }, []);

    const handleProfileChange = (
        key: "name" | "bio" | "wage" |
          "sex" | "dateOfBirth" | "age" | "goal" | "experienceLevel",
        value: string
    ) => {
        setProfileForm((prev) => ({ ...prev, [key]: value }));
    };

    const toNumber = (value: string) => {
        if (!value.trim()) return undefined;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? undefined : parsed;
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileStatus("");
        setProfileError("");
        setSavingProfile(true);

        const payload: UserProfileUpdatePayload = {
            name: profileForm.name.trim() || undefined,
            bio: profileForm.bio.trim() || undefined,
            wage_per_hour: toNumber(profileForm.wage),
            sex: normalizeSex(profileForm.sex),
            date_of_birth: profileForm.dateOfBirth || undefined,
            age: toNumber(profileForm.age),
            goal: normalizeGoal(profileForm.goal),
            experience_level: normalizeExperience(profileForm.experienceLevel),
        };

        try {
            const saved = await updateProfile(payload);
            setProfileForm({
                name: saved.name ?? "",
                bio: saved.bio ?? "",
                wage: saved.wage_per_hour?.toString() ?? "",
                sex: normalizeSex(saved.sex) ?? "",
                dateOfBirth: saved.date_of_birth ?? "",
                age: saved.age?.toString() ?? "",
                goal: normalizeGoal(saved.goal) ?? "",
                experienceLevel: normalizeExperience(saved.experience_level) ?? "",
            });
            setProfileStatus("Profile saved and synced.");
        } catch (err) {
            console.error("Failed to save profile", err);
            setProfileError("Failed to save profile. Check your inputs and try again.");
        } finally {
            setSavingProfile(false);
        }
    };

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
            window.location.reload();
        } catch (e) {
            console.error("Failed to toggle demo mode", e);
            setIsDemo(!newState);
        }
    };

    /**
     * handleFileUpload
     *
     * Processes raw CSV files for training history migration.
     */
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        setUploading(true);
        setImportMsg("");

        try {
            await importUserData(e.target.files[0]);
            setImportMsg("Data imported successfully!");
            setTimeout(() => window.location.reload(), 1500);
        } catch {
            setImportMsg("Import failed. Check CSV format.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Profile & Settings</h2>
                <p className="text-[color:var(--muted-foreground)]">Keep your basics accurate and manage your data sources.</p>
            </header>

            <div className="grid gap-6">
                {/* --- Profile Form --- */}
                <div className="p-6 rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass-surface)]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                            <UserRound className="w-5 h-5" /> Profile
                        </h3>
                        {profileStatus && <span className="text-xs text-emerald-400">{profileStatus}</span>}
                        {profileError && !profileStatus && <span className="text-xs text-rose-400">{profileError}</span>}
                    </div>

                    <form className="space-y-4" onSubmit={handleSaveProfile}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm text-[color:var(--muted-foreground)]">Name</label>
                                <input
                                    type="text"
                                    value={profileForm.name}
                                    onChange={(e) => handleProfileChange("name", e.target.value)}
                                    className="w-full bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-xl px-4 py-2 text-white"
                                    placeholder="Your name"
                                    disabled={profileLoading || savingProfile}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-[color:var(--muted-foreground)]">Sex</label>
                                <select
                                    value={profileForm.sex}
                                    onChange={(e) => handleProfileChange("sex", e.target.value)}
                                    className="w-full bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-xl px-4 py-2 text-white"
                                >
                                    <option value="">Select sex</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-[color:var(--muted-foreground)]">Date of Birth</label>
                                <input
                                    type="date"
                                    value={profileForm.dateOfBirth}
                                    onChange={(e) => handleProfileChange("dateOfBirth", e.target.value)}
                                    className="w-full bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-xl px-4 py-2 text-white"
                                    disabled={profileLoading || savingProfile}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-[color:var(--muted-foreground)]">Age</label>
                                <input
                                    type="number"
                                    min={5}
                                    max={130}
                                    value={profileForm.age}
                                    onChange={(e) => handleProfileChange("age", e.target.value)}
                                    className="w-full bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-xl px-4 py-2 text-white"
                                    placeholder="Computed from DOB"
                                    disabled={profileLoading || savingProfile}
                                />
                                {profileError?.includes("Age mismatch") && (
                                    <p className="text-xs text-rose-400 mt-1">{profileError}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-[color:var(--muted-foreground)]">Primary Goal</label>
                                <select
                                    value={profileForm.goal}
                                    onChange={(e) => handleProfileChange("goal", e.target.value)}
                                    className="w-full bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-xl px-4 py-2 text-white"
                                >
                                    <option value="">Select your primary goal</option>
                                    <option value="build_muscle">Build Muscle</option>
                                    <option value="lose_fat">Lose Fat</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-[color:var(--muted-foreground)]">Experience Level</label>
                                <select
                                    value={profileForm.experienceLevel}
                                    onChange={(e) => handleProfileChange("experienceLevel", e.target.value)}
                                    className="w-full bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-xl px-4 py-2 text-white"
                                >
                                    <option value="">Select experience level</option>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-[color:var(--muted-foreground)]">Hourly Wage (optional)</label>
                                <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={profileForm.wage}
                                    onChange={(e) => handleProfileChange("wage", e.target.value)}
                                    className="w-full bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-xl px-4 py-2 text-white"
                                    placeholder="e.g., 45"
                                    disabled={profileLoading || savingProfile}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-[color:var(--muted-foreground)]">Bio</label>
                            <textarea
                                value={profileForm.bio}
                                onChange={(e) => handleProfileChange("bio", e.target.value)}
                                className="w-full bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-xl px-4 py-2 text-white min-h-[100px]"
                                placeholder="Goals, constraints, and training focus."
                                disabled={profileLoading || savingProfile}
                            />
                        </div>

                        <div className="flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={profileLoading || savingProfile}
                                className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-60"
                            >
                                {savingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {savingProfile ? "Saving..." : "Save Profile"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* --- Data Management Section --- */}
                <div className="p-6 rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass-surface)]">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5" /> Data Management
                    </h3>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                            <div>
                                <p className="text-white font-medium flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-400" />
                                    Demo Mode
                                </p>
                                <p className="text-sm text-[color:var(--muted-foreground)]">
                                    Populate the app with sample data to explore features.
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
            </div>
        </div>
    );
}
