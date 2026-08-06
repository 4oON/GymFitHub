/**
 * Personal Record Service
 * 
 * Manages user's personal records (PRs) including:
 * - Maximum weight lifted for each exercise
 * - Estimated 1RM based on completed sets
 * - Historical progression tracking
 */
import prisma from '../db/client';

// In-memory cache to avoid scanning all workouts on every AI Coach message
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  cache.delete(key);
  return undefined;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  exerciseNameZh: string | null;
  muscleGroup: string;
  maxWeight: number;
  repsAtMaxWeight: number;
  estimated1RM: number;
  dateAchieved: Date;
  workoutId: string;
}

export interface ExerciseHistory {
  exerciseId: string;
  exerciseName: string;
  exerciseNameZh: string | null;
  muscleGroup: string;
  history: Array<{
    date: Date;
    weight: number;
    reps: number;
    estimated1RM: number;
    workoutId: string;
  }>;
}

/**
 * Calculate estimated 1RM using Epley formula
 * 1RM = weight * (1 + reps/30)
 */
function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Get all personal records for a user
 */
export async function getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
  const cacheKey = `pr:${userId}`;
  const cached = getCached<PersonalRecord[]>(cacheKey);
  if (cached) return cached;

  // Get all completed workouts for the user
  const workouts = await prisma.workout.findMany({
    where: {
      userId,
      date: {
        not: null,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  const records = new Map<string, PersonalRecord>();

  for (const workout of workouts) {
    const exercises = workout.exercises as any[];
    
    for (const exercise of exercises) {
      if (!exercise.sets || !Array.isArray(exercise.sets)) continue;
      
      // Find the heaviest completed set
      for (const set of exercise.sets) {
        if (!set.completed || !set.weight || set.weight <= 0) continue;
        
        const exerciseId = exercise.exerciseId || exercise.id;
        const existingRecord = records.get(exerciseId);
        
        // Calculate 1RM for this set
        const set1RM = calculate1RM(set.weight, set.reps || 1);
        
        // Update record if this set has higher 1RM
        if (!existingRecord || set1RM > existingRecord.estimated1RM) {
          records.set(exerciseId, {
            exerciseId,
            exerciseName: exercise.exerciseName || exercise.name,
            exerciseNameZh: exercise.exerciseNameZh || exercise.nameZh,
            muscleGroup: exercise.muscleGroup,
            maxWeight: set.weight,
            repsAtMaxWeight: set.reps || 1,
            estimated1RM: set1RM,
            dateAchieved: workout.date || workout.createdAt,
            workoutId: workout.id,
          });
        }
      }
    }
  }

  const result = Array.from(records.values());
  setCache(cacheKey, result);
  return result;
}

/**
 * Get personal record for a specific exercise
 */
export async function getExercisePR(
  userId: string, 
  exerciseId: string
): Promise<PersonalRecord | null> {
  const prs = await getPersonalRecords(userId);
  return prs.find(pr => pr.exerciseId === exerciseId) || null;
}

/**
 * Get exercise history (all sets over time)
 */
export async function getExerciseHistory(
  userId: string,
  exerciseId: string
): Promise<ExerciseHistory | null> {
  const workouts = await prisma.workout.findMany({
    where: {
      userId,
      date: {
        not: null,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  const history: Array<{
    date: Date;
    weight: number;
    reps: number;
    estimated1RM: number;
    workoutId: string;
  }> = [];

  let exerciseInfo: {
    exerciseName: string;
    exerciseNameZh: string | null;
    muscleGroup: string;
  } | null = null;

  for (const workout of workouts) {
    const exercises = workout.exercises as any[];
    
    for (const exercise of exercises) {
      const currentExerciseId = exercise.exerciseId || exercise.id;
      if (currentExerciseId !== exerciseId) continue;
      
      if (!exerciseInfo) {
        exerciseInfo = {
          exerciseName: exercise.exerciseName || exercise.name,
          exerciseNameZh: exercise.exerciseNameZh || exercise.nameZh,
          muscleGroup: exercise.muscleGroup,
        };
      }
      
      if (!exercise.sets || !Array.isArray(exercise.sets)) continue;
      
      for (const set of exercise.sets) {
        if (!set.completed || !set.weight || set.weight <= 0) continue;
        
        history.push({
          date: workout.date || workout.createdAt,
          weight: set.weight,
          reps: set.reps || 1,
          estimated1RM: calculate1RM(set.weight, set.reps || 1),
          workoutId: workout.id,
        });
      }
    }
  }

  if (!exerciseInfo) return null;

  return {
    exerciseId,
    exerciseName: exerciseInfo.exerciseName,
    exerciseNameZh: exerciseInfo.exerciseNameZh,
    muscleGroup: exerciseInfo.muscleGroup,
    history,
  };
}

/**
 * Get PRs for a specific muscle group
 */
export async function getMuscleGroupPRs(
  userId: string,
  muscleGroup: string
): Promise<PersonalRecord[]> {
  const allPRs = await getPersonalRecords(userId);
  return allPRs.filter(pr => 
    pr.muscleGroup?.toLowerCase() === muscleGroup.toLowerCase()
  );
}

/**
 * Format PRs for AI context
 */
export function formatPRsForAI(prs: PersonalRecord[]): string {
  if (prs.length === 0) {
    return 'No personal records found yet. User has not completed any workouts with weight data.';
  }

  return prs.map(pr => {
    const dateStr = pr.dateAchieved.toISOString().split('T')[0];
    return `- ${pr.exerciseNameZh || pr.exerciseName}: ${pr.maxWeight}kg × ${pr.repsAtMaxWeight}reps (Est. 1RM: ${pr.estimated1RM}kg) on ${dateStr}`;
  }).join('\n');
}

/**
 * Get recent exercise data for AI context
 * Returns last 30 days of workout data
 */
export async function getRecentWorkoutData(userId: string, days: number = 14): Promise<string> {
  const cacheKey = `recent:${userId}:${days}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const workouts = await prisma.workout.findMany({
    where: {
      userId,
      date: {
        gte: since,
      },
    },
    orderBy: {
      date: 'desc',
    },
    take: 20, // Limit to last 20 workouts
  });

  if (workouts.length === 0) {
    const fallback = 'No recent workout data available.';
    setCache(cacheKey, fallback);
    return fallback;
  }

  const output = workouts.map(workout => {
    const exercises = workout.exercises as any[];
    const dateStr = (workout.date || workout.createdAt).toISOString().split('T')[0];
    const exerciseSummary = exercises.map((ex: any) => {
      const totalSets = ex.sets?.length || 0;
      const completedSets = ex.sets?.filter((s: any) => s.completed)?.length || 0;
      const maxWeight = ex.sets?.reduce((max: number, s: any) => 
        s.completed && s.weight > max ? s.weight : max, 0
      ) || 0;
      return `${ex.exerciseNameZh || ex.exerciseName}(${completedSets}/${totalSets}sets${maxWeight > 0 ? `, max ${maxWeight}kg` : ''})`;
    }).join(', ');
    
    return `[${dateStr}] ${workout.name}: ${exerciseSummary}`;
  }).join('\n');
  setCache(cacheKey, output);
  return output;
}

export default {
  getPersonalRecords,
  getExercisePR,
  getExerciseHistory,
  getMuscleGroupPRs,
  formatPRsForAI,
  getRecentWorkoutData,
};
