import React, { useState, useCallback, useMemo } from 'react';
import { MuscleGroup } from '@/shared/types';
import type { WorkoutSession } from '@/shared/types';
import { BODY_PATHS, MUSCLE_PATHS, MUSCLE_GROUP_MAPPING } from '@/features/anatomy/constants/musclePaths';
import { generateMuscleHighlights, type MuscleHighlightData } from '@/features/anatomy/services/MuscleHighlightService';
import { Heart } from 'lucide-react';

interface MuscleAnatomyViewerProps {
    /** Callback when a muscle group is selected */
    onMuscleSelect: (muscle: MuscleGroup) => void;
    /** Current body orientation */
    bodyFacing: 'front' | 'back';
    /** Callback when body orientation changes */
    onBodyFacingChange: (facing: 'front' | 'back') => void;
    /** Array of currently selected muscle groups */
    selectedMuscles?: MuscleGroup[];
    /** Array of muscle groups that have exercises in active workout */
    activeMuscles?: MuscleGroup[];
    /** Whether to show the cardio button */
    showCardioButton?: boolean;
    /** Custom class name for the container */
    className?: string;
    /** Custom styles for selected muscles */
    selectedMuscleStyle?: {
        fill?: string;
        fillOpacity?: number;
        stroke?: string;
        strokeWidth?: string;
    };
    /** Custom styles for hovered muscles */
    hoveredMuscleStyle?: {
        fill?: string;
        fillOpacity?: number;
        stroke?: string;
        strokeWidth?: string;
    };
    /** Whether to show muscle labels on hover */
    showLabels?: boolean;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Workout sessions for dynamic highlighting */
    workoutSessions?: WorkoutSession[];
    /** Enable dynamic muscle highlighting based on workout data */
    enableDynamicHighlighting?: boolean;
    /** Highlighting mode */
    highlightMode?: 'selection' | 'workout' | 'both';
    /** Intensity calculation mode */
    intensityMode?: 'volume' | 'frequency' | 'recent';
}

// Mapping visual muscle IDs to MuscleGroup enum - Updated to use consolidated mapping
const VISUAL_MUSCLE_MAP: Record<string, MuscleGroup> = {
    chest: MuscleGroup.CHEST,
    biceps: MuscleGroup.BICEPS,
    triceps: MuscleGroup.TRICEPS,
    forearms: MuscleGroup.FOREARMS,
    shoulders: MuscleGroup.SHOULDERS,
    abs: MuscleGroup.ABS,
    obliques: MuscleGroup.OBLIQUES,
    quads: MuscleGroup.QUADS,
    traps_front: MuscleGroup.TRAPS, // New: Front view trapezius
    calves_front: MuscleGroup.CALVES, // New: Front view calves
    // Back muscles
    traps: MuscleGroup.TRAPS,
    obliques_back: MuscleGroup.OBLIQUES, // New: Back view obliques
    back_shoulders: MuscleGroup.SHOULDERS,
    back_triceps: MuscleGroup.TRICEPS,
    back_forearms: MuscleGroup.FOREARMS,
    lats: MuscleGroup.LATS,
    lower_back: MuscleGroup.LOWER_BACK,
    glutes: MuscleGroup.GLUTES,
    hamstrings: MuscleGroup.HAMSTRINGS,
    calves: MuscleGroup.CALVES,
    cardio: MuscleGroup.CARDIO
};

/**
 * Standalone muscle anatomy visualization component
 * Displays interactive SVG of human body with clickable muscle regions
 */
