import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { healthKitService } from '@/services/HealthKitService';
import { iOSStorage } from '@/services/iOSStorageService';

export function useHealthSyncPrompt(): {
  showPrompt: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
} {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!Capacitor.isNativePlatform()) return;

      const alreadyPrompted = iOSStorage.getItem('zenfit_health_prompt_shown') === 'true';
      if (alreadyPrompted) return;

      const available = await healthKitService.isAvailable();
      if (!available) return;

      const cached = await healthKitService.getCachedHealthData();
      if (cached?.body?.weight) return;

      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);

      return () => clearTimeout(timer);
    };

    check();
  }, []);

  const onConfirm = useCallback(async () => {
    setShowPrompt(false);
    iOSStorage.setItem('zenfit_health_prompt_shown', 'true');

    const granted = await healthKitService.requestAuthorization();
    if (granted) {
      await healthKitService.syncAllHealthData();
    }
  }, []);

  const onCancel = useCallback(() => {
    setShowPrompt(false);
    iOSStorage.setItem('zenfit_health_prompt_shown', 'true');
  }, []);

  return { showPrompt, onConfirm, onCancel };
}

export default useHealthSyncPrompt;
