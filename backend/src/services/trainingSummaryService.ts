/**
 * Training Summary Service
 *
 * Aggregates a user's full workout history + weekly reports into a
 * fixed-size compact summary for AI context injection.
 *
 * Key design goals:
 * 1. AI sees ALL history (not just last 14 days) to design periodized plans
 * 2. Token usage stays FIXED (~1500 tokens) regardless of history size
 * 3. Fast — cached 5 min, invalidated on writes
 */

import prisma from '../db/client';

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

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

export function invalidateSummary(userId: string): void {
  cache.delete(`summary:${userId}`);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeeklySummary {
  weekKey: string; // "2025-W48"
  volume: number;
  sets: number;
  days: number;
  muscleGroups: string[];
  topExercises: string[];
}

interface ExerciseSummary {
  name: string;
  totalVolume: number;
  totalSets: number;
  sessions: number;
  bestSet: { weight: number; reps: number; date: string };
  avgWeight: number;
}

export interface TrainingSummary {
  meta: {
    totalWorkouts: number;
    totalVolume: number;
    activeWeeks: number;
    firstWorkoutDate: string;
    lastWorkoutDate: string;
  };
  perWeek: WeeklySummary[]; // last 12 weeks, newest first
  perExercise: ExerciseSummary[]; // top 15 by volume
  muscleBalance: Array<{ muscle: string; volume: number; percentage: number }>;
  recentTrend: {
    last4WeeksVolume: number;
    prev4WeeksVolume: number;
    volumeDelta: number;
    streak: number;
  };
  latestReports: Array<{
    week: string;
    totalVolume: number;
    totalSets: number;
    workoutDays: number;
    muscleGroups: string[];
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWeekInfo(date: Date): { year: number; weekNumber: number } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getFullYear(), weekNumber };
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

async function buildSummary(userId: string): Promise<TrainingSummary> {
  const workouts = await prisma.workout.findMany({
    where: { userId, date: { not: null } },
    orderBy: { date: 'asc' },
    select: { id: true, name: true, date: true, exercises: true, durationMin: true },
  });

  const now = new Date();

  // Raw accumulators
  const weekMap = new Map<string, {
    weekKey: string;
    volume: number;
    sets: number;
    dayKeys: Set<string>;
    muscleGroups: Set<string>;
    exerciseVolumes: Map<string, number>;
  }>();
  const exerciseMap = new Map<string, {
    name: string;
    nameZh: string | null;
    volume: number;
    sets: number;
    sessions: number;
    weightSamples: number[];
    totalWeight: number;
    bestWeight: number;
    bestReps: number;
    bestDate: string;
  }>();
  const muscleMap = new Map<string, number>();

  let totalVolume = 0;
  let firstWorkoutDate: string | null = null;
  let lastWorkoutDate: string | null = null;

  for (const workout of workouts) {
    const date = workout.date as Date;
    const dateKey = date.toISOString().split('T')[0];
    if (!firstWorkoutDate) firstWorkoutDate = dateKey;
    lastWorkoutDate = dateKey;

    const { year, weekNumber } = getWeekInfo(date);
    const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;
    let week = weekMap.get(weekKey);
    if (!week) {
      week = {
        weekKey,
        volume: 0,
        sets: 0,
        dayKeys: new Set(),
        muscleGroups: new Set(),
        exerciseVolumes: new Map(),
      };
      weekMap.set(weekKey, week);
    }
    week.dayKeys.add(dateKey);

    const exercises: any[] = Array.isArray(workout.exercises) ? workout.exercises : [];
    for (const rawEx of exercises) {
      const ex: any = rawEx;
      if (!Array.isArray(ex.sets)) continue;
      const completedSets = ex.sets.filter((s: any) => s.completed);
      if (completedSets.length === 0) continue;

      const exName = ex.exerciseNameZh || ex.exerciseName || 'Unknown';
      const muscle = ex.muscleGroup || 'Other';

      // Per-week accumulation
      const completedCount = completedSets.length;
      const weekVolume = completedSets.reduce(
        (sum: number, s: any) => sum + ((s.weight || 0) * (s.reps || 0)), 0
      );
      week.sets += completedCount;
      week.volume += weekVolume;
      week.muscleGroups.add(muscle);
      week.exerciseVolumes.set(
        exName,
        (week.exerciseVolumes.get(exName) || 0) + weekVolume
      );

      // Per-exercise accumulation
      let exSum = exerciseMap.get(exName);
      if (!exSum) {
        exSum = {
          name: exName,
          nameZh: ex.exerciseNameZh || null,
          volume: 0,
          sets: 0,
          sessions: 0,
          weightSamples: [],
          totalWeight: 0,
          bestWeight: 0,
          bestReps: 0,
          bestDate: dateKey,
        };
        exerciseMap.set(exName, exSum);
      }
      exSum.volume += weekVolume;
      exSum.sets += completedCount;
      exSum.sessions += 1;

      for (const s of completedSets) {
        const w = s.weight || 0;
        const r = s.reps || 0;
        if (w > 0) {
          exSum.weightSamples.push(w);
          exSum.totalWeight += w;
          if (w > exSum.bestWeight) {
            exSum.bestWeight = w;
            exSum.bestReps = r;
            exSum.bestDate = dateKey;
          }
        }
      }

      // Muscle accumulation
      muscleMap.set(muscle, (muscleMap.get(muscle) || 0) + weekVolume);
      totalVolume += weekVolume;
    }
  }

  // --- perWeek: keep last 12 weeks, newest first ---
  const perWeek: WeeklySummary[] = weekMap
    .size === 0
      ? []
      : Array.from(weekMap.values())
          .filter((w) => weekIsWithin(w.weekKey, now, 11))
          .map((w) => ({
            weekKey: w.weekKey,
            volume: Math.round(w.volume),
            sets: w.sets,
            days: w.dayKeys.size,
            muscleGroups: Array.from(w.muscleGroups),
            topExercises: Array.from(w.exerciseVolumes.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([name]) => name),
          }))
          .sort((a, b) => (a.weekKey < b.weekKey ? 1 : -1));

  // --- perExercise: top 15 by volume ---
  const perExercise: ExerciseSummary[] = Array.from(exerciseMap.values())
    .map((e) => ({
      name: e.name,
      totalVolume: Math.round(e.volume),
      totalSets: e.sets,
      sessions: e.sessions,
      bestSet: {
        weight: e.bestWeight,
        reps: e.bestReps,
        date: e.bestDate,
      },
      avgWeight: e.weightSamples.length > 0
        ? Math.round(e.totalWeight / e.weightSamples.length)
        : 0,
    }))
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 15);

  // --- muscleBalance ---
  const muscleTotal = Array.from(muscleMap.values()).reduce((s, v) => s + v, 0);
  const muscleBalance = Array.from(muscleMap.entries())
    .map(([muscle, volume]) => ({
      muscle,
      volume: Math.round(volume),
      percentage: muscleTotal > 0 ? Math.round((volume / muscleTotal) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // --- recentTrend ---
  const last4 = weeksAgoVolume(weekMap, now, 0, 3);
  const prev4 = weeksAgoVolume(weekMap, now, 4, 7);
  const volumeDelta = prev4 > 0
    ? Math.round(((last4 - prev4) / prev4) * 100)
    : last4 > 0 ? 100 : 0;

  // streak: consecutive weeks with training counting back from current week
  let streak = 0;
  for (let i = 0; i < 52; i++) {
    const target = new Date(now);
    target.setDate(target.getDate() - i * 7);
    const { year, weekNumber } = getWeekInfo(target);
    const key = `${year}-W${String(weekNumber).padStart(2, '0')}`;
    const week = weekMap.get(key);
    if (week && week.dayKeys.size > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  // --- latestReports (from weekly_reports table) ---
  const reports = await prisma.weeklyReport.findMany({
    where: { userId },
    orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    take: 3,
    select: { year: true, weekNumber: true, stats: true, muscleDistribution: true },
  });
  const latestReports = reports.map((r) => {
    const stats = (r.stats as any) || {};
    const muscleGroups = Array.isArray(r.muscleDistribution)
      ? (r.muscleDistribution as any[]).map((m) => m.muscle).slice(0, 5)
      : [];
    return {
      week: `${r.year}-W${String(r.weekNumber).padStart(2, '0')}`,
      totalVolume: stats.totalVolume || 0,
      totalSets: stats.totalSets || 0,
      workoutDays: stats.workoutDays || 0,
      muscleGroups,
    };
  });

  return {
    meta: {
      totalWorkouts: workouts.length,
      totalVolume: Math.round(totalVolume),
      activeWeeks: weekMap.size,
      firstWorkoutDate: firstWorkoutDate || '',
      lastWorkoutDate: lastWorkoutDate || '',
    },
    perWeek,
    perExercise,
    muscleBalance,
    recentTrend: { last4WeeksVolume: last4, prev4WeeksVolume: prev4, volumeDelta, streak },
    latestReports,
  };
}

function weekIsWithin(weekKey: string, anchor: Date, weeksBack: number): boolean {
  for (let i = 0; i <= weeksBack; i++) {
    const target = new Date(anchor);
    target.setDate(target.getDate() - i * 7);
    const { year, weekNumber } = getWeekInfo(target);
    if (`${year}-W${String(weekNumber).padStart(2, '0')}` === weekKey) return true;
  }
  return false;
}

function weeksAgoVolume(
  weekMap: Map<string, any>,
  now: Date,
  startBack: number,
  endBack: number
): number {
  let total = 0;
  for (let i = startBack; i <= endBack; i++) {
    const target = new Date(now);
    target.setDate(target.getDate() - i * 7);
    const { year, weekNumber } = getWeekInfo(target);
    const key = `${year}-W${String(weekNumber).padStart(2, '0')}`;
    const week = weekMap.get(key);
    if (week) total += week.volume;
  }
  return Math.round(total);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getUserSummary(userId: string): Promise<TrainingSummary> {
  const cacheKey = `summary:${userId}`;
  const cached = getCached<TrainingSummary>(cacheKey);
  if (cached) return cached;

  const summary = await buildSummary(userId);
  setCache(cacheKey, summary);
  return summary;
}

/**
 * Format the summary into compact AI context text.
 * Token budget ≈ 1500 tokens, fixed regardless of history size.
 */
export function formatSummaryForAI(summary: TrainingSummary): string {
  if (summary.meta.totalWorkouts === 0) {
    return 'No training data available yet.';
  }

  const lines: string[] = [];
  lines.push(`[User Training Summary]`);
  lines.push(
    `Total: ${summary.meta.totalWorkouts} workouts, ${formatVolume(summary.meta.totalVolume)} total volume, ` +
    `${summary.meta.activeWeeks} active weeks (${summary.meta.firstWorkoutDate} to ${summary.meta.lastWorkoutDate})`
  );

  // Weekly trend (last 12)
  lines.push(``);
  lines.push(`Weekly trend (last 12):`);
  if (summary.perWeek.length === 0) {
    lines.push(`  (no weekly breakdown)`);
  } else {
    for (const w of summary.perWeek) {
      lines.push(
        `  ${w.weekKey}: ${formatVolume(w.volume)} / ${w.sets} sets / ${w.days} day(s) ` +
        `[${w.muscleGroups.join(', ')}] top: ${w.topExercises.join(', ')}`
      );
    }
  }

  // Top exercises
  lines.push(``);
  lines.push(`Top exercises (by volume):`);
  for (const e of summary.perExercise) {
    const best = e.bestSet.weight > 0
      ? `best ${e.bestSet.weight}kg×${e.bestSet.reps} @ ${e.bestSet.date}`
      : '';
    lines.push(
      `  - ${e.name}: ${formatVolume(e.totalVolume)} / ${e.sessions} sessions / avg ${e.avgWeight}kg ${best}`
    );
  }

  // Muscle balance
  lines.push(``);
  lines.push(`Muscle balance:`);
  for (const m of summary.muscleBalance) {
    lines.push(`  - ${m.muscle}: ${m.percentage}% (${formatVolume(m.volume)})`);
  }

  // Trend
  const trend = summary.recentTrend;
  const deltaStr = trend.volumeDelta >= 0 ? `+${trend.volumeDelta}` : `${trend.volumeDelta}`;
  lines.push(``);
  lines.push(
    `Trend: volume ${deltaStr}% vs previous 4 weeks, ` +
    `${trend.streak > 0 ? `${trend.streak}-week streak` : 'no current streak'}.`
  );

  // Latest reports
  if (summary.latestReports.length > 0) {
    lines.push(``);
    lines.push(`Latest weekly reports:`);
    for (const r of summary.latestReports) {
      lines.push(
        `  ${r.week}: ${formatVolume(r.totalVolume)} / ${r.totalSets} sets / ${r.workoutDays} day(s) [${r.muscleGroups.join(', ')}]`
      );
    }
  }

  return lines.join('\n');
}

function formatVolume(v: number): string {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}Mkg`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k kg`;
  return `${v} kg`;
}

export default {
  getUserSummary,
  formatSummaryForAI,
  invalidateSummary,
};
