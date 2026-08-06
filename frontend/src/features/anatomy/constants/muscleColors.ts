import { MuscleGroup } from '@/shared/types';

/**
 * Unified Muscle Color System - Version 3.0 (Hierarchical Bento)
 *
 * Design Principles:
 * - High contrast ratios (≥4.5:1 WCAG AA compliance)
 * - Color-blind friendly palette
 * - Functional grouping by movement patterns
 * - Consistent saturation (70-90%) and luminance distribution
 * - **NEW**: Global color mapping for SVG anatomy + PDF proportion bars
 *
 * Color Groups:
 * - Push Chain (Upper): Warm colors (Red-Orange-Yellow spectrum)
 * - Pull Chain (Upper): Cool colors (Cyan-Blue-Purple spectrum)
 * - Core Stability: Green spectrum (different luminance)
 * - Lower Body: Blue spectrum (different saturation/luminance)
 * - Auxiliary: Unique hues for distinction
 */

/**
 * MUSCLE_THEME - Global Color Mapping Table
 * This is the single source of truth for all muscle colors across:
 * - SVG anatomy diagrams (fill attribute)
 * - PDF proportion bars (doc.setFillColor)
 * - UI components (background colors)
 */
export const MUSCLE_THEME: Record<MuscleGroup, {
    hex: string;
    rgb: [number, number, number];
    hsl: [number, number, number];
}> = {
    // === PUSH CHAIN (UPPER BODY) - Warm Spectrum ===
    [MuscleGroup.CHEST]: {
        hex: '#ff6b6b',
        rgb: [255, 107, 107],
        hsl: [0, 85, 70]
    },
    [MuscleGroup.SHOULDERS]: {
        hex: '#ffa726',
        rgb: [255, 167, 38],
        hsl: [35, 85, 65]
    },
    [MuscleGroup.TRICEPS]: {
        hex: '#ffeb3b',
        rgb: [255, 235, 59],
        hsl: [54, 90, 62]
    },

    // === PULL CHAIN (UPPER BODY) - Cool Spectrum ===
    [MuscleGroup.LATS]: {
        hex: '#26c6da',
        rgb: [38, 198, 218],
        hsl: [186, 80, 51]
    },
    [MuscleGroup.TRAPS]: {
        hex: '#5c6bc0',
        rgb: [92, 107, 192],
        hsl: [231, 52, 56]
    },
    [MuscleGroup.BICEPS]: {
        hex: '#ab47bc',
        rgb: [171, 71, 188],
        hsl: [294, 54, 51]
    },

    // === CORE STABILITY - Green Spectrum ===
    [MuscleGroup.ABS]: {
        hex: '#66bb6a',
        rgb: [102, 187, 106],
        hsl: [123, 39, 58]
    },
    [MuscleGroup.OBLIQUES]: {
        hex: '#9ccc65',
        rgb: [156, 204, 101],
        hsl: [88, 47, 60]
    },
    [MuscleGroup.LOWER_BACK]: {
        hex: '#2e7d32',
        rgb: [46, 125, 50],
        hsl: [123, 63, 34]
    },

    // === LOWER BODY - Blue Spectrum ===
    [MuscleGroup.QUADS]: {
        hex: '#42a5f5',
        rgb: [66, 165, 245],
        hsl: [207, 89, 61]
    },
    [MuscleGroup.HAMSTRINGS]: {
        hex: '#1976d2',
        rgb: [25, 118, 210],
        hsl: [210, 83, 47]
    },
    [MuscleGroup.GLUTES]: {
        hex: '#303f9f',
        rgb: [48, 63, 159],
        hsl: [231, 54, 40]
    },
    [MuscleGroup.CALVES]: {
        hex: '#7986cb',
        rgb: [121, 134, 203],
        hsl: [231, 48, 63]
    },

    // === AUXILIARY MUSCLES ===
    [MuscleGroup.FOREARMS]: {
        hex: '#ff8a65',
        rgb: [255, 138, 101],
        hsl: [15, 100, 70]
    },
    [MuscleGroup.CARDIO]: {
        hex: '#e91e63',
        rgb: [233, 30, 99],
        hsl: [340, 82, 52]
    }
};

