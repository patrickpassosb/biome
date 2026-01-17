/**
 * WorkoutLogger Component
 *
 * An interactive modal for manually logging multiple sets of a specific exercise.
 * It calculates the volume and intensity (RPE) for each set and persists them
 * to the analytics engine.
 */

import { useState } from "react";
import { X, Save, Plus, Loader2 } from "lucide-react";
import { logWorkout } from "@/lib/api";

interface WorkoutLoggerProps {
    exerciseName: string; // The name of the exercise being logged.
    targetSets: number;  // Initial number of set rows to display.
    onClose: () => void; // Callback to close the modal.
}

interface SetData {
    reps: number;
    weight: number;
    rpe: number;
}

export function WorkoutLogger({ exerciseName, targetSets, onClose }: WorkoutLoggerProps) {
    /**
     * sets state
     * Tracks an array of set objects (Reps, Weight, RPE).
     * Defaults to the number of target sets defined in the training plan.
     */
    const [sets, setSets] = useState<SetData[]>(
        Array(targetSets).fill({ reps: 0, weight: 0, rpe: 8 })
    );
    // Boolean flag to show loading spinner during API submission.
    const [isSaving, setIsSaving] = useState(false);

    /**
     * updateSet
     *
     * Helper to update a specific field in the 'sets' array.
     */
    const updateSet = (index: number, field: keyof SetData, value: number) => {
        const newSets = [...sets];
        newSets[index] = { ...newSets[index], [field]: value };
        setSets(newSets);
    };

    /**
     * handleSave
     *
     * Iterates through all non-empty sets and logs them sequentially to the backend.
     */
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            // Map over the 'sets' state and trigger an API call for each valid entry.
            await Promise.all(sets.map((set, i) => {
                // Skip sets that don't have reps or weight.
                if (set.reps === 0 || set.weight === 0) return Promise.resolve();

                return logWorkout({
                    date: today,
                    workout: "Manual Log",
                    exercise: exerciseName,
                    set_number: i + 1,
                    reps: set.reps,
                    weight_kg: set.weight,
                    rpe: set.rpe,
                    notes: "Logged via Dashboard"
                });
            }));

            // Close the modal upon successful logging.
            onClose();
        } catch (e) {
            console.error("Failed to log workout", e);
            alert("Failed to save workout. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[color:var(--card)] border border-[color:var(--glass-border)] rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
                {/* --- Modal Header --- */}
                <div className="p-6 border-b border-[color:var(--glass-border)] flex justify-between items-center bg-black/20">
                    <h3 className="text-xl font-bold text-white">{exerciseName}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-white/70" />
                    </button>
                </div>

                {/* --- Sets Editor --- */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {/* Column Headers */}
                    <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-4 mb-2 text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider text-center">
                        <span>Set</span>
                        <span>kg</span>
                        <span>Reps</span>
                        <span>RPE</span>
                    </div>

                    {/* Row for each set */}
                    {sets.map((set, i) => (
                        <div key={i} className="grid grid-cols-[auto_1fr_1fr_1fr] gap-4 items-center animate-in slide-in-from-left-2">
                            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-sm font-bold text-white">
                                {i + 1}
                            </span>
                            <input
                                type="number"
                                placeholder="kg"
                                value={set.weight || ''}
                                onChange={(e) => updateSet(i, 'weight', parseFloat(e.target.value))}
                                className="bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-lg py-2 text-center text-white focus:border-white/50 focus:outline-none transition-colors"
                            />
                            <input
                                type="number"
                                placeholder="reps"
                                value={set.reps || ''}
                                onChange={(e) => updateSet(i, 'reps', parseFloat(e.target.value))}
                                className="bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-lg py-2 text-center text-white focus:border-white/50 focus:outline-none transition-colors"
                            />
                            <input
                                type="number"
                                placeholder="RPE"
                                value={set.rpe || ''}
                                onChange={(e) => updateSet(i, 'rpe', parseFloat(e.target.value))}
                                className="bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-lg py-2 text-center text-white focus:border-white/50 focus:outline-none transition-colors"
                            />
                        </div>
                    ))}
                    
                    {/* Trigger: Append a new set to the state. */}
                    <button 
                        onClick={() => setSets([...sets, { reps: 0, weight: 0, rpe: 8 }])}
                        className="w-full py-2 border border-dashed border-white/20 rounded-xl text-sm text-[color:var(--muted-foreground)] hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Set
                    </button>
                </div>

                {/* --- Modal Footer / Save Action --- */}
                <div className="p-6 border-t border-[color:var(--glass-border)] bg-black/20">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? "Saving..." : "Log Workout"}
                    </button>
                </div>
            </div>
        </div>
    );
}
