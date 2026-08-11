import React, { useEffect, useRef, useState } from 'react';
import type { ActiveExercise, WorkoutSet, Exercise, UserProfile } from '@/shared/types';
import { Trash2, Check, Plus, Timer, Hourglass, Info, Zap, TrendingUp, Activity, X, Clock, Target, Sparkles, Save, Scale, Calculator } from 'lucide-react';
import VideoPlayer from '@/features/exercise/components/VideoPlayer';
import { getExerciseTips, getExerciseRecommendation } from '@/features/ai/services/geminiService';
import HistoricalDataQueryService from '@/features/ai/services/HistoricalDataQueryService';
import SwipeableCard from './SwipeableCard';
import { VolumeCalculationService } from '../services/VolumeCalculationService';
import { ExerciseIdentificationService } from '../services/ExerciseIdentificationService';

interface InProgressWorkoutProps {
    /** Current workout session exercises */
    exercises: ActiveExercise[];
    /** Callback when exercise is updated */
    onExerciseUpdate: (exerciseId: string, updatedExercise: ActiveExercise) => void;
    /** Callback when set is completed */
    onSetComplete: (exerciseId: string, setId: string) => void;
    /** Callback when set is reset */
    onSetReset: (exerciseId: string, setId: string) => void;
    /** Callback when new set is added */
    onAddSet: (exerciseId: string) => void;
    /** Callback when set is removed */
    onRemoveSet: (exerciseId: string, setId: string) => void;
    /** Callback when exercise is removed from workout */
    onRemoveExercise: (exerciseId: string) => void;
    /** Callback when all exercises are cleared from workout */
    onClearAllExercises?: () => void;
    /** Callback when workout is finished */
    onFinishWorkout?: () => void;
    /** Callback when saving workout as routine */
    onSaveAsRoutine?: () => void;
    /** Total workout duration in seconds */
    workoutDuration?: number;
    /** Timer state for rest timers */
    timers?: Record<string, { targetTime: number; duration: number; startTime: number; exerciseName: string }>;
    /** Callback to toggle timer */
    onToggleTimer?: (exerciseId: string, duration: number, forceStart?: boolean, exerciseName?: string) => void;
    /** Exercise library for details */
    exerciseLibrary?: Exercise[];
    /** User profile for recommendations */
    userProfile?: UserProfile;
    /** Custom class name */
    className?: string;
}

/**
 * In-progress workout management component with original swipeable card design
 * Handles active workout sessions with real-time tracking
 */
