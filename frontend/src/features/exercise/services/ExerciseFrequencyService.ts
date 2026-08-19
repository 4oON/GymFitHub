import type { Exercise, WorkoutSession, ActiveExercise } from '@/shared/types';

export interface ExerciseFrequency {
  /** Number of sessions where the exercise had >= MIN_SETS_TO_COUNT completed sets */
  count: number;
  /** Timestamp of the most recent qualifying session */
  lastUsedAt: number | null;
}

export type ExerciseFrequencyMap = Record<string, ExerciseFrequency>;

interface FrequencyAccumulator {
  count: number;
  lastUsedAt: number | null;
}

/**
 * Service for computing how often each exercise has been performed.
 *
 * Rules:
 * - A "use" only counts when an exercise had >= MIN_SETS_TO_COUNT completed sets in a session.
 * - Exercises in the library are always present in the map (count 0 if never used).
 * - Frequencies are derived from the merged workout history (local + backend).
 */
export class ExerciseFrequencyService {
  static readonly MIN_SETS_TO_COUNT = 3;
  static readonly FREQUENT_THRESHOLD = 2;

  /**
   * Count completed sets for an active exercise in a session.
   */
  private static countCompletedSets(activeEx: ActiveExercise): number {
    return activeEx.sets?.filter(s => s.completed).length || 0;
  }

  /**
   * Compute a frequency map from workout history.
   * Every exercise in the library is guaranteed an entry.
   */
  static computeFrequency(
    history: WorkoutSession[],
    exerciseLibrary: Exercise[]
  ): ExerciseFrequencyMap {
    const map: Record<string, FrequencyAccumulator> = {};

    // Initialize all known exercises so unused ones appear in More with count 0
    exerciseLibrary.forEach(ex => {
      map[ex.id] = { count: 0, lastUsedAt: null };
    });

    history.forEach(session => {
      const sessionDate = session.date || session.createdAt || 0;
      session.exercises?.forEach(activeEx => {
        if (this.countCompletedSets(activeEx) < this.MIN_SETS_TO_COUNT) return;

        const id = activeEx.exerciseId;
        const existing = map[id] || { count: 0, lastUsedAt: null };
        map[id] = {
          count: existing.count + 1,
          lastUsedAt: Math.max(existing.lastUsedAt || 0, sessionDate)
        };
      });
    });

    return map;
  }

  /**
   * Update an existing frequency map with a newly completed session.
   * Returns a new map object.
   */
  static incrementForSession(
    map: ExerciseFrequencyMap,
    session: WorkoutSession
  ): ExerciseFrequencyMap {
    const next: ExerciseFrequencyMap = { ...map };
    const sessionDate = session.date || session.createdAt || 0;

    session.exercises?.forEach(activeEx => {
      if (this.countCompletedSets(activeEx) < this.MIN_SETS_TO_COUNT) return;

      const id = activeEx.exerciseId;
      const existing = next[id] || { count: 0, lastUsedAt: null };
      next[id] = {
        count: existing.count + 1,
        lastUsedAt: Math.max(existing.lastUsedAt || 0, sessionDate)
      };
    });

    return next;
  }

  /**
   * Whether an exercise qualifies for the Frequent category.
   */
  static isFrequent(freq: ExerciseFrequency | undefined): boolean {
    return (freq?.count || 0) >= this.FREQUENT_THRESHOLD;
  }

  /**
   * Sort helper: higher count first, then Chinese/English name.
   */
  static compareByFrequencyThenName(
    a: { exercise: Exercise; freq: ExerciseFrequency },
    b: { exercise: Exercise; freq: ExerciseFrequency }
  ): number {
    const countDiff = b.freq.count - a.freq.count;
    if (countDiff !== 0) return countDiff;
    return (a.exercise.nameZh || a.exercise.name).localeCompare(
      b.exercise.nameZh || b.exercise.name,
      'zh-CN'
    );
  }
}

export default ExerciseFrequencyService;
