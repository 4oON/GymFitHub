import { useState, useEffect, useCallback } from 'react';
import {
  healthKitService,
  type SyncedHealthData,
  type HealthAuthorizationStatus,
} from '@/services/HealthKitService';

export interface UseHealthKitReturn {
  isAvailable: boolean;
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
  healthData: SyncedHealthData | null;
  lastSync: Date | null;

  initialize: () => Promise<boolean>;
  requestAuthorization: () => Promise<boolean>;
  syncData: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  openHealthSettings: () => Promise<void>;

  saveWeight: (weight: number) => Promise<boolean>;
  saveBodyFat: (percentage: number) => Promise<boolean>;
  saveHeight: (height: number) => Promise<boolean>;
}

export function useHealthKit(): UseHealthKitReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<SyncedHealthData | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const initialize = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const available = await healthKitService.initialize();
      setIsAvailable(available);
      if (available) {
        const status = await healthKitService.checkAuthorizationStatus();
        setIsAuthorized(status.isAuthorized);
      }
      return available;
    } catch (err) {
      setError(err instanceof Error ? err.message : '初始化失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestAuthorization = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const granted = await healthKitService.requestAuthorization();
      setIsAuthorized(granted);
      return granted;
    } catch (err) {
      setError(err instanceof Error ? err.message : '授权失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncData = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await healthKitService.syncAllHealthData();

      if (result.success && result.data) {
        setHealthData(result.data);
        setLastSync(new Date());
        return true;
      }

      if (!result.authorized) {
        setError(result.error || '请先启用 HealthKit 授权');
      } else {
        setError(result.error || '同步失败');
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : '同步失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStatus = useCallback(async (): Promise<void> => {
    try {
      const status = await healthKitService.checkAuthorizationStatus();
      setIsAuthorized(status.isAuthorized);
    } catch (err) {
      console.error('刷新状态失败', err);
    }
  }, []);

  const openHealthSettings = useCallback(async (): Promise<void> => {
    try {
      await healthKitService.openHealthSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : '无法打开健康设置');
    }
  }, []);

  const saveWeight = useCallback(
    async (weight: number): Promise<boolean> => {
      setIsLoading(true);
      try {
        const success = await healthKitService.saveWeight(weight);
        if (success) await syncData();
        return success;
      } catch (err) {
        setError(err instanceof Error ? err.message : '保存失败');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [syncData]
  );

  const saveBodyFat = useCallback(
    async (percentage: number): Promise<boolean> => {
      setIsLoading(true);
      try {
        const success = await healthKitService.saveBodyFat(percentage);
        if (success) await syncData();
        return success;
      } catch (err) {
        setError(err instanceof Error ? err.message : '保存失败');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [syncData]
  );

  const saveHeight = useCallback(
    async (height: number): Promise<boolean> => {
      setIsLoading(true);
      try {
        const success = await healthKitService.saveHeight(height);
        if (success) await syncData();
        return success;
      } catch (err) {
        setError(err instanceof Error ? err.message : '保存失败');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [syncData]
  );

  useEffect(() => {
    initialize();
    healthKitService.getCachedHealthData().then((data) => {
      if (data) {
        setHealthData(data);
        setLastSync(data.syncedAt);
      }
    });
  }, [initialize]);

  return {
    isAvailable,
    isAuthorized,
    isLoading,
    error,
    healthData,
    lastSync,
    initialize,
    requestAuthorization,
    syncData,
    refreshStatus,
    openHealthSettings,
    saveWeight,
    saveBodyFat,
    saveHeight,
  };
}

export default useHealthKit;
