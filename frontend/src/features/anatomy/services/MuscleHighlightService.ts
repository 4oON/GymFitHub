import type { WorkoutSession, MuscleDistributionData } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';
import { MUSCLE_THEME, getMuscleColorRGB, getMuscleColorRGBA } from '../constants/muscleColors';
import { MUSCLE_PATHS, MUSCLE_VIEW_MAPPING } from '../constants/musclePaths';

// Re-export for backward compatibility
export { MUSCLE_PATHS, MUSCLE_VIEW_MAPPING } from '../constants/musclePaths';

/**
 * Muscle Highlight Service - Version 3.0 (Hierarchical Bento)
 *
 * Maps workout data to muscle highlighting for PDF reports
 * Supports both daily and weekly muscle highlighting
 * Now uses consolidated muscle paths from constants/musclePaths.ts
 *
 * **NEW in v3.0**: Global color synchronization via MUSCLE_THEME
 * - All colors sourced from single MUSCLE_THEME mapping
 * - Ensures SVG anatomy and PDF proportion bars use identical colors
 * - Supports rgba() format for SVG fill attributes
 */

// Enhanced muscle group mapping for front and back views with MuscleGroup enum integration
export const MUSCLE_VIEW_MAPPING_ENHANCED = {
    front: {
        [MuscleGroup.CHEST]: 'chest',
        [MuscleGroup.BICEPS]: 'biceps',
        [MuscleGroup.FOREARMS]: 'forearms',
        [MuscleGroup.QUADS]: 'quads',
        [MuscleGroup.OBLIQUES]: 'obliques',
        [MuscleGroup.ABS]: 'abs',
        [MuscleGroup.SHOULDERS]: 'shoulders',
        [MuscleGroup.TRAPS]: 'traps_front',      // 正面斜方肌
        [MuscleGroup.CALVES]: 'calves_front',    // 正面小腿
        [MuscleGroup.CARDIO]: 'cardio'
    },
    back: {
        [MuscleGroup.TRAPS]: 'traps',
        [MuscleGroup.SHOULDERS]: 'back_shoulders',
        [MuscleGroup.TRICEPS]: 'back_triceps',
        [MuscleGroup.FOREARMS]: 'back_forearms',
        [MuscleGroup.LATS]: 'lats',
        [MuscleGroup.LOWER_BACK]: 'lower_back',
        [MuscleGroup.GLUTES]: 'glutes',
        [MuscleGroup.HAMSTRINGS]: 'hamstrings',
        [MuscleGroup.CALVES]: 'calves',
        [MuscleGroup.OBLIQUES]: 'obliques_back'  // 背面腹斜肌
    }
};

/**
 * Interface for muscle highlight data
 */
export interface MuscleHighlightData {
    muscle: MuscleGroup;
    color: [number, number, number];
    opacity: number;
    gradient?: {
        from: string;
        to: string;
    };
}

/**
 * Generate muscle highlight data from workout sessions
 */
