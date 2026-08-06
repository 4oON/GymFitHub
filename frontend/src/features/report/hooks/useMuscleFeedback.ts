/**
 * Muscle Feedback Hook
 * 
 * 自动检测是否需要收集反馈，并在适当时机显示弹窗
 */

import { useState, useEffect, useCallback } from 'react';
import type { MuscleGroup } from '@/shared/types';
import type { MuscleFeedback } from '@/shared/types/feedback';
import muscleFeedbackService from '../services/MuscleFeedbackService';

interface PendingFeedback {
  workoutId: string;
  workoutDate: number;
  muscles: MuscleGroup[];
}

interface UseMuscleFeedbackReturn {
  pendingFeedback: PendingFeedback | null;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  submitFeedback: (feedback: MuscleFeedback[]) => void;
  dismissFeedback: () => void;
  checkFeedback: () => void;
}

export const useMuscleFeedback = (): UseMuscleFeedbackReturn => {
  const [pendingFeedback, setPendingFeedback] = useState<PendingFeedback | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 检查是否有待收集的反馈
  const checkFeedback = useCallback(() => {
    const pending = muscleFeedbackService.checkPendingFeedback();
    if (pending) {
      setPendingFeedback(pending);
    }
  }, []);

  // 组件挂载时检查
  useEffect(() => {
    checkFeedback();
    
    // 每10分钟检查一次
    const interval = setInterval(checkFeedback, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkFeedback]);

  // 监听应用从后台恢复
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkFeedback();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkFeedback]);

  const openModal = useCallback(() => {
    if (pendingFeedback) {
      setIsModalOpen(true);
    }
  }, [pendingFeedback]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const submitFeedback = useCallback((feedback: MuscleFeedback[]) => {
    setPendingFeedback(null);
    setIsModalOpen(false);
  }, []);

  const dismissFeedback = useCallback(() => {
    // 用户选择跳过，清除待收集状态
    muscleFeedbackService.clearPendingFeedback();
    setPendingFeedback(null);
  }, []);

  return {
    pendingFeedback,
    isModalOpen,
    openModal,
    closeModal,
    submitFeedback,
    dismissFeedback,
    checkFeedback,
  };
};

export default useMuscleFeedback;
