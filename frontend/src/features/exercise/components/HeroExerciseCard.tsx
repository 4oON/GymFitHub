import React, { useRef, useState, useCallback, useMemo } from 'react';
import type { Exercise } from '@/shared/types';
import { CheckCircle2, Star, Activity, Plus, Minus, Maximize2 } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

/**
 * 难度等级竖排艺术字配置
 * 黑色粗体实心；Intermediate 去元音缩写为 INTRMEDT
 */
const DIFFICULTY_ART: Record<string, { label: string; glow: string }> = {
    Beginner: { label: 'BEGINNER', glow: 'rgba(52, 211, 153, 0.45)' },
    Intermediate: { label: 'INTRMEDT', glow: 'rgba(251, 191, 36, 0.45)' },
    Advanced: { label: 'ADVANCED', glow: 'rgba(251, 113, 133, 0.45)' },
};

/** Vertical difficulty label — black bold solid, bottom-to-top, right edge of card */
const DifficultyArtLabel: React.FC<{ difficulty: string }> = ({ difficulty }) => {
    const art = DIFFICULTY_ART[difficulty];
    if (!art) return null;
    return (
        <div
            className="absolute right-1 inset-y-0 z-20 flex items-center justify-center pointer-events-none select-none"
            aria-hidden="true"
        >
            <span
                className="font-black uppercase whitespace-nowrap"
                style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    fontSize: '12px',
                    letterSpacing: '0.25em',
                    color: '#000000',
                    textShadow: `0 0 6px ${art.glow}`,
                }}
            >
                {art.label}
            </span>
        </div>
    );
};

interface HeroExerciseCardProps {
    /** Exercise data to display */
    exercise: Exercise;
    /** Whether the exercise is currently selected */
    isSelected: boolean;
    /** Callback when selection state changes */
    onToggle: () => void;
    /** Callback when adding exercise to workout */
    onAddToWorkout?: () => void;
    /** Callback when removing exercise from workout */
    onRemoveFromWorkout?: () => void;
    /** Callback when adding exercise to routine */
    onAddToRoutine?: () => void;
    /** Custom class name for the card */
    className?: string;
    /** Size variant of the card */
    size?: 'sm' | 'md' | 'lg';
    /** Whether to show video player */
    showVideo?: boolean;
    /** Whether to show detailed muscle information */
    showDetailedMuscles?: boolean;
    /** Whether to enable swipe gestures */
    enableSwipe?: boolean;
    /** Custom swipe threshold in pixels */
    swipeThreshold?: number;
    /** Whether to show action buttons */
    showActionButtons?: boolean;
    /** Layout orientation */
    layout?: 'horizontal' | 'vertical';
    /** Custom selection indicator */
    selectionIndicator?: React.ReactNode;
    /** Disable card click to toggle (useful when put inside other clickable containers) */
    disableCardClick?: boolean;
    /** Optional frequency count to display (e.g. "Used 8 times") */
    frequency?: number;
    /** Whether to show the equipment badge */
    showEquipment?: boolean;
    /** Callback when the user taps the expand icon on the video */
    onExpandVideo?: (exercise: Exercise) => void;
}

/**
 * Hero exercise card component
 * Displays exercise with video, metadata, and selection state
 * Highly customizable and reusable across different contexts
 */
