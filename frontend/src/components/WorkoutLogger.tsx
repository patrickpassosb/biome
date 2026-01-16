import { useState } from "react";
import { X, Save, Plus, Loader2 } from "lucide-react";
import { logWorkout } from "@/lib/api";

interface WorkoutLoggerProps {
    exerciseName: string;
    targetSets: number;
    onClose: () => void;
}

interface SetData {
    reps: number;
    weight: number;
    rpe: number;
}

export function WorkoutLogger({ exerciseName, targetSets, onClose }: WorkoutLoggerProps) {
    const [sets, setSets] = useState<SetData[]>(
        Array(targetSets).fill({ reps: 0, weight: 0, rpe: 8 })
    );
    const [isSaving, setIsSaving] = useState(false);

    const updateSet = (index: number, field: keyof SetData, value: number) => {
        const newSets = [...sets];
        newSets[index] = { ...newSets[index], [field]: value };
        setSets(newSets);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            // Log each set individually
            await Promise.all(sets.map((set, i) => {
                if (set.reps === 0 || set.weight === 0) return Promise.resolve(); // Skip empty
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
            onClose();
            // Optional: trigger refresh
        } catch (e) {
            console.error("Failed to log workout", e);
            alert("Failed to save workout. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[color:var(--card)] border border-[color:var(--glass-border)] rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-[color:var(--glass-border)] flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">{exerciseName}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-white/70" />
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-4 mb-2 text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider text-center">
                        <span>Set</span>
                        <span>kg</span>
                        <span>Reps</span>
                        <span>RPE</span>
                    </div>

                    {sets.map((set, i) => (
                        <div key={i} className="grid grid-cols-[auto_1fr_1fr_1fr] gap-4 items-center">
                            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-sm font-bold text-white">
                                {i + 1}
                            </span>
                            <input
                                type="number"
                                placeholder="kg"
                                value={set.weight || ''}
                                onChange={(e) => updateSet(i, 'weight', parseFloat(e.target.value))}
                                className="bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-lg py-2 text-center text-white focus:border-white/50 focus:outline-none"
                            />
                            <input
                                type="number"
                                placeholder="reps"
                                value={set.reps || ''}
                                onChange={(e) => updateSet(i, 'reps', parseFloat(e.target.value))}
                                className="bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-lg py-2 text-center text-white focus:border-white/50 focus:outline-none"
                            />
                            <input
                                type="number"
                                placeholder="RPE"
                                value={set.rpe || ''}
                                onChange={(e) => updateSet(i, 'rpe', parseFloat(e.target.value))}
                                className="bg-[color:var(--surface)] border border-[color:var(--glass-border)] rounded-lg py-2 text-center text-white focus:border-white/50 focus:outline-none"
                            />
                        </div>
                    ))}
                    
                    <button 
                        onClick={() => setSets([...sets, { reps: 0, weight: 0, rpe: 8 }])}
                        className="w-full py-2 border border-dashed border-white/20 rounded-xl text-sm text-[color:var(--muted-foreground)] hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Set
                    </button>
                </div>

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