export const generateMuscleHighlights = (
    sessions: WorkoutSession[],
    type: 'daily' | 'weekly' = 'daily'
): MuscleHighlightData[] => {
    // Calculate muscle distribution similar to donut chart
    const distribution = new Map<MuscleGroup, { weight: number; sets: number }>();

    sessions.forEach(session => {
        session.exercises.forEach(ex => {
            const completedSets = ex.sets.filter(s => s.completed);
            if (completedSets.length === 0) return;

            const exerciseVolume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);

            if (!distribution.has(ex.muscleGroup)) {
                distribution.set(ex.muscleGroup, { weight: 0, sets: 0 });
            }

            const data = distribution.get(ex.muscleGroup)!;
            data.weight += exerciseVolume;
            data.sets += completedSets.length;
        });
    });

    const totalWeight = Array.from(distribution.values()).reduce((sum, d) => sum + d.weight, 0);

    // Generate highlight data
    const highlights: MuscleHighlightData[] = [];

    distribution.forEach((data, muscle) => {
        const percentage = (data.weight / totalWeight) * 100;

        // CRITICAL: Use MUSCLE_THEME for global color synchronization
        const color = MUSCLE_THEME[muscle]?.rgb || [148, 163, 184];

        // Calculate opacity based on training intensity
        let opacity = 0.3; // Base opacity
        if (percentage > 20) opacity = 0.8;
        else if (percentage > 15) opacity = 0.7;
        else if (percentage > 10) opacity = 0.6;
        else if (percentage > 5) opacity = 0.5;
        else opacity = 0.4;

        // Create gradient for enhanced visual effect
        const rgbColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        const lighterColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.3)`;

        highlights.push({
            muscle,
            color,
            opacity,
            gradient: {
                from: rgbColor,
                to: lighterColor
            }
        });
    });

    return highlights.sort((a, b) => b.opacity - a.opacity); // Sort by intensity
};

/**
 * Generate CSS variables for muscle highlighting
 */
export const generateMuscleCSS = (highlights: MuscleHighlightData[]): string => {
    const cssVars: string[] = [];

    // Reset all muscle colors to transparent
    Object.values(MuscleGroup).forEach(muscle => {
        const varName = `--muscle-${muscle.toLowerCase().replace(/_/g, '-')}-color`;
        cssVars.push(`${varName}: transparent`);
        cssVars.push(`${varName}-opacity: 0`);
    });

    // Set colors for trained muscles
    highlights.forEach(({ muscle, color, opacity, gradient }) => {
        const varName = `--muscle-${muscle.toLowerCase().replace(/_/g, '-')}-color`;
        const rgbColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

        cssVars.push(`${varName}: ${rgbColor}`);
        cssVars.push(`${varName}-opacity: ${opacity}`);

        if (gradient) {
            cssVars.push(`${varName}-gradient: linear-gradient(135deg, ${gradient.from}, ${gradient.to})`);
        }
    });

    return cssVars.join(';\n  ');
};

/**
 * Generate SVG muscle paths with highlighting
 */
export const generateMusclePathsSVG = (
    view: 'front' | 'back',
    highlights: MuscleHighlightData[]
): string => {
    const highlightMap = new Map(highlights.map(h => [h.muscle, h]));
    const viewMapping = MUSCLE_VIEW_MAPPING_ENHANCED[view];

    let svgPaths = '';

    Object.entries(viewMapping).forEach(([muscleGroup, pathKey]) => {
        const muscle = muscleGroup as MuscleGroup;
        const highlight = highlightMap.get(muscle);
        const path = MUSCLE_PATHS[pathKey as keyof typeof MUSCLE_PATHS];

        if (path && highlight) {
            const { color, opacity, gradient } = highlight;
            const fill = gradient ? `url(#gradient-${muscle})` : `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;

            svgPaths += `
                <path
                    d="${path}"
                    fill="${fill}"
                    stroke="rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)"
                    stroke-width="1"
                    class="muscle-highlight muscle-${muscle.toLowerCase().replace(/_/g, '-')}"
                />`;
        }
    });

    return svgPaths;
};

/**
 * Generate SVG gradients for muscle highlighting
 */
export const generateMuscleGradients = (highlights: MuscleHighlightData[]): string => {
    let gradients = '';

    highlights.forEach(({ muscle, gradient }) => {
        if (gradient) {
            gradients += `
                <linearGradient id="gradient-${muscle}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${gradient.from};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${gradient.to};stop-opacity:1" />
                </linearGradient>`;
        }
    });

    return gradients;
};

/**
 * Get muscle distribution data (same as donut chart)
 */
export const getMuscleDistributionData = (sessions: WorkoutSession[]): MuscleDistributionData[] => {
    const distribution = new Map<MuscleGroup, { weight: number; sets: number; exercises: Set<string> }>();

    sessions.forEach(session => {
        session.exercises.forEach(ex => {
            const completedSets = ex.sets.filter(s => s.completed);
            if (completedSets.length === 0) return;

            const exerciseVolume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);

            if (!distribution.has(ex.muscleGroup)) {
                distribution.set(ex.muscleGroup, {
                    weight: 0,
                    sets: 0,
                    exercises: new Set()
                });
            }

            const data = distribution.get(ex.muscleGroup)!;
            data.weight += exerciseVolume;
            data.sets += completedSets.length;
            data.exercises.add(ex.exerciseName);
        });
    });

    const totalWeight = Array.from(distribution.values()).reduce((sum, d) => sum + d.weight, 0);

    const result: MuscleDistributionData[] = Array.from(distribution.entries()).map(([muscle, data]) => ({
        muscle,
        totalWeight: data.weight,
        percentage: (data.weight / totalWeight) * 100,
        sets: data.sets,
        exercises: Array.from(data.exercises)
    }));

    return result.sort((a, b) => b.totalWeight - a.totalWeight);
};