const HeroExerciseCard: React.FC<HeroExerciseCardProps> = ({
    exercise,
    isSelected,
    onToggle,
    onAddToWorkout,
    onRemoveFromWorkout,
    onAddToRoutine,
    className = '',
    size = 'md',
    showVideo = true,
    showDetailedMuscles = true,
    enableSwipe = true,
    swipeThreshold = 50,
    showActionButtons = false,
    layout = 'horizontal',
    selectionIndicator,
    disableCardClick = false,
    frequency,
    showEquipment = true,
    onExpandVideo,
}) => {
    const touchStartX = useRef<number>(0);
    const touchEndX = useRef<number>(0);
    const [isAdding, setIsAdding] = useState(false);

    // Memoized muscle IDs for display
    const muscleIds = useMemo(() => exercise.muscle_ids || [], [exercise.muscle_ids]);

    // Memoized styling configurations
    const sizeConfig = useMemo(() => {
        switch (size) {
            case 'sm':
                return {
                    height: 'h-20',
                    textSize: 'text-xs',
                    titleSize: 'text-sm',
                    badgeSize: 'text-[8px]',
                    iconSize: 8,
                    padding: 'pl-3 pr-2'
                };
            case 'lg':
                return {
                    height: 'h-36',
                    textSize: 'text-sm',
                    titleSize: 'text-lg',
                    badgeSize: 'text-[10px]',
                    iconSize: 12,
                    padding: 'pl-6 pr-3'
                };
            default: // md
                return {
                    height: 'h-28',
                    textSize: 'text-xs',
                    titleSize: 'text-base',
                    badgeSize: 'text-[9px]',
                    iconSize: 10,
                    padding: 'pl-5 pr-2'
                };
        }
    }, [size]);

    // Memoized mechanic styling
    const mechanicStyle = useMemo(() => {
        if (exercise.mechanic === 'Compound') {
            return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        } else if (exercise.mechanic === 'Isolation') {
            return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        }
        return 'bg-slate-700/30 text-slate-400 border-slate-700';
    }, [exercise.mechanic]);

    // Memoized equipment styling
    const equipmentStyle = useMemo(() => 'bg-slate-700/30 text-slate-300 border-slate-600', []);

    // Memoized frequency styling
    const frequencyStyle = useMemo(() => 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', []);

    // Memoized click handler with animation
    const handleClick = useCallback(() => {
        if (disableCardClick) return;
        if (isSelected) {
            onRemoveFromWorkout?.();
            onToggle();
        } else {
            // Trigger add animation
            setIsAdding(true);
            setTimeout(() => {
                // 调用 onAddToWorkout 来添加动作
                onAddToWorkout?.();
                setTimeout(() => setIsAdding(false), 300);
            }, 200);
        }
    }, [isSelected, onRemoveFromWorkout, onToggle, onAddToWorkout, disableCardClick]);

    // Memoized swipe handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!enableSwipe) return;
        touchStartX.current = e.touches[0].clientX;
    }, [enableSwipe]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!enableSwipe) return;
        touchEndX.current = e.changedTouches[0].clientX;
        const swipeDistance = touchEndX.current - touchStartX.current;

        if (swipeDistance > swipeThreshold && onAddToRoutine) {
            onAddToRoutine();
        }
    }, [enableSwipe, swipeThreshold, onAddToRoutine]);

    // Memoized action button handlers
    const handleAddToWorkout = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsAdding(true);
        setTimeout(() => {
            onAddToWorkout?.();
            setTimeout(() => setIsAdding(false), 300);
        }, 200);
    }, [onAddToWorkout]);

    const handleRemoveFromWorkout = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onRemoveFromWorkout?.();
    }, [onRemoveFromWorkout]);

    // Memoized expand-video handler (opens fullscreen detail modal)
    const handleExpandVideo = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onExpandVideo?.(exercise);
    }, [onExpandVideo, exercise]);

    // Render horizontal layout (default)
    if (layout === 'horizontal') {
        return (
            <div
                className={`relative flex-shrink-0 w-full ${sizeConfig.height} max-${sizeConfig.height} bg-slate-950 rounded-2xl overflow-hidden border transition-all duration-300 group cursor-pointer ${isSelected
                    ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : isAdding
                        ? 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] scale-[0.98]'
                        : 'border-slate-800 hover:border-slate-600'
                    } ${className}`}
                onClick={handleClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Layout: Split Container */}
                <div className="absolute inset-0 flex">
                    {/* Left: Content (65%) */}
                    <div className={`w-[65%] h-full relative z-10 bg-slate-950 flex flex-col justify-center ${sizeConfig.padding}`}>
                        <div className="relative z-10">
                            {/* Badges row: mechanic + equipment (same level) + favorite */}
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {exercise.mechanic && (
                                    <span
                                        className={`px-1.5 py-0.5 rounded ${sizeConfig.badgeSize} font-bold uppercase tracking-wider border ${mechanicStyle}`}
                                    >
                                        {exercise.mechanic}
                                    </span>
                                )}
                                {showEquipment && exercise.equipment && (
                                    <span
                                        className={`px-1.5 py-0.5 rounded ${sizeConfig.badgeSize} font-bold uppercase tracking-wider border ${equipmentStyle}`}
                                    >
                                        {exercise.equipment}
                                    </span>
                                )}
                                {exercise.isFavorite && (
                                    <Star size={sizeConfig.iconSize} className="text-amber-400 fill-amber-400" />
                                )}
                            </div>

                            {/* Exercise Name + Frequency on one line */}
                            <div className="flex items-center gap-2 mb-1 min-w-0">
                                <h3 className={`font-bold text-white leading-tight truncate ${sizeConfig.titleSize}`}>
                                    {exercise.nameZh || exercise.name}
                                </h3>
                                {typeof frequency === 'number' && frequency > 0 && (
                                    <span
                                        className={`flex-shrink-0 px-1.5 py-0.5 rounded ${sizeConfig.badgeSize} font-bold uppercase tracking-wider border ${frequencyStyle}`}
                                    >
                                        {frequency}×
                                    </span>
                                )}
                            </div>

                            {/* Muscle Information — compact */}
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] leading-tight">
                                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                    <Activity size={sizeConfig.iconSize} /> {exercise.muscleGroup}
                                    {exercise.isPrimaryMuscle === false && (
                                        <span className="ml-1 px-1 py-0.5 text-[6px] font-bold uppercase tracking-wider bg-slate-700/50 text-slate-400 rounded border border-slate-600">
                                            辅助
                                        </span>
                                    )}
                                </span>

                                {/* Detailed Muscle IDs */}
                                {showDetailedMuscles && muscleIds.length > 0 && (
                                    <>
                                        <span className="text-slate-600">•</span>
                                        <span className="text-slate-400 capitalize leading-tight">
                                            {muscleIds.slice(0, 4).map((muscleId, idx) => (
                                                <span key={idx}>
                                                    {muscleId.replace(/-/g, ' ')}
                                                    {idx < Math.min(muscleIds.length, 4) - 1 ? ', ' : ''}
                                                </span>
                                            ))}
                                            {muscleIds.length > 4 && <span>...</span>}
                                        </span>
                                    </>
                                )}

                                {/* Secondary muscles fallback */}
                                {showDetailedMuscles && muscleIds.length === 0 && exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                                    <>
                                        <span className="text-slate-600">•</span>
                                        <span className="text-slate-400">
                                            {exercise.secondaryMuscles.join(', ')}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Video (narrowed to make room for the vertical difficulty label) */}
                    {showVideo && (
                        <div className="w-[42%] h-full relative bg-slate-900">
                            <div className="absolute inset-y-0 left-0 w-[60%] bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent z-10 pointer-events-none" />
                            {exercise.videoUrl && (
                                <VideoPlayer
                                    videoUrl={exercise.videoUrl}
                                />
                            )}
                            {/* Expand video button (iOS: >=44px touch target) */}
                            {onExpandVideo && exercise.videoUrl && (
                                <button
                                    onClick={handleExpandVideo}
                                    className="absolute top-1 right-1 z-20 flex items-center justify-center min-w-[44px] min-h-[44px] text-white/80 hover:text-white active:scale-95 transition-all"
                                    style={{ touchAction: 'manipulation' }}
                                    title="放大视频 / Expand"
                                    aria-label="Expand video"
                                >
                                    <Maximize2 size={14} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Vertical hollow difficulty art label — bottom-to-top, right edge */}
                {exercise.difficulty && <DifficultyArtLabel difficulty={exercise.difficulty} />}

                {/* Action Buttons - Positioned at bottom-right to avoid overlapping with badges */}
                {showActionButtons && (
                    <div className="absolute bottom-2 right-2 z-20 flex gap-1">
                        {!isSelected && onAddToWorkout && (
                            <button
                                onClick={handleAddToWorkout}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2 rounded-full transition-colors shadow-lg"
                                title="Add to Workout"
                                style={{ touchAction: 'manipulation' }}
                            >
                                <Plus size={16} strokeWidth={3} />
                            </button>
                        )}
                        {isSelected && onRemoveFromWorkout && (
                            <button
                                onClick={handleRemoveFromWorkout}
                                className="bg-rose-500 hover:bg-rose-400 text-white p-2 rounded-full transition-colors shadow-lg"
                                title="Remove from Workout"
                                style={{ touchAction: 'manipulation' }}
                            >
                                <Minus size={16} strokeWidth={3} />
                            </button>
                        )}
                    </div>
                )}

                {/* Adding Animation Overlay */}
                {isAdding && (
                    <div className="absolute inset-0 bg-emerald-500/10 z-15 pointer-events-none animate-pulse" />
                )}

                {/* Selection Indicator */}
                <div
                    className={`absolute top-3 right-3 z-20 transition-all duration-300 ${isSelected ? 'scale-100 opacity-100' : isAdding ? 'scale-110 opacity-80' : 'scale-0 opacity-0'
                        }`}
                >
                    {selectionIndicator || (
                        <div className="bg-emerald-500 text-slate-950 p-1 rounded-full shadow-lg">
                            <CheckCircle2 size={14} strokeWidth={3} />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Render vertical layout
    return (
        <div
            className={`relative flex-shrink-0 w-full bg-slate-950 rounded-2xl overflow-hidden border transition-all duration-300 group cursor-pointer ${isSelected
                ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : isAdding
                    ? 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] scale-[0.98]'
                    : 'border-slate-800 hover:border-slate-600'
                } ${className}`}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Video Section */}
            {showVideo && exercise.videoUrl && (
                <div className="w-full h-32 relative bg-slate-900">
                    <VideoPlayer
                        videoUrl={exercise.videoUrl}
                    />
                    {/* Expand video button (iOS: >=44px touch target) */}
                    {onExpandVideo && (
                        <button
                            onClick={handleExpandVideo}
                            className="absolute top-1 right-1 z-20 flex items-center justify-center min-w-[44px] min-h-[44px] text-white/80 hover:text-white active:scale-95 transition-all"
                            style={{ touchAction: 'manipulation' }}
                            title="放大视频 / Expand"
                            aria-label="Expand video"
                        >
                            <Maximize2 size={14} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            )}

            {/* Content Section */}
            <div className={`w-full p-4 ${sizeConfig.padding} pr-8`}>
                {/* Badges row: mechanic + equipment (same level) + favorite */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {exercise.mechanic && (
                        <span
                            className={`px-1.5 py-0.5 rounded ${sizeConfig.badgeSize} font-bold uppercase tracking-wider border ${mechanicStyle}`}
                        >
                            {exercise.mechanic}
                        </span>
                    )}
                    {showEquipment && exercise.equipment && (
                        <span
                            className={`px-1.5 py-0.5 rounded ${sizeConfig.badgeSize} font-bold uppercase tracking-wider border ${equipmentStyle}`}
                        >
                            {exercise.equipment}
                        </span>
                    )}
                    {exercise.isFavorite && (
                        <Star size={sizeConfig.iconSize} className="text-amber-400 fill-amber-400" />
                    )}
                </div>

                {/* Exercise Name + Frequency on one line */}
                <div className="flex items-center gap-2 mb-2 min-w-0">
                    <h3 className={`font-bold text-white leading-tight truncate ${sizeConfig.titleSize}`}>
                        {exercise.nameZh || exercise.name}
                    </h3>
                    {typeof frequency === 'number' && frequency > 0 && (
                        <span
                            className={`flex-shrink-0 px-1.5 py-0.5 rounded ${sizeConfig.badgeSize} font-bold uppercase tracking-wider border ${frequencyStyle}`}
                        >
                            {frequency}×
                        </span>
                    )}
                </div>

                {/* Muscle Information — compact */}
                <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] leading-tight">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <Activity size={sizeConfig.iconSize} /> {exercise.muscleGroup}
                        {exercise.isPrimaryMuscle === false && (
                            <span className="ml-1 px-1 py-0.5 text-[6px] font-bold uppercase tracking-wider bg-slate-700/50 text-slate-400 rounded border border-slate-600">
                                辅助
                            </span>
                        )}
                    </span>

                    {showDetailedMuscles && muscleIds.length > 0 && (
                        <>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400 capitalize leading-tight">
                                {muscleIds.slice(0, 4).map((muscleId, idx) => (
                                    <span key={idx}>
                                        {muscleId.replace(/-/g, ' ')}
                                        {idx < Math.min(muscleIds.length, 4) - 1 ? ', ' : ''}
                                    </span>
                                ))}
                                {muscleIds.length > 4 && <span>...</span>}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Vertical hollow difficulty art label — bottom-to-top, right edge */}
            {exercise.difficulty && <DifficultyArtLabel difficulty={exercise.difficulty} />}

            {/* Action Buttons - Positioned at bottom-right */}
            {showActionButtons && (
                <div className="absolute bottom-2 right-2 z-20 flex gap-1">
                    {!isSelected && onAddToWorkout && (
                        <button
                            onClick={handleAddToWorkout}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2 rounded-full transition-colors shadow-lg"
                            title="Add to Workout"
                            style={{ touchAction: 'manipulation' }}
                        >
                            <Plus size={16} strokeWidth={3} />
                        </button>
                    )}
                    {isSelected && onRemoveFromWorkout && (
                        <button
                            onClick={handleRemoveFromWorkout}
                            className="bg-rose-500 hover:bg-rose-400 text-white p-2 rounded-full transition-colors shadow-lg"
                            title="Remove from Workout"
                            style={{ touchAction: 'manipulation' }}
                        >
                            <Minus size={16} strokeWidth={3} />
                        </button>
                    )}
                </div>
            )}

            {/* Adding Animation Overlay */}
            {isAdding && (
                <div className="absolute inset-0 bg-emerald-500/10 z-15 pointer-events-none animate-pulse" />
            )}

            {/* Selection Indicator */}
            <div
                className={`absolute top-3 right-3 z-20 transition-all duration-300 ${isSelected ? 'scale-100 opacity-100' : isAdding ? 'scale-110 opacity-80' : 'scale-0 opacity-0'
                    }`}
            >
                {selectionIndicator || (
                    <div className="bg-emerald-500 text-slate-950 p-1 rounded-full shadow-lg">
                        <CheckCircle2 size={14} strokeWidth={3} />
                    </div>
                )}
            </div>
        </div>
    );
};

// Export types for external use
export type { HeroExerciseCardProps };

/**
 * @example
 * // Basic usage
 * <HeroExerciseCard
 *   exercise={exercise}
 *   isSelected={false}
 *   onToggle={() => setSelected(!selected)}
 *   onAddToWorkout={() => addToWorkout(exercise)}
 * />
 *
 * @example
 * // With all features enabled
 * <HeroExerciseCard
 *   exercise={exercise}
 *   isSelected={selectedExercises.includes(exercise.id)}
 *   onToggle={() => toggleSelection(exercise.id)}
 *   onAddToWorkout={() => addToWorkout(exercise)}
 *   onRemoveFromWorkout={() => removeFromWorkout(exercise.id)}
 *   onAddToRoutine={() => addToRoutine(exercise)}
 *   size="lg"
 *   showVideo={true}
 *   showDetailedMuscles={true}
 *   enableSwipe={true}
 *   showActionButtons={true}
 *   layout="horizontal"
 *   className="custom-exercise-card"
 * />
 *
 * @example
 * // Vertical layout for grid display
 * <HeroExerciseCard
 *   exercise={exercise}
 *   isSelected={isSelected}
 *   onToggle={onToggle}
 *   layout="vertical"
 *   size="sm"
 *   showActionButtons={true}
 *   enableSwipe={false}
 * />
 */
export default HeroExerciseCard;