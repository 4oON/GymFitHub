import React, { useEffect, useRef, useState } from 'react';
import type { ActiveExercise, WorkoutSet, Exercise, UserProfile } from '@/shared/types';
import { Trash2, Check, Plus, Timer, Hourglass, Info, Zap, TrendingUp, Activity, X, Clock, Target, Sparkles, Save, Scale, Calculator, MoreHorizontal } from 'lucide-react';
import VideoPlayer from '@/features/exercise/components/VideoPlayer';
import { getExerciseTips, getExerciseRecommendation } from '@/features/ai/services/geminiService';
import HistoricalDataQueryService from '@/features/ai/services/HistoricalDataQueryService';
import SwipeableCard from './SwipeableCard';
import { VolumeCalculationService } from '../services/VolumeCalculationService';
import { ExerciseIdentificationService } from '../services/ExerciseIdentificationService';
import { iOSStorage } from '@/services/iOSStorageService';
import type { WeightUnit } from '../utils/weightUnitUtils';
import {
    lbToKg,
    kgToLb,
    snapLbToPreset,
    formatKgHint,
    round1,
    round2,
} from '../utils/weightUnitUtils';
import WeightWheel from './WeightWheel';
import NumericKeypad from './NumericKeypad';
import type { KeypadKey } from './NumericKeypad';

