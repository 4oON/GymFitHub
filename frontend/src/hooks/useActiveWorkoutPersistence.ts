import { useState, useEffect, useCallback, useRef } from 'react';
import type { ActiveExercise } from '@/shared/types';

const STORAGE_KEY = 'zenfit_active_workout';
const START_TIME_KEY = 'zenfit_workout_start_time';

interface PersistedWorkoutState {
  activeWorkout: ActiveExercise[];
  workoutStartTime: number | null;
  lastUpdated: number;
}

/**
 * Hook to persist active workout data to localStorage
 * Prevents data loss when page is refreshed or app is backgrounded
 */
export function useActiveWorkoutPersistence(
  initialWorkout: ActiveExercise[] = [],
  initialStartTime: number | null = null
) {
  const [activeWorkout, setActiveWorkout] = useState<ActiveExercise[]>(() => {
    // Try to load from localStorage on initial mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: PersistedWorkoutState = JSON.parse(saved);
        // Only restore if data is less than 24 hours old
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (Date.now() - parsed.lastUpdated < maxAge) {
          console.log('📦 Restored active workout from storage:', parsed.activeWorkout.length, 'exercises');
          return parsed.activeWorkout;
        }
      }
    } catch (e) {
      console.error('❌ Error loading persisted workout:', e);
    }
    return initialWorkout;
  });

  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: PersistedWorkoutState = JSON.parse(saved);
        const maxAge = 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.lastUpdated < maxAge) {
          return parsed.workoutStartTime;
        }
      }
    } catch (e) {
      console.error('❌ Error loading persisted start time:', e);
    }
    return initialStartTime;
  });

  const [hasRestoredData, setHasRestoredData] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist to localStorage whenever workout changes
  const persistWorkout = useCallback((workout: ActiveExercise[], startTime: number | null) => {
    try {
      const state: PersistedWorkoutState = {
        activeWorkout: workout,
        workoutStartTime: startTime,
        lastUpdated: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('❌ Error persisting workout:', e);
    }
  }, []);

  // Debounced save to avoid excessive localStorage writes
  const schedulePersist = useCallback((workout: ActiveExercise[], startTime: number | null) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      persistWorkout(workout, startTime);
    }, 500); // 500ms debounce
  }, [persistWorkout]);

  // Save whenever workout changes
  useEffect(() => {
    schedulePersist(activeWorkout, workoutStartTime);
  }, [activeWorkout, workoutStartTime, schedulePersist]);

  // Handle page unload to ensure data is saved
  useEffect(() => {
    const handleBeforeUnload = () => {
      persistWorkout(activeWorkout, workoutStartTime);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeWorkout, workoutStartTime, persistWorkout]);

  // Handle visibility change (app backgrounded/foregrounded on mobile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Save immediately when app is backgrounded
        persistWorkout(activeWorkout, workoutStartTime);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeWorkout, workoutStartTime, persistWorkout]);

  // Check for restored data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: PersistedWorkoutState = JSON.parse(saved);
        const maxAge = 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.lastUpdated < maxAge && parsed.activeWorkout.length > 0) {
          setHasRestoredData(true);
        }
      }
    } catch (e) {
      console.error('❌ Error checking restored data:', e);
    }
  }, []);

  // Clear persisted data (call when workout is finished or cleared)
  const clearPersistedWorkout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setActiveWorkout([]);
      setWorkoutStartTime(null);
      setHasRestoredData(false);
      console.log('🗑️ Cleared persisted workout data');
    } catch (e) {
      console.error('❌ Error clearing persisted workout:', e);
    }
  }, []);

  // Wrapper for setActiveWorkout that also updates state
  const updateActiveWorkout = useCallback((
    updater: React.SetStateAction<ActiveExercise[]>
  ) => {
    setActiveWorkout(updater);
  }, []);

  // Wrapper for setWorkoutStartTime
  const updateWorkoutStartTime = useCallback((
    updater: React.SetStateAction<number | null>
  ) => {
    setWorkoutStartTime(updater);
  }, []);

  // Dismiss restored data notification
  const dismissRestoredNotification = useCallback(() => {
    setHasRestoredData(false);
  }, []);

  return {
    activeWorkout,
    setActiveWorkout: updateActiveWorkout,
    workoutStartTime,
    setWorkoutStartTime: updateWorkoutStartTime,
    clearPersistedWorkout,
    hasRestoredData,
    dismissRestoredNotification
  };
}