const InProgressWorkout: React.FC<InProgressWorkoutProps> = ({
    exercises,
    onExerciseUpdate,
    onSetComplete,
    onSetReset,
    onAddSet,
    onRemoveSet,
    onRemoveExercise,
    onClearAllExercises,
    onFinishWorkout,
    onSaveAsRoutine,
    workoutDuration = 0,
    timers = {},
    onToggleTimer,
    exerciseLibrary = [],
    userProfile,
    className = '',
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [now, setNow] = useState(Date.now());
    const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
    const [dragDistance, setDragDistance] = useState<Record<string, number>>({});
    const [exerciseTips, setExerciseTips] = useState<Record<string, { english: string; chinese: string }>>({});
    const [recommendations, setRecommendations] = useState<Record<string, {
        sets: number;
        reps: string;
        weight: number;
        reason: string;
    }>>({});
    const [exerciseHistory] = useState<Record<string, {
        lastPerformed: number;
        sets: Array<{ weight: number; reps: number }>;
    }>>(() => {
        try {
            return JSON.parse(localStorage.getItem('zenfit_exercise_history') || '{}');
        } catch {
            return {};
        }
    });

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (bottomRef.current && exercises.length > 0) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [exercises.length]);

    // Calculate workout statistics with special exercise handling
    const workoutStats = React.useMemo(() => {
        const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
        const completedSets = exercises.reduce((sum, ex) =>
            sum + ex.sets.filter(set => set.completed).length, 0
        );
        
        // Use VolumeCalculationService for accurate volume calculation
        const totalVolume = VolumeCalculationService.calculateWorkoutVolume(
            exercises,
            exerciseLibrary,
            { userBodyweight: userProfile?.weight }
        );
        
        const totalReps = exercises.reduce((sum, ex) =>
            sum + ex.sets.filter(set => set.completed)
                .reduce((setSum, set) => setSum + set.reps, 0), 0
        );
        const muscleGroups = [...new Set(exercises.map(ex => ex.muscleGroup))];

        return {
            totalSets,
            completedSets,
            totalVolume,
            totalReps,
            muscleGroups,
            completionPercentage: totalSets > 0 ? (completedSets / totalSets) * 100 : 0
        };
    }, [exercises, exerciseLibrary, userProfile?.weight]);

    const formatTimeAgo = (timestamp?: number) => {
        if (!timestamp) return null;
        const diffSec = Math.floor((now - timestamp) / 1000);
        if (diffSec < 60) return `${diffSec}s ago`;
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
        return '>1h ago';
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const getExerciseDetails = (exerciseId: string) => exerciseLibrary.find(ex => ex.id === exerciseId);

    const handleQuickStart = (exerciseIndex: number, rec: { sets: number; reps: string; weight: number }) => {
        const reps = parseInt(rec.reps.split('-')[0]);
        const exercise = exercises[exerciseIndex];

        // Clear existing sets first
        const clearedSets = exercise.sets.map(set => ({ ...set, weight: 0, reps: 0, completed: false }));

        // Add sets to match recommendation count
        const setsNeeded = rec.sets;
        const currentSetsCount = exercise.sets.length;

        if (currentSetsCount < setsNeeded) {
            // Need to add more sets
            const updatedExercise = { ...exercise, sets: clearedSets };
            onExerciseUpdate(exercise.id, updatedExercise);

            // Add additional sets
            for (let i = currentSetsCount; i < setsNeeded; i++) {
                onAddSet(exercise.id);
            }
        } else {
            // Just update existing sets
            onExerciseUpdate(exercise.id, { ...exercise, sets: clearedSets });
        }

        setExpandedExerciseId(null);
    };

    const toggleInfo = async (exerciseId: string) => {
        if (expandedExerciseId === exerciseId) {
            setExpandedExerciseId(null);
            return;
        }
        setExpandedExerciseId(exerciseId);
        const ex = exercises.find(e => e.id === exerciseId);
        if (!ex || !userProfile) return;

        if (!exerciseTips[exerciseId]) {
            getExerciseTips(ex.exerciseName).then(tips => {
                setExerciseTips(prev => ({ ...prev, [exerciseId]: tips }));
            });
        }

        if (!recommendations[exerciseId]) {
            // 🆕 使用HistoricalDataQueryService获取真实的历史数据
            console.log(`🔍 [InProgressWorkout] Getting history for exercise: ${ex.exerciseName}`);
            const historyData = HistoricalDataQueryService.getExerciseHistory(ex.exerciseId, ex.exerciseName);

            let lastWorkout = undefined;
            if (historyData) {
                console.log(`📊 [InProgressWorkout] Found history for ${ex.exerciseName}:`, historyData);
                lastWorkout = {
                    sets: [{ weight: historyData.lastWeight, reps: historyData.lastReps }],
                    daysAgo: Math.floor((Date.now() - historyData.lastPerformed) / (1000 * 60 * 60 * 24))
                };
            } else {
                console.log(`⚠️ [InProgressWorkout] No history found for ${ex.exerciseName}`);
            }

            getExerciseRecommendation(
                ex.exerciseName,
                userProfile.weight,
                userProfile.experienceLevel || 'Intermediate',
                ex.mechanic || 'Compound',
                lastWorkout
            ).then(rec => {
                console.log(`✅ [InProgressWorkout] Generated recommendation for ${ex.exerciseName}:`, rec);
                setRecommendations(prev => ({ ...prev, [exerciseId]: rec }));
            });
        }
    };

    const handleDragUpdate = (exerciseId: string) => (dx: number, isActive: boolean) => {
        if (isActive && dx > 0) {
            // Only track right swipe (opening gesture)
            setDragDistance(prev => ({ ...prev, [exerciseId]: dx }));
        } else {
            // Reset when drag ends or going left
            setDragDistance(prev => ({ ...prev, [exerciseId]: 0 }));
        }
    };

    const handleSetUpdate = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) => {
        const exercise = exercises.find(ex => ex.id === exerciseId);
        if (!exercise) return;

        const updatedSets = exercise.sets.map(set =>
            set.id === setId ? { ...set, [field]: value } : set
        );

        onExerciseUpdate(exerciseId, { ...exercise, sets: updatedSets });
    };

    if (exercises.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="text-slate-600 mb-4">
                    <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Exercises Yet</h3>
                <p className="text-slate-400">Add exercises to start your workout</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full bg-slate-950 ${className}`}>
            {/* Header with workout controls and stats */}
            <div className="flex-shrink-0 p-4 border-b border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-white">Active Workout</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Workout duration */}
                        <div className="flex items-center gap-1 text-slate-400 text-sm">
                            <Clock size={14} />
                            {formatDuration(workoutDuration)}
                        </div>

                        {/* Save as Routine button */}
                        {exercises.length > 0 && onSaveAsRoutine && (
                            <button
                                onClick={onSaveAsRoutine}
                                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                title="Save as Routine"
                            >
                                <Save size={16} />
                            </button>
                        )}

                        {/* Clear all exercises button */}
                        {exercises.length > 0 && onClearAllExercises && (
                            <button
                                onClick={onClearAllExercises}
                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                                title="Clear All Exercises"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}

                        {/* Finish workout button */}
                        <button
                            onClick={onFinishWorkout}
                            className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                            title="Finish Workout"
                        >
                            <Check size={16} />
                        </button>
                    </div>
                </div>

                {/* Workout stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Target size={14} className="text-emerald-400" />
                            <span className="text-xs text-slate-400">Sets</span>
                        </div>
                        <div className="text-lg font-bold text-white">
                            {workoutStats.completedSets}/{workoutStats.totalSets}
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap size={14} className="text-blue-400" />
                            <span className="text-xs text-slate-400">Volume</span>
                        </div>
                        <div className="text-lg font-bold text-white">
                            {Math.round(workoutStats.totalVolume)}kg
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp size={14} className="text-purple-400" />
                            <span className="text-xs text-slate-400">Reps</span>
                        </div>
                        <div className="text-lg font-bold text-white">
                            {workoutStats.totalReps}
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Activity size={14} className="text-rose-400" />
                            <span className="text-xs text-slate-400">Muscles</span>
                        </div>
                        <div className="text-lg font-bold text-white">
                            {workoutStats.muscleGroups.length}
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${workoutStats.completionPercentage}%` }}
                    />
                </div>
                <div className="text-xs text-slate-400 mt-1 text-center">
                    {Math.round(workoutStats.completionPercentage)}% Complete
                </div>
            </div>

            {/* Exercise Cards */}
            <div className="flex-1 min-h-0 overflow-auto space-y-4 px-4 pb-24">
                {exercises.map((exercise, exIndex) => {
                    const timer = timers[exercise.id];
                    const isTimerRunning = timer?.targetTime ? timer.targetTime > now : false;
                    const isRestFinished = timer?.targetTime ? timer.targetTime <= now : false;
                    const timeLeft = timer?.targetTime ? Math.max(0, Math.ceil((timer.targetTime - now) / 1000)) : 0;
                    const progress = timer?.duration ? 1 - (timeLeft / timer.duration) : 0;
                    const hue = 240 - progress * 90;
                    const isExpanded = expandedExerciseId === exercise.id;
                    const exerciseDetails = getExerciseDetails(exercise.exerciseId);
                    const tips = exerciseTips[exercise.id];
                    const rec = recommendations[exercise.id];
                    const hist = exerciseHistory[exercise.exerciseId];

                    return (
                        <SwipeableCard
                            key={exercise.id}
                            onSwipeRight={() => toggleInfo(exercise.id)}
                            onSwipeLeft={() => isExpanded && setExpandedExerciseId(null)}
                            onDragUpdate={handleDragUpdate(exercise.id)}
                            className={`bg-slate-900 rounded-2xl shadow-lg overflow-hidden animate-slide-up transition-all duration-700 relative ${exercise.isAIRecommended
                                ? 'border-2 border-purple-500/50 shadow-purple-500/20'
                                : 'border border-slate-800'
                                }`}
                        >
                            {/* AI Recommendation Badge */}
                            {exercise.isAIRecommended && (
                                <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                    <Sparkles size={10} />
                                    AI
                                </div>
                            )}
                            {/* Header */}
                            <div className="p-4 bg-slate-850 flex justify-between items-center border-b border-slate-800">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <button
                                        onClick={() => toggleInfo(exercise.id)}
                                        className="p-2 text-slate-500 hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-800 flex-shrink-0"
                                    >
                                        <Info size={18} />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-semibold text-white leading-tight break-words ${exercise.exerciseName.length > 25 ? 'text-sm' : 'text-lg'
                                            }`}>{exercise.exerciseName}</h3>
                                        {exercise.exerciseNameZh && (
                                            <p className="text-xs text-slate-400">{exercise.exerciseNameZh}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => onToggleTimer?.(exercise.id, exercise.recommendedRestSeconds || 90, false, exercise.exerciseName)}
                                        className={`relative overflow-hidden flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all min-w-[85px] justify-center ${isTimerRunning ? 'bg-slate-900 border-slate-600' :
                                            isRestFinished ? 'bg-emerald-900/20 border-emerald-500/50' :
                                                'bg-slate-800 border-slate-700 hover:border-emerald-500/50'
                                            }`}
                                    >
                                        {isTimerRunning && (
                                            <div className="absolute inset-0 duration-1000" style={{
                                                width: `${progress * 100}%`,
                                                backgroundColor: `hsl(${hue}, 80%, 45%)`
                                            }} />
                                        )}
                                        {isTimerRunning ? (
                                            <>
                                                <Hourglass size={14} className="relative z-10 text-white" />
                                                <span className="relative z-10 font-mono font-bold text-white">
                                                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Timer size={14} className={isRestFinished ? "text-emerald-400" : "text-slate-400"} />
                                                <span className={`text-xs font-bold ${isRestFinished ? "text-emerald-400" : "text-slate-300"}`}>
                                                    {isRestFinished ? "Done" : "Rest"}
                                                </span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => onRemoveExercise(exercise.id)}
                                        className="text-slate-500 hover:text-red-400 p-2 hover:bg-slate-800 rounded-lg"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Info */}
                            <div
                                className="border-b border-slate-800 bg-slate-950 overflow-hidden ease-in-out"
                                style={{
                                    maxHeight: (() => {
                                        const drag = dragDistance[exercise.id] || 0;
                                        if (isExpanded) {
                                            // Fully expanded
                                            return '2000px';
                                        } else if (drag > 0) {
                                            // Following drag - scale from 0 to 800px based on drag distance (0-200px)
                                            const heightScale = Math.min(drag / 200, 1); // 200px drag = 100%
                                            return `${heightScale * 800}px`;
                                        } else {
                                            // Collapsed
                                            return '0px';
                                        }
                                    })(),
                                    opacity: (() => {
                                        const drag = dragDistance[exercise.id] || 0;
                                        if (isExpanded) return 1;
                                        if (drag > 0) return Math.min(drag / 100, 1); // Fade in over 100px
                                        return 0;
                                    })(),
                                    transition: isExpanded ? 'all 2000ms ease-in-out' : 'none'
                                }}
                            >
                                <div className="p-4 space-y-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white leading-tight">{exercise.exerciseName}</h3>
                                        {exercise.exerciseNameZh && (
                                            <p className="text-sm text-slate-400 mt-1">{exercise.exerciseNameZh}</p>
                                        )}
                                    </div>

                                    {exerciseDetails?.videoUrl && (
                                        <div className="relative w-full h-40 bg-slate-950 overflow-hidden rounded-xl mt-3">
                                            <div className="absolute inset-0">
                                                <VideoPlayer
                                                    videoUrl={exerciseDetails.videoUrl}
                                                    className="w-full h-full object-cover"
                                                    lazy={false}
                                                    preload="metadata"
                                                />
                                            </div>

                                            {/* Gradient overlay - keeps text readable on the left */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 via-30% to-slate-950/20 to-60% pointer-events-none" />

                                            {/* Labels */}
                                            <div className="relative h-full flex flex-col justify-between p-4 pointer-events-auto">
                                                {/* Top: All Labels */}
                                                <div className="flex flex-col gap-2">
                                                    {exercise.mechanic && (
                                                        <span className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border w-fit backdrop-blur-sm ${exercise.mechanic === 'Compound' ? 'bg-blue-500/30 text-blue-200 border-blue-400/50' : 'bg-purple-500/30 text-purple-200 border-purple-400/50'}`}>
                                                            {exercise.mechanic}
                                                        </span>
                                                    )}
                                                    {exerciseDetails?.difficulty && (
                                                        <span className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border w-fit backdrop-blur-sm ${exerciseDetails.difficulty === 'Beginner' ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50' :
                                                            exerciseDetails.difficulty === 'Intermediate' ? 'bg-amber-500/30 text-amber-200 border-amber-400/50' :
                                                                'bg-rose-500/30 text-rose-200 border-rose-400/50'
                                                            }`}>
                                                            {exerciseDetails.difficulty}
                                                        </span>
                                                    )}
                                                    {exerciseDetails?.equipment && (
                                                        <span className="px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border w-fit backdrop-blur-sm bg-slate-700/40 text-slate-200 border-slate-500/50">
                                                            {exerciseDetails.equipment}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Bottom: Muscle Information */}
                                                <div className="flex items-center gap-x-2 text-xs">
                                                    <span className="flex items-center gap-1 text-emerald-200 font-medium backdrop-blur-sm bg-slate-950/60 px-2 py-1 rounded-md border border-emerald-500/30">
                                                        <Activity size={12} /> {exercise.muscleGroup}
                                                    </span>
                                                    {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                                                        <span className="text-slate-200 capitalize leading-tight backdrop-blur-sm bg-slate-950/60 px-2 py-1 rounded-md text-[10px] border border-slate-500/30">
                                                            {exercise.secondaryMuscles.join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}


                                    {rec && (
                                        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg p-3 space-y-2">
                                            <div className="text-xs text-indigo-400 font-bold uppercase flex items-center gap-1">
                                                <Zap size={12} /> AI Recommendation
                                            </div>
                                            <div className="flex items-baseline gap-2 flex-wrap">
                                                {(() => {
                                                    const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exerciseDetails);
                                                    const isDuration = typeInfo.trackingMode === 'duration';
                                                    const isAssisted = typeInfo.weightInputMode === 'assisted_subtraction';
                                                    const userWeight = userProfile?.weight || 70;
                                                    const actualResistance = isAssisted ? Math.max(0, userWeight - rec.weight) : rec.weight;
                                                    
                                                    return (
                                                        <>
                                                            <span className="text-lg font-bold text-white">{rec.sets} × {rec.reps}{isDuration ? 's' : ''}</span>
                                                            <span className="text-emerald-400 font-bold">@</span>
                                                            {isAssisted ? (
                                                                <div className="flex flex-col">
                                                                    <span className="text-2xl font-black text-emerald-400">{rec.weight}kg <span className="text-sm font-normal text-slate-400">assist</span></span>
                                                                    <span className="text-xs text-blue-400">Actual: {actualResistance}kg ({userWeight} - {rec.weight})</span>
                                                                </div>
                                                            ) : typeInfo.weightInputMode === 'dumbbell_per_side' ? (
                                                                <div className="flex flex-col">
                                                                    <span className="text-2xl font-black text-emerald-400">{rec.weight}kg <span className="text-sm font-normal text-slate-400">per dumbbell</span></span>
                                                                    <span className="text-xs text-amber-400">Total: {rec.weight * 2}kg (each side)</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-2xl font-black text-emerald-400">{rec.weight}kg</span>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            <p className="text-xs text-slate-400 italic">💡 {rec.reason}</p>
                                            <button
                                                onClick={() => handleQuickStart(exIndex, rec)}
                                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <Zap size={16} /> Quick Start
                                            </button>
                                        </div>
                                    )}

                                    {hist && (
                                        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 space-y-2">
                                            <div className="text-xs text-amber-400 font-bold uppercase flex items-center gap-1">
                                                <TrendingUp size={12} /> Last Workout
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {Math.floor((Date.now() - hist.lastPerformed) / 86400000)} days ago
                                            </div>
                                            {(() => {
                                                const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exerciseDetails);
                                                const isDuration = typeInfo.trackingMode === 'duration';
                                                return hist.sets.slice(0, 3).map((set, i) => (
                                                    <div key={i} className="text-xs text-slate-300">
                                                        Set {i + 1}: {set.weight}kg × {set.reps}{isDuration ? 's' : ' reps'}
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sets */}
                            <div className="p-2">
                                {/* Exercise Input Mode Hints */}
                                {exerciseDetails && (
                                    <div className="mb-3 px-2">
                                        {(() => {
                                            const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exerciseDetails);
                                            return (
                                                <>
                                                    {typeInfo.weightInputMode === 'dumbbell_per_side' && (
                                                        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                                                            <Scale size={14} />
                                                            <span>Enter weight of ONE dumbbell (total = x2)</span>
                                                        </div>
                                                    )}
                                                    {typeInfo.weightInputMode === 'assisted_subtraction' && (
                                                        <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                                                            <Calculator size={14} />
                                                            <span>Assistance weight: Actual = Bodyweight - Assistance</span>
                                                        </div>
                                                    )}
                                                    {typeInfo.trackingMode === 'duration' && (
                                                        <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                                                            <Timer size={14} />
                                                            <span>Time-based: Enter duration in seconds</span>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                                <div className="grid grid-cols-10 gap-2 mb-2 px-2 text-xs font-medium text-slate-500 uppercase text-center">
                                    <div className="col-span-2">Set</div>
                                    <div className="col-span-3">kg</div>
                                    <div className="col-span-3">
                                        {(() => {
                                            const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exerciseDetails);
                                            return typeInfo.trackingMode === 'duration' ? 'Sec' : 'Reps';
                                        })()}
                                    </div>
                                    <div className="col-span-2">✓</div>
                                </div>

                                {exercise.sets.map((set, setIndex) => (
                                    <div key={set.id} className="relative mb-3">
                                        <div className={`grid grid-cols-10 gap-2 items-center px-2 py-3 rounded-lg transition-colors ${set.completed ? 'bg-emerald-900/10 border border-emerald-900/30' : 'bg-slate-800/50'
                                            }`}>
                                            <div className="col-span-2 text-center font-mono text-slate-400 text-sm flex items-center justify-center gap-1">
                                                {setIndex + 1}
                                                <button
                                                    onClick={() => onRemoveSet(exercise.id, set.id)}
                                                    className="text-slate-600 hover:text-red-400 transition-colors"
                                                    title="Delete set"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    type="number"
                                                    value={set.weight || ''}
                                                    placeholder={rec ? `${rec.weight}` : "0"}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-md text-center py-1.5 text-white focus:border-emerald-500 focus:outline-none text-sm font-bold placeholder-slate-500"
                                                    onChange={e => handleSetUpdate(exercise.id, set.id, 'weight', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    type="number"
                                                    value={set.reps || ''}
                                                    placeholder={rec ? rec.reps.split('-')[0] : (() => {
                                                    const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exerciseDetails);
                                                    return typeInfo.trackingMode === 'duration' ? 'Sec' : '0';
                                                })()}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-md text-center py-1.5 text-white focus:border-emerald-500 focus:outline-none text-sm font-bold placeholder-slate-500"
                                                    onChange={e => handleSetUpdate(exercise.id, set.id, 'reps', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div className="col-span-2 flex justify-center">
                                                <button
                                                    onClick={() => onSetComplete(exercise.id, set.id)}
                                                    className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${set.completed ? 'bg-emerald-500 text-white scale-105' : 'bg-slate-700 text-slate-400'
                                                        }`}
                                                >
                                                    <Check size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        {set.completed && (set as any).restCompletedAt && (
                                            <div className="absolute -bottom-2 right-3 text-[10px] font-medium text-emerald-300 bg-slate-950/90 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                                {formatTimeAgo((set as any).restCompletedAt)}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <button
                                    onClick={() => onAddSet(exercise.id)}
                                    className="w-full py-2 mt-3 flex items-center justify-center gap-2 text-sm font-medium text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 border-dashed hover:border-emerald-500/50"
                                >
                                    <Plus size={14} /> Add Set
                                </button>
                            </div>
                        </SwipeableCard>
                    );
                })}
            </div>

            <div ref={bottomRef} />
        </div>
    );
};

export default InProgressWorkout;