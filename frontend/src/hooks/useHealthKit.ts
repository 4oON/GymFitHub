import { useState, useEffect, useCallback } from 'react';
import { healthKitService, type HealthKitData, type AuthorizationStatus } from '../services/HealthKitService';

export interface UseHealthKitReturn {
  // 状态
  isAvailable: boolean;
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
  healthData: HealthKitData | null;
  lastSync: Date | null;
  
  // 方法
  initialize: () => Promise<boolean>;
  requestAuthorization: () => Promise<boolean>;
  syncData: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  
  // 保存数据
  saveWeight: (weight: number) => Promise<boolean>;
  saveBodyFat: (percentage: number) => Promise<boolean>;
}

/**
 * React Hook for iOS HealthKit integration
 * Provides easy access to Apple Health data
 */
export function useHealthKit(): UseHealthKitReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<HealthKitData | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  /**
   * 初始化 HealthKit
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const available = await healthKitService.initialize();
      setIsAvailable(available);
      
      if (available) {
        // 检查授权状态
        const authStatus = await healthKitService.checkAuthorizationStatus();
        setIsAuthorized(authStatus.isAuthorized);
      }
      
      return available;
    } catch (err) {
      setError(err instanceof Error ? err.message : '初始化失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 请求授权
   */
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

  /**
   * 同步健康数据
   */
  const syncData = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await healthKitService.getLatestHealthData();
      
      if (result.success && result.data) {
        setHealthData(result.data);
        setLastSync(new Date());
        return true;
      } else {
        setError(result.error || '同步失败');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '同步失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 刷新授权状态
   */
  const refreshStatus = useCallback(async (): Promise<void> => {
    try {
      const status = await healthKitService.checkAuthorizationStatus();
      setIsAuthorized(status.isAuthorized);
    } catch (err) {
      console.error('刷新状态失败', err);
    }
  }, []);

  /**
   * 保存体重
   */
  const saveWeight = useCallback(async (weight: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await healthKitService.saveWeight(weight);
      if (success) {
        // 保存成功后刷新数据
        await syncData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [syncData]);

  /**
   * 保存体脂率
   */
  const saveBodyFat = useCallback(async (percentage: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await healthKitService.saveBodyFat(percentage);
      if (success) {
        await syncData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [syncData]);

  // 初始化时自动检查
  useEffect(() => {
    initialize();
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
    saveWeight,
    saveBodyFat
  };
}

export default useHealthKit;