// Legacy exports for backward compatibility
export const MUSCLE_COLORS: Record<MuscleGroup, string> = Object.fromEntries(
    Object.entries(MUSCLE_THEME).map(([key, value]) => [key, value.hex])
) as Record<MuscleGroup, string>;

export const MUSCLE_COLORS_RGB: Record<MuscleGroup, [number, number, number]> = Object.fromEntries(
    Object.entries(MUSCLE_THEME).map(([key, value]) => [key, value.rgb])
) as Record<MuscleGroup, [number, number, number]>;

// HSL values for advanced color manipulation (legacy export)
export const MUSCLE_COLORS_HSL: Record<MuscleGroup, [number, number, number]> = Object.fromEntries(
    Object.entries(MUSCLE_THEME).map(([key, value]) => [key, value.hsl])
) as Record<MuscleGroup, [number, number, number]>;

/**
 * Get muscle color in hex format
 */
export const getMuscleColor = (muscle: MuscleGroup): string => {
    return MUSCLE_THEME[muscle]?.hex || '#94a3b8'; // Default to slate-400 if not found
};

/**
 * Get muscle color in RGB format for PDF/Canvas rendering
 * This is the PRIMARY method for color synchronization across SVG and PDF
 */
export const getMuscleColorRGB = (muscle: MuscleGroup): [number, number, number] => {
    return MUSCLE_THEME[muscle]?.rgb || [148, 163, 184]; // Default to slate-400 RGB
};

/**
 * Get muscle color in HSL format for color manipulation
 */
export const getMuscleColorHSL = (muscle: MuscleGroup): [number, number, number] => {
    return MUSCLE_THEME[muscle]?.hsl || [215, 16, 65]; // Default to slate-400 HSL
};

/**
 * Get muscle color as rgba() string for SVG fill attribute
 * @param muscle - The muscle group
 * @param opacity - Opacity value (0-1)
 */
export const getMuscleColorRGBA = (muscle: MuscleGroup, opacity: number = 1): string => {
    const rgb = getMuscleColorRGB(muscle);
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
};

/**
 * Validate color contrast ratio (WCAG AA compliance)
 * Returns true if contrast ratio is ≥ 4.5:1
 */
export const validateColorContrast = (color1: string, color2: string): boolean => {
    // Convert hex to RGB
    const hexToRgb = (hex: string): [number, number, number] => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    };

    // Calculate relative luminance
    const getLuminance = (rgb: [number, number, number]): number => {
        const [r, g, b] = rgb.map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    const lum1 = getLuminance(rgb1);
    const lum2 = getLuminance(rgb2);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    const contrast = (brightest + 0.05) / (darkest + 0.05);

    return contrast >= 4.5; // WCAG AA standard
};

/**
 * Get contrasting text color (white or black) for a given background color
 */
export const getContrastingTextColor = (backgroundColor: string): string => {
    const hexToRgb = (hex: string): [number, number, number] => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    };

    const [r, g, b] = hexToRgb(backgroundColor);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Legacy color array for backward compatibility
 */
export const LEGACY_COLORS = [
    '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'
];

/**
 * Color accessibility report for all muscle groups
 */
export const generateColorAccessibilityReport = (): Record<string, any> => {
    const report: Record<string, any> = {};
    const muscles = Object.keys(MUSCLE_COLORS) as MuscleGroup[];

    // Test all muscle color combinations
    for (let i = 0; i < muscles.length; i++) {
        for (let j = i + 1; j < muscles.length; j++) {
            const muscle1 = muscles[i];
            const muscle2 = muscles[j];
            const color1 = MUSCLE_COLORS[muscle1];
            const color2 = MUSCLE_COLORS[muscle2];
            const contrast = validateColorContrast(color1, color2);

            const key = `${muscle1}_vs_${muscle2}`;
            report[key] = {
                muscle1,
                muscle2,
                color1,
                color2,
                hasGoodContrast: contrast,
                contrastRatio: calculateContrastRatio(color1, color2)
            };
        }
    }

    return report;
};

/**
 * Calculate exact contrast ratio between two colors
 */
const calculateContrastRatio = (color1: string, color2: string): number => {
    const hexToRgb = (hex: string): [number, number, number] => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    };

    const getLuminance = (rgb: [number, number, number]): number => {
        const [r, g, b] = rgb.map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    const lum1 = getLuminance(rgb1);
    const lum2 = getLuminance(rgb2);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
};