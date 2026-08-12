import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { healthKitService } from '@/services/HealthKitService';
import { iOSStorage } from '@/services/iOSStorageService';

const DAILY_SYNC_DATE_KEY = 'zenfit_daily_health_sync_date';
const STALE_HOURS = 48;

export interface DailyHealthSyncState {
  syncing: boolean;
  syncedToday: boolean;
  lastSampleDates: Record<string, string | undefined>;
  staleMetrics: string[];
  error: string | null;
  sync: () => Promise<void>;
}

function formatSampleTime(isoString?: string): string | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isWithinHours(isoString?: string, hours: number = STALE_HOURS): boolean {
  if (!isoString) return false;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() <= hours * 60 * 60 * 1000;
}

export function useDailyHealthSync(): DailyHealthSyncState {
  const [syncing, setSyncing] = useState(false);
  const [syncedToday, setSyncedToday] = useState(false);
  const [lastSampleDates, setLastSampleDates] = useState<Record<string, string | undefined>>({});
  const [staleMetrics, setStaleMetrics] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const todayString = new Date().toISOString().split('T')[0];

  const checkStale = useCallback((dates: Record<string, string | undefined>) => {
    const stale: string[] = [];
    if (!isWithinHours(dates.weight, STALE_HOURS)) {
      stale.push('体重');
    }
    if (!isWithinHours(dates.fat_percentage, STALE_HOURS)) {
      stale.push('体脂');
    }
    setStaleMetrics(stale);
  }, []);

  const sync = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    setSyncing(true);
    setError(null);

    try {
      const status = await healthKitService.checkAuthorizationStatus();
      if (!status.isAuthorized) {
        setSyncing(false);
        return;
      }

      const result = await healthKitService.syncAllHealthData();
      if (result.success && result.data) {
        iOSStorage.setItem(DAILY_SYNC_DATE_KEY, todayString);
        setSyncedToday(true);
        setLastSampleDates(result.data.lastSampleDates);
        checkStale(result.data.lastSampleDates);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('[DailyHealthSync] sync failed:', err);
      setError(err instanceof Error ? err.message : '同步失败');
    } finally {
      setSyncing(false);
    }
  }, [checkStale, todayString]);

  useEffect(() => {
    const init = async () => {
      if (!Capacitor.isNativePlatform()) return;

      const lastSyncDate = iOSStorage.getItem(DAILY_SYNC_DATE_KEY);
      if (lastSyncDate === todayString) {
        setSyncedToday(true);
        // 即使今天同步过，也读取缓存时间戳用于显示和过期检查
        const cached = await healthKitService.getCachedHealthData();
        if (cached) {
          setLastSampleDates(cached.lastSampleDates);
          checkStale(cached.lastSampleDates);
        }
        return;
      }

      await sync();
    };

    init();
  }, [sync, todayString, checkStale]);

  return {
    syncing,
    syncedToday,
    lastSampleDates,
    staleMetrics,
    error,
    sync,
  };
}

export default useDailyHealthSync;

export { formatSampleTime, isWithinHours };