const MuscleAnatomyViewer: React.FC<MuscleAnatomyViewerProps> = ({
    onMuscleSelect,
    bodyFacing,
    onBodyFacingChange,
    selectedMuscles = [],
    activeMuscles = [],
    showCardioButton = true,
    className = '',
    selectedMuscleStyle,
    hoveredMuscleStyle,
    showLabels = false,
    size = 'md',
    workoutSessions = [],
    enableDynamicHighlighting = false,
    highlightMode = 'selection',
    intensityMode = 'volume',
}) => {
    const [hoveredMuscleId, setHoveredMuscleId] = useState<string | null>(null);

    // Generate muscle highlights from workout data
    const muscleHighlights = useMemo(() => {
        if (!enableDynamicHighlighting || workoutSessions.length === 0) {
            return [];
        }
        return generateMuscleHighlights(workoutSessions, intensityMode === 'recent' ? 'daily' : 'weekly');
    }, [workoutSessions, enableDynamicHighlighting, intensityMode]);

    // Create highlight map for quick lookup
    const highlightMap = useMemo(() => {
        return new Map(muscleHighlights.map(h => [h.muscle, h]));
    }, [muscleHighlights]);

    // Memoized muscle click handler
    const handleMuscleClick = useCallback((muscleId: string) => {
        const muscleGroup = VISUAL_MUSCLE_MAP[muscleId];
        if (muscleGroup) {
            onMuscleSelect(muscleGroup);
        }
    }, [onMuscleSelect]);

    // Memoized muscle hover handlers
    const handleMuscleEnter = useCallback((muscleId: string) => {
        setHoveredMuscleId(muscleId);
    }, []);

    const handleMuscleLeave = useCallback(() => {
        setHoveredMuscleId(null);
    }, []);

    // Default styles - Deep dark silhouette matching background
    const defaultSelectedStyle = {
        fill: '#10b981', // Emerald 500 - Bright green for selected
        fillOpacity: 0.75, // Slightly more opaque for better contrast
        stroke: '#34d399', // Emerald 400 - Bright green border
        strokeWidth: '2.5'
    };

    const defaultActiveStyle = {
        fill: '#3b82f6', // Blue 500 - Blue for active workout muscles
        fillOpacity: 0.6,
        stroke: '#60a5fa', // Blue 400 - Blue border
        strokeWidth: '2'
    };

    const defaultHoveredStyle = {
        fill: '#8b5cf6', // Violet 500 - Purple for hover
        fillOpacity: 0.5, // Increased from 0.4 for better visibility
        stroke: '#a78bfa', // Violet 400 - Purple border
        strokeWidth: '2'
    };

    const defaultStyle = {
        fill: '#020617', // Slate 950 - Very dark, close to background
        fillOpacity: 0.95, // Nearly opaque to avoid gray wash
        stroke: '#1f2937', // Gray 800 - Subtle outline for muscle separation
        strokeWidth: '1'
    };

    // Memoized style calculator with dynamic highlighting support
    const getMuscleStyle = useCallback((muscleId: string) => {
        const group = VISUAL_MUSCLE_MAP[muscleId];
        const isSelected = selectedMuscles?.includes(group);
        const isActive = activeMuscles?.includes(group);
        const isHovered = hoveredMuscleId === muscleId;
        const highlight = highlightMap.get(group);

        // Priority: Active > Selected > Hover > Workout Highlight > Default
        // Active muscles (in current workout) always show, regardless of highlightMode
        if (isActive) {
            return defaultActiveStyle;
        }

        if (isSelected && (highlightMode === 'selection' || highlightMode === 'both')) {
            return { ...defaultSelectedStyle, ...selectedMuscleStyle };
        }

        if (isHovered) {
            return { ...defaultHoveredStyle, ...hoveredMuscleStyle };
        }

        // Apply workout-based highlighting
        if (highlight && enableDynamicHighlighting && (highlightMode === 'workout' || highlightMode === 'both')) {
            const { color, opacity } = highlight;
            return {
                fill: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`,
                fillOpacity: 1,
                stroke: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`,
                strokeWidth: '1.5'
            };
        }

        return defaultStyle;
    }, [selectedMuscles, activeMuscles, hoveredMuscleId, selectedMuscleStyle, hoveredMuscleStyle, highlightMap, enableDynamicHighlighting, highlightMode]);

    // Size configurations
    const sizeConfig = useMemo(() => {
        switch (size) {
            case 'sm':
                return {
                    containerClass: 'h-64',
                    viewBox: '-30 0 400 900',
                    buttonSize: 16,
                    buttonClass: 'px-3 py-2 text-xs'
                };
            case 'lg':
                return {
                    containerClass: 'h-[700px]',
                    viewBox: '-30 0 400 900',
                    buttonSize: 20,
                    buttonClass: 'px-5 py-3 text-sm'
                };
            default: // md
                return {
                    containerClass: 'h-[500px]',
                    viewBox: '-30 0 400 700',
                    buttonSize: 18,
                    buttonClass: 'px-4 py-3 text-xs'
                };
        }
    }, [size]);

    // Get muscle name for labels
    const getMuscleLabel = useCallback((muscleId: string) => {
        const group = VISUAL_MUSCLE_MAP[muscleId];
        return group || muscleId;
    }, []);

    const paths = bodyFacing === 'front' ? BODY_PATHS.front : BODY_PATHS.back;

    return (
        <div className={`flex-1 relative flex flex-col items-center justify-start pt-4 pb-20 ${className}`}>
            {/* Body Orientation Toggle */}
            <div className="flex bg-slate-900/80 backdrop-blur-md p-1 rounded-full border border-slate-800 mb-2 z-20 shadow-lg">
                <button
                    onClick={() => onBodyFacingChange('front')}
                    className={`${sizeConfig.buttonClass} rounded-full font-bold tracking-wide transition-colors ${bodyFacing === 'front'
                        ? 'bg-emerald-500 text-white'
                        : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    Anterior
                </button>
                <button
                    onClick={() => onBodyFacingChange('back')}
                    className={`${sizeConfig.buttonClass} rounded-full font-bold tracking-wide transition-colors ${bodyFacing === 'back'
                        ? 'bg-emerald-500 text-white'
                        : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    Posterior
                </button>
            </div>

            {/* Active Workout Indicator */}
            {activeMuscles.length > 0 && (
                <div className="mb-2 px-3 py-1 bg-blue-900/50 border border-blue-700/50 rounded-full text-xs text-blue-300 z-20">
                    训练中: {activeMuscles.length} 个肌群
                </div>
            )}

            {/* Dynamic Highlighting Indicator */}
            {enableDynamicHighlighting && muscleHighlights.length > 0 && (
                <div className="mb-2 px-3 py-1 bg-purple-900/50 border border-purple-700/50 rounded-full text-xs text-purple-300 z-20">
                    Workout Intensity: {muscleHighlights.length} muscles trained
                </div>
            )}

            {/* Muscle Label Tooltip */}
            {showLabels && hoveredMuscleId && (
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium z-30 pointer-events-none">
                    {getMuscleLabel(hoveredMuscleId)}
                </div>
            )}

            {/* SVG Body Illustration */}
            <div className={`relative w-full ${sizeConfig.containerClass} flex items-center justify-center overflow-hidden`}>
                <svg
                    viewBox={sizeConfig.viewBox}
                    className="h-full w-auto mx-auto"
                    style={{ filter: 'drop-shadow(0 0 25px rgba(0,0,0,0.6))', maxWidth: '100%' }}
                >
                    {/* Base Silhouette - Original */}
                    <path
                        d={paths.baseSilhouette}
                        fill="#1e293b"
                        stroke="#334155"
                        strokeWidth="1.5"
                    />

                    {/* Detail Layer - Additional outline details (front view only) */}
                    {bodyFacing === 'front' && BODY_PATHS.front.detail1 && (
                        <path
                            d={BODY_PATHS.front.detail1}
                            fill="#020617"
                            fillOpacity="0.95"
                            stroke="#1f2937"
                            strokeWidth="1"
                        />
                    )}

                    {/* Muscle Groups - Front view */}
                    {bodyFacing === 'front' && (
                        <>
                            {/* Chest */}
                            <path
                                d={MUSCLE_PATHS.chest}
                                onClick={() => handleMuscleClick('chest')}
                                onMouseEnter={() => handleMuscleEnter('chest')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('chest')}
                            />

                            {/* Biceps */}
                            <path
                                d={MUSCLE_PATHS.biceps}
                                onClick={() => handleMuscleClick('biceps')}
                                onMouseEnter={() => handleMuscleEnter('biceps')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('biceps')}
                            />

                            {/* Forearms */}
                            <path
                                d={MUSCLE_PATHS.forearms}
                                onClick={() => handleMuscleClick('forearms')}
                                onMouseEnter={() => handleMuscleEnter('forearms')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('forearms')}
                            />

                            {/* Shoulders */}
                            <path
                                d={MUSCLE_PATHS.shoulders}
                                onClick={() => handleMuscleClick('shoulders')}
                                onMouseEnter={() => handleMuscleEnter('shoulders')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('shoulders')}
                            />

                            {/* Abs */}
                            <path
                                d={MUSCLE_PATHS.abs}
                                onClick={() => handleMuscleClick('abs')}
                                onMouseEnter={() => handleMuscleEnter('abs')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('abs')}
                            />

                            {/* Obliques */}
                            <path
                                d={MUSCLE_PATHS.obliques}
                                onClick={() => handleMuscleClick('obliques')}
                                onMouseEnter={() => handleMuscleEnter('obliques')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('obliques')}
                            />

                            {/* Quads */}
                            <path
                                d={MUSCLE_PATHS.quads}
                                onClick={() => handleMuscleClick('quads')}
                                onMouseEnter={() => handleMuscleEnter('quads')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('quads')}
                            />

                            {/* Trapezius (Front) - New */}
                            <path
                                d={MUSCLE_PATHS.traps_front}
                                onClick={() => handleMuscleClick('traps_front')}
                                onMouseEnter={() => handleMuscleEnter('traps_front')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('traps_front')}
                            />

                            {/* Calves (Front) - New */}
                            <path
                                d={MUSCLE_PATHS.calves_front}
                                onClick={() => handleMuscleClick('calves_front')}
                                onMouseEnter={() => handleMuscleEnter('calves_front')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('calves_front')}
                            />
                        </>
                    )}

                    {/* Muscle Groups - Back view */}
                    {bodyFacing === 'back' && (
                        <>
                            {/* Traps */}
                            <path
                                d={MUSCLE_PATHS.traps}
                                onClick={() => handleMuscleClick('traps')}
                                onMouseEnter={() => handleMuscleEnter('traps')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('traps')}
                            />

                            {/* Lats */}
                            <path
                                d={MUSCLE_PATHS.lats}
                                onClick={() => handleMuscleClick('lats')}
                                onMouseEnter={() => handleMuscleEnter('lats')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('lats')}
                            />

                            {/* Glutes */}
                            <path
                                d={MUSCLE_PATHS.glutes}
                                onClick={() => handleMuscleClick('glutes')}
                                onMouseEnter={() => handleMuscleEnter('glutes')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('glutes')}
                            />

                            {/* Hamstrings */}
                            <path
                                d={MUSCLE_PATHS.hamstrings}
                                onClick={() => handleMuscleClick('hamstrings')}
                                onMouseEnter={() => handleMuscleEnter('hamstrings')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('hamstrings')}
                            />

                            {/* Calves */}
                            <path
                                d={MUSCLE_PATHS.calves}
                                onClick={() => handleMuscleClick('calves')}
                                onMouseEnter={() => handleMuscleEnter('calves')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('calves')}
                            />

                            {/* Lower Back */}
                            <path
                                d={MUSCLE_PATHS.lower_back}
                                onClick={() => handleMuscleClick('lower_back')}
                                onMouseEnter={() => handleMuscleEnter('lower_back')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('lower_back')}
                            />

                            {/* Shoulders (Back) */}
                            <path
                                d={MUSCLE_PATHS.back_shoulders}
                                onClick={() => handleMuscleClick('back_shoulders')}
                                onMouseEnter={() => handleMuscleEnter('back_shoulders')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('back_shoulders')}
                            />

                            {/* Triceps (Back) */}
                            <path
                                d={MUSCLE_PATHS.back_triceps}
                                onClick={() => handleMuscleClick('back_triceps')}
                                onMouseEnter={() => handleMuscleEnter('back_triceps')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('back_triceps')}
                            />

                            {/* Forearms (Back) */}
                            <path
                                d={MUSCLE_PATHS.back_forearms}
                                onClick={() => handleMuscleClick('back_forearms')}
                                onMouseEnter={() => handleMuscleEnter('back_forearms')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('back_forearms')}
                            />

                            {/* Obliques (Back) - New */}
                            <path
                                d={MUSCLE_PATHS.obliques_back}
                                onClick={() => handleMuscleClick('obliques_back')}
                                onMouseEnter={() => handleMuscleEnter('obliques_back')}
                                onMouseLeave={handleMuscleLeave}
                                className="cursor-pointer transition-all duration-200"
                                {...getMuscleStyle('obliques_back')}
                            />
                        </>
                    )}
                </svg>
            </div>

            {/* Cardio Button — safe-area aware: stays visible above the iOS bottom nav / home indicator */}
            {showCardioButton && (
                <button
                    onClick={() => onMuscleSelect(MuscleGroup.CARDIO)}
                    className={`absolute right-6 flex items-center gap-2 bg-slate-900/90 border border-slate-800 text-rose-500 ${sizeConfig.buttonClass} rounded-xl shadow-lg backdrop-blur-sm hover:bg-slate-800/90 active:scale-95 transition-all`}
                    style={{
                        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
                        touchAction: 'manipulation',
                    }}
                >
                    <Heart size={sizeConfig.buttonSize} fill="currentColor" />
                    <span className="font-bold">CARDIO</span>
                </button>
            )}
        </div>
    );
};

// Export types for external use
export type { MuscleAnatomyViewerProps };
export { VISUAL_MUSCLE_MAP, MUSCLE_PATHS };

/**
 * @example
 * // Basic usage
 * <MuscleAnatomyViewer
 *   onMuscleSelect={(muscle) => console.log('Selected:', muscle)}
 *   bodyFacing="front"
 *   onBodyFacingChange={(facing) => setBodyFacing(facing)}
 *   selectedMuscles={[MuscleGroup.CHEST, MuscleGroup.BICEPS]}
 * />
 *
 * @example
 * // With custom styling and size
 * <MuscleAnatomyViewer
 *   onMuscleSelect={handleMuscleSelect}
 *   bodyFacing={bodyFacing}
 *   onBodyFacingChange={setBodyFacing}
 *   selectedMuscles={selectedMuscles}
 *   size="lg"
 *   showLabels={true}
 *   showCardioButton={false}
 *   className="custom-anatomy-viewer"
 *   selectedMuscleStyle={{
 *     fill: '#ef4444',
 *     fillOpacity: 0.7,
 *     stroke: '#dc2626',
 *     strokeWidth: '3'
 *   }}
 * />
 *
 * @example
 * // With dynamic workout highlighting
 * <MuscleAnatomyViewer
 *   onMuscleSelect={handleMuscleSelect}
 *   bodyFacing={bodyFacing}
 *   onBodyFacingChange={setBodyFacing}
 *   selectedMuscles={selectedMuscles}
 *   workoutSessions={recentWorkouts}
 *   enableDynamicHighlighting={true}
 *   highlightMode="both"
 *   intensityMode="volume"
 *   showLabels={true}
 *   size="lg"
 * />
 *
 * @example
 * // Workout intensity visualization only
 * <MuscleAnatomyViewer
 *   onMuscleSelect={handleMuscleSelect}
 *   bodyFacing={bodyFacing}
 *   onBodyFacingChange={setBodyFacing}
 *   workoutSessions={weeklyWorkouts}
 *   enableDynamicHighlighting={true}
 *   highlightMode="workout"
 *   intensityMode="frequency"
 *   showLabels={true}
 * />
 */
export default MuscleAnatomyViewer;
