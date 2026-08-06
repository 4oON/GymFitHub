import React, { useState } from 'react';
import type { Routine } from '@/shared/types';
import { Play, Trash2, Plus, Edit2, ChevronDown, ChevronUp, Bot } from 'lucide-react';
import VideoPlayer from '@/features/exercise/components/VideoPlayer';

interface RoutineBuilderProps {
    routines: Routine[];
    onCreateRoutine: () => void;
    onDeleteRoutine: (id: string) => void;
    onStartRoutine: (routine: Routine) => void;
    onEditRoutine: (routine: Routine) => void;
}

/**
 * Routine Builder Component
 * Manages routine creation, display, and execution
 * Isolated from other features to allow independent modification
 */
const RoutineBuilder: React.FC<RoutineBuilderProps> = ({
    routines,
    onCreateRoutine,
    onDeleteRoutine,
    onStartRoutine,
    onEditRoutine,
}) => {
    const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);

    const toggleExpand = (routineId: string) => {
        setExpandedRoutineId(expandedRoutineId === routineId ? null : routineId);
    };

    return (
        <div className="mb-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">My Routines</h2>
                <button
                    onClick={onCreateRoutine}
                    className="text-emerald-400 text-sm font-bold flex items-center gap-1 hover:text-emerald-300 transition-colors bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 px-4 py-2 rounded-xl hover:from-emerald-500/30 hover:to-teal-500/30 backdrop-blur-sm transition-all duration-300"
                >
                    <Plus size={16} /> New Routine
                </button>
            </div>

            {/* Routine List */}
            <div className="grid grid-cols-1 gap-4">
                {routines.length === 0 ? (
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6 text-center shadow-lg backdrop-blur-sm border-dashed hover:border-emerald-500/50 transition-all duration-300">
                        <p className="text-slate-400 text-sm mb-3">
                            No routines yet. Create one to start quickly!
                        </p>
                        <button
                            onClick={onCreateRoutine}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:from-emerald-400 hover:to-teal-400 transition-all duration-300 shadow-lg shadow-emerald-500/20"
                        >
                            Create Routine
                        </button>
                    </div>
                ) : (
                    routines.map((routine) => {
                        const isExpanded = expandedRoutineId === routine.id;

                        return (
                            <div
                                key={routine.id}
                                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 shadow-lg backdrop-blur-sm hover:shadow-xl hover:shadow-emerald-500/10"
                            >
                                {/* Header */}
                                <div className="p-4 flex justify-between items-center">
                                    {/* Routine Info - Clickable to expand */}
                                    <div
                                        onClick={() => toggleExpand(routine.id)}
                                        className="flex-1 cursor-pointer min-w-0 pr-3 flex items-center gap-3"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-white text-lg truncate">
                                                    {routine.name}
                                                </h3>
                                                {routine.source === 'ai' && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-full border border-emerald-500/20 flex-shrink-0">
                                                        <Bot size={10} />
                                                        AI Recommend
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-slate-400 text-sm">
                                                {routine.exercises.length} Exercises
                                            </p>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp size={20} className="text-emerald-400 flex-shrink-0" />
                                        ) : (
                                            <ChevronDown size={20} className="text-slate-400 flex-shrink-0" />
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <button
                                            onClick={() => onStartRoutine(routine)}
                                            className="p-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-xl hover:from-emerald-500 hover:to-teal-500 hover:text-white transition-all duration-300 backdrop-blur-sm border border-emerald-500/30"
                                            title="Start Routine"
                                        >
                                            <Play size={20} fill="currentColor" />
                                        </button>
                                        <button
                                            onClick={() => onEditRoutine(routine)}
                                            className="p-2 bg-slate-700/50 text-slate-400 rounded-xl hover:bg-emerald-500/20 hover:text-emerald-400 transition-all duration-300 backdrop-blur-sm border border-slate-600/50"
                                            title="Edit Routine"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => onDeleteRoutine(routine.id)}
                                            className="p-2 bg-slate-700/50 text-slate-400 rounded-xl hover:bg-rose-500/20 hover:text-rose-400 transition-all duration-300 backdrop-blur-sm border border-slate-600/50"
                                            title="Delete Routine"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Exercise List */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-3">
                                        {routine.exercises.map((exercise, index) => (
                                            <div
                                                key={`${exercise.id}-${index}`}
                                                className="flex items-center gap-3 bg-gradient-to-r from-slate-700/30 to-slate-800/30 p-3 rounded-xl border border-slate-600/30 backdrop-blur-sm hover:border-emerald-500/50 transition-all duration-300"
                                            >
                                                {/* Video Thumbnail */}
                                                {(exercise.gifUrl || exercise.videoUrl) && (
                                                    <div className="w-16 h-16 flex-shrink-0 bg-slate-700/50 rounded-xl overflow-hidden border border-slate-600/50">
                                                        {exercise.gifUrl ? (
                                                            <img
                                                                src={exercise.gifUrl}
                                                                alt={exercise.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : exercise.videoUrl ? (
                                                            <VideoPlayer
                                                                videoUrl={exercise.videoUrl}
                                                                lazy={true}
                                                            />
                                                        ) : null}
                                                    </div>
                                                )}

                                                {/* Exercise Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-medium truncate">
                                                        {exercise.nameZh || exercise.name}
                                                    </p>
                                                    <p className="text-slate-400 text-xs mt-1">
                                                        {exercise.muscleGroup}
                                                        {exercise.equipment && ` • ${exercise.equipment}`}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RoutineBuilder;
