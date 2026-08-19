/**
 * Normalize equipment strings so the curated seed list and the comprehensive
 * JSON data share the same vocabulary.
 *
 * Current canonical values:
 *   Barbell, Dumbbell, Machine, Band, Bodyweight, Recovery, Smith, Cable
 */
export function normalizeEquipment(equipment?: string): string {
  if (!equipment) return 'Other';

  const lower = equipment.trim().toLowerCase();

  if (lower.includes('smith')) return 'Smith';
  if (lower === 'cables') return 'Cable';

  return equipment.trim();
}

/**
 * Stable sort order for equipment filter pills.
 */
export const EQUIPMENT_ORDER = [
  'All',
  'Barbell',
  'Dumbbell',
  'Machine',
  'Cable',
  'Smith',
  'Bodyweight',
  'Band',
  'Recovery',
  'Other'
];

export function sortEquipment(equipment: string[]): string[] {
  return [...equipment].sort((a, b) => {
    const indexA = EQUIPMENT_ORDER.indexOf(a);
    const indexB = EQUIPMENT_ORDER.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });
}