/** Storage key for per-exercise weight unit preferences (kg default, lb opt-in) */
const WEIGHT_UNIT_PREFS_KEY = 'zenfit_weight_unit_prefs';

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
    /** Timestamp of the last scroll on the cards list, for the dock mis-tap guard */
    const lastScrollAt = useRef(0);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    /** In-app numeric keypad target (null = closed). Replaces the system
        keyboard, which is a full QWERTY layout on iOS WebViews. */
    const [keypadTarget, setKeypadTarget] = useState<{
        exerciseId: string;
        setId: string;
        field: 'weight' | 'reps';
        allowDecimal: boolean;
        title: string;
    } | null>(null);
    const [keypadBuffer, setKeypadBuffer] = useState('');
    /** Tap-to-expand glass stats sheet below the header strip */
    const [showStatsSheet, setShowStatsSheet] = useState(false);
    const [statsPage, setStatsPage] = useState(0);
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
            return JSON.parse(iOSStorage.getItem('zenfit_exercise_history') || '{}');
        } catch {
            return {};
        }
    });

    /**
     * Per-exercise weight unit preference (dumbbell exercises only).
     * kg is the default; lb is an opt-in toggle rendered inconspicuously
     * inside the weight input. Internally everything stays kg.
     */
    const [weightUnits, setWeightUnits] = useState<Record<string, WeightUnit>>(() => {
        try {
            return JSON.parse(iOSStorage.getItem(WEIGHT_UNIT_PREFS_KEY) || '{}');
        } catch {
            return {};
        }
    });

    const getUnit = (exercise: ActiveExercise): WeightUnit =>
        weightUnits[exercise.exerciseId] || 'kg';

    const toggleUnit = (exercise: ActiveExercise) => {
        const key = exercise.exerciseId;
        const next: WeightUnit = getUnit(exercise) === 'kg' ? 'lb' : 'kg';
        setWeightUnits(prev => {
            const updated = { ...prev, [key]: next };
            try {
                iOSStorage.setItem(WEIGHT_UNIT_PREFS_KEY, JSON.stringify(updated));
            } catch {
                // Storage unavailable (e.g. iOS private mode): keep in-memory only
            }
            return updated;
        });
    };

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

    /** Pages of the expandable glass stats sheet (swipeable, snap per page). */
    const statPages = [
        {
            key: 'sets', icon: Target, label: 'Sets',
            value: `${workoutStats.completedSets}/${workoutStats.totalSets}`,
            desc: 'Sets completed out of the sets planned for this session.'
        },
        {
            key: 'volume', icon: Zap, label: 'Volume',
            value: `${Math.round(workoutStats.totalVolume)} kg`,
            desc: 'Total weight lifted. Every completed set adds weight x reps.',
            highlight: true
        },
        {
            key: 'reps', icon: TrendingUp, label: 'Reps',
            value: `${workoutStats.totalReps}`,
            desc: 'Total repetitions performed across all completed sets.'
        },
        {
            key: 'muscles', icon: Activity, label: 'Muscles',
            value: `${workoutStats.muscleGroups.length}`,
            desc: 'Distinct muscle groups trained in this workout.'
        },
    ];

    const formatTimeAgo = (timestamp?: number) => {
        if (!timestamp) return null;
        const diffSec = Math.floor((now - timestamp) / 1000);
        if (diffSec < 60) return `${diffSec}s ago`;
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
        return '>1h ago';
    };

    const formatDuration = (seconds: number) => {
        if (seconds >= 3600) {
            // Compact decimal-hours format (1.4h) so the clock never collides
            // with the stats cluster on narrow screens.
            return `${(seconds / 3600).toFixed(1)}h`;
        }
        const mins = Math.floor(seconds / 60);
        return `${mins}m`;
    };

    const getExerciseDetails = (exerciseId: string) => exerciseLibrary.find(ex => ex.id === exerciseId);

    const handleQuickStart = (exerciseIndex: number, rec: { sets: number; reps: string; weight: number }) => {
        const reps = parseInt(rec.reps.split('-')[0]);
        const exercise = exercises[exerciseIndex];

        // AI recommendation is in kg. If the user prefers lb for this dumbbell
        // exercise, snap the recommendation to the nearest available lb plate
        // before converting back to kg for storage.
        const unit = getUnit(exercise);
        let recWeightKg = rec.weight;
        if (unit === 'lb') {
            recWeightKg = lbToKg(snapLbToPreset(kgToLb(rec.weight)));
        }

        // Rebuild the set list to match the recommended set count,
        // pre-filled with the (possibly converted) recommended weight.
        const targetCount = Math.max(rec.sets, 1);
        const newSets = Array.from({ length: targetCount }, (_, i) => ({
            ...(exercise.sets[i] || { id: `${exercise.id}-set-${Date.now()}-${i}` }),
            weight: recWeightKg,
            reps,
            completed: false,
        }));

        onExerciseUpdate(exercise.id, { ...exercise, sets: newSets });
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

    /** Open the in-app numeric keypad for a set field. */
    const openKeypad = (
        exerciseId: string,
        setId: string,
        field: 'weight' | 'reps',
        currentValue: number,
        allowDecimal: boolean,
        title: string
    ) => {
        setKeypadBuffer(currentValue > 0 ? String(currentValue) : '');
        setKeypadTarget({ exerciseId, setId, field, allowDecimal, title });
    };

    /** Route a keypad press: edit the buffer live and commit immediately. */
    const handleKeypadKey = (key: KeypadKey) => {
        const t = keypadTarget;
        if (!t) return;
        if (key === 'done') { setKeypadTarget(null); return; }
        if (key === 'clear') {
            setKeypadBuffer('');
            handleSetUpdate(t.exerciseId, t.setId, t.field, 0);
            return;
        }
        if (key === 'back') {
            setKeypadBuffer(prev => {
                const next = prev.slice(0, -1);
                handleSetUpdate(t.exerciseId, t.setId, t.field, next ? parseFloat(next) : 0);
                return next;
            });
            return;
        }
        if (key === '.' && !t.allowDecimal) return;
        setKeypadBuffer(prev => {
            if (prev.replace('.', '').length >= 4) return prev; // cap at 4 digits
            if (key === '.' && prev.includes('.')) return prev;
            if (key === '.' && prev === '') return '0.';
            const next = prev + key;
            handleSetUpdate(t.exerciseId, t.setId, t.field, parseFloat(next));
            return next;
        });
    };

    /**
     * Mis-tap guard for the docked action bar. When the cards list is
     * scrolling or gliding, a finger that comes down on the dock is almost
     * always an accidental touchdown, not an intentional press. Swallow any
     * dock tap that lands within 300ms after the last scroll event.
     */
    const guardDockTap = (e: React.MouseEvent) => {
        if (Date.now() - lastScrollAt.current < 300) {
            e.preventDefault();
            e.stopPropagation();
        }
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
            {/* Slim sticky header: title + duration + inline stats + progress.
                Critical actions moved to the docked bottom bar so system
                notifications and in-app toasts can never block them. */}
            <div className="flex-shrink-0 px-4 pt-3 pb-2.5 border-b border-slate-800 bg-slate-950/95 z-30">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <h2 className="text-base font-bold text-white whitespace-nowrap">Active Workout</h2>
                        <span className="flex items-center gap-1 text-slate-400 text-[11px] whitespace-nowrap">
                            <Clock size={11} />
                            {formatDuration(workoutDuration)}
                        </span>
                    </div>
                    {/* Inline stats: tap the strip to expand the glass sheet
                        below; Volume stays highlighted as the primary metric. */}
                    <div
                        className="flex items-center gap-2.5 text-[11px] whitespace-nowrap cursor-pointer select-none"
                        onClick={() => setShowStatsSheet(v => !v)}
                        style={{ touchAction: 'manipulation' }}
                        title="Tap to expand stats"
                    >
                        <span className="flex items-center gap-1 text-slate-500" title="Sets">
                            <Target size={11} />
                            <span className="font-semibold text-slate-400">{workoutStats.completedSets}/{workoutStats.totalSets}</span>
                        </span>
                        <span
                            className="flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5"
                            title="Volume (total weight lifted)"
                        >
                            <Zap size={12} className="text-emerald-400" />
                            <span className="text-[13px] font-black text-emerald-300">{Math.round(workoutStats.totalVolume)}kg</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-500" title="Reps">
                            <TrendingUp size={11} />
                            <span className="font-semibold text-slate-400">{workoutStats.totalReps}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-500" title="Muscle groups">
                            <Activity size={11} />
                            <span className="font-semibold text-slate-400">{workoutStats.muscleGroups.length}</span>
                        </span>
                    </div>
                </div>

                {/* Progress bar with inline percentage */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${workoutStats.completionPercentage}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 w-8 text-right">
                        {Math.round(workoutStats.completionPercentage)}%
                    </span>
                </div>

                {/* Expandable glass stats sheet (~1/4 of the screen). The grid
                    rows transition gives the smooth grow/collapse; inside, a
                    snap-scrolling pager shows one stat per page with an Apple
                    frosted-glass look. */}
                <div
                    className={`grid transition-all duration-300 ease-in-out ${showStatsSheet ? 'grid-rows-[1fr] opacity-100 mt-2.5' : 'grid-rows-[0fr] opacity-0'
                        }`}
                >
                    <div className="overflow-hidden">
                        <div
                            className="relative h-52 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden"
                            data-swipe-ignore
                            style={{ touchAction: 'pan-x' }}
                        >
                            <div
                                className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
                                onScroll={e => {
                                    const el = e.currentTarget;
                                    const i = Math.round(el.scrollLeft / el.clientWidth);
                                    if (i !== statsPage) setStatsPage(Math.max(0, Math.min(statPages.length - 1, i)));
                                }}
                            >
                                {statPages.map(p => (
                                    <div key={p.key} className="min-w-full h-full snap-center flex flex-col items-center justify-center px-8">
                                        <p.icon size={18} className={p.highlight ? 'text-emerald-400 mb-2' : 'text-slate-500 mb-2'} />
                                        <span className={`text-4xl font-black tabular-nums ${p.highlight ? 'text-emerald-300' : 'text-white'}`}>
                                            {p.value}
                                        </span>
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">{p.label}</span>
                                        <p className="text-[11px] text-slate-500 text-center mt-2 leading-relaxed">{p.desc}</p>
                                    </div>
                                ))}
                            </div>
                            {/* Page dots + close */}
                            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                                {statPages.map((p, i) => (
                                    <span
                                        key={p.key}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${i === statsPage ? 'w-4 bg-emerald-400' : 'w-1.5 bg-slate-600'
                                            }`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => setShowStatsSheet(false)}
                                className="absolute top-2 right-2 p-1.5 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                                style={{ touchAction: 'manipulation' }}
                                title="Close"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exercise Cards. overscroll-contain stops the rubber-band from
                chaining to the outer page scroller, so the header above can
                never be bounced out of view by an over-scroll. */}
            <div
                className="flex-1 min-h-0 overflow-auto overscroll-contain space-y-4 px-4 pb-44"
                onScroll={() => { lastScrollAt.current = Date.now(); }}
            >
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
                    const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exerciseDetails);
                    const isDumbbellExercise = typeInfo.weightInputMode === 'dumbbell_per_side';
                    const weightUnit = getUnit(exercise);

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
                                                    const unit = getUnit(exercise);
                                                    const isDumbbell = typeInfo.weightInputMode === 'dumbbell_per_side';

                                                    return (
                                                        <>
                                                            <span className="text-lg font-bold text-white">{rec.sets} × {rec.reps}{isDuration ? 's' : ''}</span>
                                                            <span className="text-emerald-400 font-bold">@</span>
                                                            {isAssisted ? (
                                                                <div className="flex flex-col">
                                                                    <span className="text-2xl font-black text-emerald-400">{rec.weight}kg <span className="text-sm font-normal text-slate-400">assist</span></span>
                                                                    <span className="text-xs text-blue-400">Actual: {actualResistance}kg ({userWeight} - {rec.weight})</span>
                                                                </div>
                                                            ) : isDumbbell ? (
                                                                <div className="flex flex-col">
                                                                    <span className="text-2xl font-black text-emerald-400">{rec.weight}kg <span className="text-sm font-normal text-slate-400">per dumbbell</span></span>
                                                                    <span className="text-xs text-amber-400">Total: {rec.weight * 2}kg (each side)</span>
                                                                    {unit === 'lb' && (
                                                                        <span className="text-[10px] text-slate-500">
                                                                            ≈ {round1(kgToLb(rec.weight))} lb per dumbbell · nearest plate {snapLbToPreset(kgToLb(rec.weight))} lb
                                                                        </span>
                                                                    )}
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
                                        {isDumbbellExercise && (
                                            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                                                <Scale size={14} />
                                                <span>
                                                    {weightUnit === 'lb'
                                                        ? 'Wheel = ONE dumbbell in lb, auto-saved as kg (total = x2)'
                                                        : 'Wheel = weight of ONE dumbbell (total = x2)'}
                                                </span>
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
                                    </div>
                                )}

                                {/* Imperial dumbbell quick-select chips: replaced by the WeightWheel picker */}
                                <div className="grid grid-cols-10 gap-2 mb-2 px-2 text-xs font-medium text-slate-500 uppercase text-center">
                                    <div className="col-span-2">Set</div>
                                    <div className="col-span-3">
                                        {/* Unit toggle is available on every exercise (kg default),
                                            so future imperial users are covered on any equipment. */}
                                        <button
                                            onClick={() => toggleUnit(exercise)}
                                            className={`uppercase transition-colors ${weightUnit === 'lb' ? 'text-amber-500 font-bold' : 'hover:text-slate-300'
                                                }`}
                                            style={{ touchAction: 'manipulation' }}
                                            title="Tap to switch kg/lb"
                                        >
                                            {weightUnit}
                                        </button>
                                    </div>
                                    <div className="col-span-3">
                                        {typeInfo.trackingMode === 'duration' ? 'Sec' : 'Reps'}
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
                                                <WeightWheel
                                                    kgValue={set.weight}
                                                    unit={weightUnit}
                                                    variant={isDumbbellExercise ? 'dumbbell' : 'generic'}
                                                    onChange={kg => handleSetUpdate(exercise.id, set.id, 'weight', kg)}
                                                />
                                                {/* Fixed-height, single-line hint keeps every set row
                                                    aligned. lb: actual kg weight; kg dumbbell: both-dumbbell total. */}
                                                <div className="h-4 mt-0.5 text-[10px] text-slate-500 text-center leading-none whitespace-nowrap">
                                                    {set.weight > 0 && (weightUnit === 'lb'
                                                        ? `= ${formatKgHint(set.weight)}`
                                                        : (isDumbbellExercise ? `total ${formatKgHint(round2(set.weight * 2))}` : ''))}
                                                </div>
                                            </div>
                                            <div className="col-span-3">
                                                <button
                                                    type="button"
                                                    data-swipe-ignore
                                                    onClick={() => openKeypad(
                                                        exercise.id,
                                                        set.id,
                                                        'reps',
                                                        set.reps,
                                                        true,
                                                        `${typeInfo.trackingMode === 'duration' ? 'Duration (sec)' : 'Reps'} - Set ${setIndex + 1}`
                                                    )}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-md py-1.5 text-center text-sm font-bold text-white active:border-emerald-500 transition-colors"
                                                    style={{ touchAction: 'manipulation' }}
                                                >
                                                    {set.reps > 0 ? set.reps : (
                                                        <span className="text-slate-500">
                                                            {rec ? rec.reps.split('-')[0] : (typeInfo.trackingMode === 'duration' ? 'Sec' : '0')}
                                                        </span>
                                                    )}
                                                </button>
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

            {/* In-app numeric keypad: replaces the dock slot while a field is
                being edited. It is not a real input, so iOS never brings up
                the system keyboard nor scrolls the page to reveal it. */}
            {keypadTarget && (
                <div
                    className="fixed left-0 right-0 z-40 px-4 pointer-events-none"
                    style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
                >
                    <div className="max-w-md mx-auto pointer-events-auto" onClickCapture={guardDockTap}>
                        <NumericKeypad
                            title={keypadTarget.title}
                            value={keypadBuffer}
                            allowDecimal={keypadTarget.allowDecimal}
                            onKey={handleKeypadKey}
                            onClose={() => setKeypadTarget(null)}
                        />
                    </div>
                </div>
            )}

            {/* Docked bottom action bar, just above the tab nav.
                Mis-tap protection has three layers:
                1. guardDockTap swallows taps that land within 300ms after a
                   scroll/fling (a touchdown while content glides underneath)
                2. Secondary actions live behind one More tap instead of
                   sitting next to Finish as hot targets
                3. Clear All is destructive, so it asks for a second
                   confirming tap inside the menu. All labels stay English,
                   icons where text would be too long.
                Hidden while the numeric keypad owns this screen slot. */}
            {!keypadTarget && (
            <div
                className="fixed left-0 right-0 z-40 px-4 pointer-events-none"
                style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
            >
                <div
                    className="max-w-md mx-auto flex items-center gap-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-2 shadow-2xl pointer-events-auto"
                    onClickCapture={guardDockTap}
                >
                    <div className="relative">
                        <button
                            onClick={() => { setShowMoreMenu(v => !v); setConfirmClear(false); }}
                            className={`p-3 rounded-xl border transition-colors ${showMoreMenu ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}
                            title="More actions"
                            style={{ touchAction: 'manipulation' }}
                        >
                            <MoreHorizontal size={18} />
                        </button>
                        {showMoreMenu && (
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                                {onSaveAsRoutine && (
                                    <button
                                        onClick={() => { setShowMoreMenu(false); onSaveAsRoutine(); }}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-blue-400 hover:bg-slate-800"
                                        style={{ touchAction: 'manipulation' }}
                                    >
                                        <Save size={15} /> Save as Routine
                                    </button>
                                )}
                                {onClearAllExercises && (
                                    confirmClear ? (
                                        <button
                                            onClick={() => { setShowMoreMenu(false); setConfirmClear(false); onClearAllExercises(); }}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-white bg-red-600"
                                            style={{ touchAction: 'manipulation' }}
                                        >
                                            <Trash2 size={15} /> Tap to Confirm
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setConfirmClear(true);
                                                window.setTimeout(() => setConfirmClear(false), 3000);
                                            }}
                                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-slate-800 ${onSaveAsRoutine ? 'border-t border-slate-800' : ''
                                                }`}
                                            style={{ touchAction: 'manipulation' }}
                                        >
                                            <Trash2 size={15} /> Clear All
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => { setShowMoreMenu(false); onFinishWorkout?.(); }}
                        className="flex-1 bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20"
                        style={{ touchAction: 'manipulation' }}
                    >
                        <Check size={18} /> Finish Workout
                    </button>
                </div>
            </div>
            )}

            <div ref={bottomRef} />
        </div>
    );
};

export default InProgressWorkout;