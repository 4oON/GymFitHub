import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, BookmarkPlus, Activity, Wrench, Layers, BarChart3, Star } from 'lucide-react';
import type { Exercise, Routine } from '@/shared/types';
import VideoPlayer from '@/shared/video/VideoPlayer';
import ExerciseMuscleMap from '@/features/anatomy/components/ExerciseMuscleMap';

interface ExerciseDetailModalProps {
    /** The exercise to display. null = closed */
    exercise: Exercise | null;
    /** Whether the exercise is already in the active workout */
    isInActiveWorkout?: boolean;
    /** Existing routines (used for quick-add shortcut) */
    routines?: Routine[];
    onClose: () => void;
    onAddToWorkout: (exercise: Exercise) => void;
    onAddToRoutine: (exercise: Exercise) => void;
}

const DIFFICULTY_META: Record<string, { zh: string; text: string; border: string }> = {
    Beginner: { zh: '初级', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    Intermediate: { zh: '中级', text: 'text-amber-400', border: 'border-amber-500/30' },
    Advanced: { zh: '高级', text: 'text-rose-400', border: 'border-rose-500/30' },
};

const MECHANIC_META: Record<string, { zh: string; text: string; border: string }> = {
    Compound: { zh: '复合动作', text: 'text-blue-400', border: 'border-blue-500/30' },
    Isolation: { zh: '孤立动作', text: 'text-purple-400', border: 'border-purple-500/30' },
};

/**
 * 自动生成的动作要领（数据源暂无 instructions 字段，基于 mechanic/trackingMode 推导）
 * Auto-generated exercise cues derived from mechanic & tracking mode.
 */
function generateCues(exercise: Exercise): string[] {
    const cues: string[] = [];
    if (exercise.mechanic === 'Compound') {
        cues.push('复合动作：保持核心收紧，注意动作全程的姿势稳定。');
        cues.push('先掌握动作模式再逐步增加重量。');
    } else if (exercise.mechanic === 'Isolation') {
        cues.push('孤立动作：集中感受目标肌群发力，避免借力。');
        cues.push('控制离心（回放）阶段，保持肌肉持续紧张。');
    } else {
        cues.push('保持动作标准，注意呼吸节奏。');
    }
    if (exercise.trackingMode === 'duration') {
        cues.push('计时动作：保持姿势稳定直至计时结束。');
    } else {
        cues.push('建议 8-12 次/组，感受目标肌群充分收缩。');
    }
    return cues;
}

/**
 * Full-screen exercise detail modal (iOS WebView compatible):
 * - Portal-based (escapes parent stacking context)
 * - Backdrop tap to close, pt-safe safe-area padding
 * - Large inline video player + full exercise info + auto-generated cues
 * - One-tap "Add to Active Workout" / "Add to Routine"
 */
const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
    exercise,
    isInActiveWorkout = false,
    routines = [],
    onClose,
    onAddToWorkout,
    onAddToRoutine,
}) => {
    const isOpen = !!exercise;

    // Lock body scroll while open (iOS-safe: store & restore scroll position)
    useEffect(() => {
        if (!isOpen) return;
        const scrollY = window.scrollY;
        const { style } = document.body;
        const prev = { overflow: style.overflow, position: style.position, top: style.top, width: style.width };
        style.overflow = 'hidden';
        style.position = 'fixed';
        style.top = `-${scrollY}px`;
        style.width = '100%';
        return () => {
            style.overflow = prev.overflow;
            style.position = prev.position;
            style.top = prev.top;
            style.width = prev.width;
            window.scrollTo(0, scrollY);
        };
    }, [isOpen]);

    // ESC to close (desktop convenience)
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    const cues = useMemo(() => (exercise ? generateCues(exercise) : []), [exercise]);

    if (!exercise) return null;

    const difficultyMeta = exercise.difficulty ? DIFFICULTY_META[exercise.difficulty] : undefined;
    const mechanicMeta = exercise.mechanic ? MECHANIC_META[exercise.mechanic] : undefined;
    const primaryRoutine = routines.length > 0 ? routines[0] : null;

    const handleAddToWorkout = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddToWorkout(exercise);
        onClose();
    };

    const handleQuickAddToRoutine = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!primaryRoutine) return;
        // 快捷路径：直接加入第一个 routine，避免再次弹出选择窗口
        onAddToRoutine(exercise);
        onClose();
    };

    const handleChooseRoutine = (e: React.MouseEvent) => {
        e.stopPropagation();
        // 打开 MainApp 的 routine 选择窗口
        onAddToRoutine(exercise);
        onClose();
    };

    const modal = (
        <div
            className="fixed inset-0 z-[9999] flex flex-col bg-slate-950 animate-fade-in pt-safe"
            role="dialog"
            aria-modal="true"
            aria-label={exercise.nameZh || exercise.name}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
                <div className="min-w-0 flex-1 pr-3">
                    <h2 className="text-lg font-bold text-white truncate">
                        {exercise.nameZh || exercise.name}
                    </h2>
                    {exercise.nameZh && (
                        <p className="text-xs text-slate-500 truncate">{exercise.name}</p>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 text-slate-400 hover:text-white active:scale-95 transition-all"
                    style={{ touchAction: 'manipulation' }}
                    aria-label="关闭 / Close"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Scrollable content */}
            <div
                className="flex-1 overflow-y-auto overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {/* Video */}
                {exercise.videoUrl && (
                    <div className="w-full aspect-video bg-slate-900">
                        <VideoPlayer
                            videoUrl={exercise.videoUrl}
                            lazy={false}
                            autoPlay={true}
                            controls={true}
                        />
                    </div>
                )}

                <div className="px-4 py-4 max-w-md mx-auto w-full pb-8">
                    {/* 肌肉解剖图：正面 + 背面，按 MUSCLE_THEME 高亮 */}
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
                            <Activity size={16} className="text-emerald-400" />
                            肌肉刺激图解 / Muscle Activation
                        </h3>
                        <ExerciseMuscleMap
                            primaryMuscle={exercise.muscleGroup}
                            secondaryMuscles={exercise.secondaryMuscles}
                            muscleIds={exercise.muscle_ids}
                            height={220}
                        />
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                        {exercise.difficulty && difficultyMeta && (
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border bg-slate-900 ${difficultyMeta.text} ${difficultyMeta.border}`}>
                                {exercise.difficulty} · {difficultyMeta.zh}
                            </span>
                        )}
                        {exercise.mechanic && mechanicMeta && (
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border bg-slate-900 ${mechanicMeta.text} ${mechanicMeta.border}`}>
                                {exercise.mechanic} · {mechanicMeta.zh}
                            </span>
                        )}
                        {exercise.equipment && (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border bg-slate-900 text-slate-300 border-slate-700">
                                {exercise.equipment}
                            </span>
                        )}
                        {exercise.isFavorite && (
                            <Star size={16} className="text-amber-400 fill-amber-400" />
                        )}
                    </div>

                    {/* Muscle info */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                        <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                            <Activity size={16} className="text-emerald-400" />
                            目标肌群 / Target Muscles
                        </h3>
                        <div className="flex items-start gap-2 mb-2">
                            <span className="text-xs font-bold text-emerald-400 whitespace-nowrap mt-0.5">主:</span>
                            <span className="text-sm text-white font-semibold">{exercise.muscleGroup}</span>
                        </div>
                        {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                            <div className="flex items-start gap-2 mb-2">
                                <span className="text-xs font-bold text-slate-500 whitespace-nowrap mt-0.5">辅:</span>
                                <span className="text-sm text-slate-300">{exercise.secondaryMuscles.join(', ')}</span>
                            </div>
                        )}
                        {exercise.muscle_ids && exercise.muscle_ids.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {exercise.muscle_ids.map((id) => (
                                    <span
                                        key={id}
                                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize bg-slate-800 text-slate-400 border border-slate-700"
                                    >
                                        {id.replace(/-/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 动作要领 / Cues */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                        <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                            <Layers size={16} className="text-emerald-400" />
                            动作要领 / Key Cues
                        </h3>
                        <ul className="space-y-2">
                            {cues.map((cue, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300 leading-relaxed">
                                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                                        {idx + 1}
                                    </span>
                                    {cue}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 器械信息 / Equipment */}
                    {exercise.equipment && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                            <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
                                <Wrench size={16} className="text-emerald-400" />
                                器械 / Equipment
                            </h3>
                            <p className="text-sm text-slate-300 capitalize">{exercise.equipment}</p>
                        </div>
                    )}

                    {/* 追踪模式 / Tracking */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-2">
                        <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
                            <BarChart3 size={16} className="text-emerald-400" />
                            记录方式 / Tracking
                        </h3>
                        <p className="text-sm text-slate-300">
                            {exercise.trackingMode === 'duration' ? '计时 (Duration)' : '计次 (Reps)'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom action bar (safe-area aware) */}
            <div className="border-t border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 pt-3 pb-safe">
                <div className="max-w-md mx-auto w-full flex flex-col gap-2">
                    <button
                        onClick={handleAddToWorkout}
                        disabled={isInActiveWorkout}
                        className={`w-full min-h-[48px] py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                            isInActiveWorkout
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-900/30'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                    >
                        <Play size={18} strokeWidth={2.5} />
                        {isInActiveWorkout ? '已在当前训练中 / In Workout' : '加入当前训练 / Add to Workout'}
                    </button>
                    <div className="flex gap-2">
                        {primaryRoutine && (
                            <button
                                onClick={handleQuickAddToRoutine}
                                className="flex-1 min-h-[48px] py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all active:scale-95"
                                style={{ touchAction: 'manipulation' }}
                                title={primaryRoutine.name}
                            >
                                <BookmarkPlus size={18} />
                                <span className="truncate">加入「{primaryRoutine.name}」</span>
                            </button>
                        )}
                        <button
                            onClick={handleChooseRoutine}
                            className={`${primaryRoutine ? 'flex-1' : 'w-full'} min-h-[48px] py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all active:scale-95`}
                            style={{ touchAction: 'manipulation' }}
                        >
                            <BookmarkPlus size={18} />
                            {primaryRoutine ? '选择 Routine' : '加入 Routine / Add to Routine'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Portal-based render — escapes parent stacking/overflow contexts (iOS modal requirement)
    return createPortal(modal, document.body);
};

export default ExerciseDetailModal;
