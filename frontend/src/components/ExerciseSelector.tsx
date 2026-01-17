/**
 * ExerciseSelector Component
 *
 * A custom searchable dropdown for filtering the dashboard by exercise.
 * It manages its own open/closed state and handles clicks outside the component
 * for a smooth user experience.
 */

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface ExerciseSelectorProps {
    exercises: string[]; // List of all exercise names from the database.
    selectedExercise: string | null; // The currently active filter.
    onSelect: (exercise: string | null) => void; // Callback to change the filter.
}

export function ExerciseSelector({ exercises, selectedExercise, onSelect }: ExerciseSelectorProps) {
    // Boolean flag for the dropdown visibility.
    const [isOpen, setIsOpen] = useState(false);
    // Local state for the filter search input.
    const [search, setSearch] = useState('');
    // Reference to the container element for 'click-outside' detection.
    const containerRef = useRef<HTMLDivElement>(null);

    /**
     * filteredExercises
     * Derived list based on the user's search query.
     */
    const filteredExercises = exercises.filter(ex =>
        ex.toLowerCase().includes(search.toLowerCase())
    );

    /**
     * Effect: Handles 'Click Outside' behavior.
     * Closes the dropdown if the user clicks anywhere else on the screen.
     */
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full max-w-xs" ref={containerRef}>
            {/* --- Main Trigger Button --- */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/[0.05]"
            >
                <span className="truncate">
                    {selectedExercise || "All Exercises"}
                </span>
                <ChevronDown className={`h-4 w-4 text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* --- Dropdown Menu --- */}
            {isOpen && (
                <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 p-1 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
                    {/* Search Field */}
                    <div className="relative mb-1 p-2">
                        <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Filter exercises..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl bg-white/5 py-1.5 pl-8 pr-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                    </div>

                    {/* Scrollable List of Options */}
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {/* Option: Clear filter ('All Exercises') */}
                        <button
                            onClick={() => { onSelect(null); setIsOpen(false); }}
                            className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors hover:bg-white/10"
                        >
                            <span className={!selectedExercise ? 'text-white font-semibold' : 'text-white/60'}>All Exercises</span>
                            {!selectedExercise && <Check className="h-3.5 w-3.5 text-white" />}
                        </button>

                        <div className="my-1 h-px bg-white/5" />

                        {/* List of dynamic exercises */}
                        {filteredExercises.map((exercise) => (
                            <button
                                key={exercise}
                                onClick={() => { onSelect(exercise); setIsOpen(false); }}
                                className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors hover:bg-white/10"
                            >
                                <span className={selectedExercise === exercise ? 'text-white font-semibold' : 'text-white/60'}>
                                    {exercise}
                                </span>
                                {selectedExercise === exercise && <Check className="h-3.5 w-3.5 text-white" />}
                            </button>
                        ))}

                        {/* Empty State */}
                        {filteredExercises.length === 0 && (
                            <div className="px-3 py-4 text-center text-xs text-white/30">
                                No exercises found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
