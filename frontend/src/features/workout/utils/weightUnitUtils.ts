/**
 * Weight Unit Utilities
 *
 * All workout data is stored in kilograms (metric).
 * Users with imperial dumbbells can input pounds (lb) in the UI;
 * values are converted to kg on save and shown as small kg hints.
 */

export type WeightUnit = 'kg' | 'lb';

/** 1 lb = 0.45359237 kg (exact international definition) */
export const LB_TO_KG = 0.45359237;
export const KG_TO_LB = 1 / LB_TO_KG;

/**
 * Imperial dumbbell plate increments:
 * 5, 7.5, then +2.5 up to 10, then +5 up to 50, max 52.5 lb.
 */
export const LB_PRESETS: number[] = [
    5, 7.5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 52.5,
];

/**
 * Generic imperial steps for non-dumbbell equipment (barbell, machines,
 * cables): 5 lb increments up to 100 lb, then 10 lb increments up to 300 lb.
 * Covers the user's dumbbell set plus standard imperial barbell work for
 * future production users.
 */
export const LB_GENERIC: number[] = (() => {
    const vals: number[] = [];
    for (let v = 5; v <= 100; v += 5) vals.push(v);
    for (let v = 110; v <= 300; v += 10) vals.push(v);
    return vals;
})();

export const round2 = (n: number): number => Math.round(n * 100) / 100;
export const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Convert a pound value to stored kilograms */
export const lbToKg = (lb: number): number => round2(lb * LB_TO_KG);

/** Convert stored kilograms to pounds */
export const kgToLb = (kg: number): number => round2(kg * KG_TO_LB);

/**
 * Snap an arbitrary lb value to the nearest available dumbbell preset.
 * Returns the lb value of the closest preset.
 */
export function snapLbToPreset(lb: number): number {
    if (!Number.isFinite(lb) || lb <= 0) return LB_PRESETS[0];
    let best = LB_PRESETS[0];
    for (const p of LB_PRESETS) {
        if (Math.abs(p - lb) < Math.abs(best - lb)) best = p;
    }
    return best;
}

/** Display value for the weight input when a unit is active (kg stored internally). */
export function displayWeight(kg: number, unit: WeightUnit): number {
    if (!kg || kg <= 0) return 0;
    return unit === 'lb' ? round1(kgToLb(kg)) : kg;
}

/** Format a kg weight for the small "actual weight" hint. */
export function formatKgHint(kg: number): string {
    return `${round2(kg)} kg`;
}
