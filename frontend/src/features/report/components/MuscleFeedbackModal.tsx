/**
 * Muscle Feedback Modal
 * 
 * 训练后24-48小时询问用户肌肉感受
 * 收集主观反馈以优化恢复算法和训练推荐
 * 
 * iOS Compatible: 无 browser-only APIs, 使用 safeStorage
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Check, ChevronRight, ChevronLeft, Dumbbell } from 'lucide-react';
import type { MuscleGroup } from '@/shared/types';
import type { 
  MuscleFeedback, 
  MuscleSorenessLevel, 
  MuscleSensationLevel, 
  PumpDuration 
} from '@/shared/types/feedback';
import {
  MUSCLE_SORENESS_OPTIONS,
  MUSCLE_SENSATION_OPTIONS,
  PUMP_DURATION_OPTIONS,
  RECOVERY_FEELING_OPTIONS,
} from '@/shared/types/feedback';
import muscleFeedbackService from '../services/MuscleFeedbackService';

interface MuscleFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutId: string;
  workoutDate: number;
  muscles: MuscleGroup[];
  onFeedbackSubmitted?: (feedback: MuscleFeedback[]) => void;
}

type FeedbackStep = 'soreness' | 'pump' | 'pump_duration' | 'fatigue' | 'recovery' | 'complete';

interface MuscleFeedbackState {
  muscle: MuscleGroup;
  sorenessLevel: MuscleSorenessLevel | null;
  pumpLevel: MuscleSensationLevel | null;
  pumpDuration: PumpDuration | null;
  fatigueLevel: MuscleSensationLevel | null;
  recoveryFeeling: MuscleFeedback['recoveryFeeling'] | null;
}

const stepConfig: Record<FeedbackStep, { title: string; subtitle: string; icon: React.ReactNode }> = {
  soreness: {
    title: '肌肉酸痛程度',
    subtitle: '请选择该肌肉的酸痛感受',
    icon: <Dumbbell className="w-6 h-6 text-amber-400" />,
  },
  pump: {
    title: '泵感强度',
    subtitle: '训练时感受到的充血程度',
    icon: <Dumbbell className="w-6 h-6 text-rose-400" />,
  },
  pump_duration: {
    title: '泵感持续时间',
    subtitle: '充血感持续了多久？',
    icon: <Dumbbell className="w-6 h-6 text-cyan-400" />,
  },
  fatigue: {
    title: '疲劳程度',
    subtitle: '训练后的疲劳感受',
    icon: <Dumbbell className="w-6 h-6 text-purple-400" />,
  },
  recovery: {
    title: '恢复状态',
    subtitle: '现在感觉恢复得如何？',
    icon: <Dumbbell className="w-6 h-6 text-emerald-400" />,
  },
  complete: {
    title: '反馈完成',
    subtitle: '感谢你的反馈，AI会据此优化你的训练计划',
    icon: <Check className="w-6 h-6 text-emerald-400" />,
  },
};

const MuscleFeedbackModal: React.FC<MuscleFeedbackModalProps> = ({
  isOpen,
  onClose,
  workoutId,
  workoutDate,
  muscles,
  onFeedbackSubmitted,
}) => {
  const [currentMuscleIndex, setCurrentMuscleIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<FeedbackStep>('soreness');
  const [feedbackStates, setFeedbackStates] = useState<MuscleFeedbackState[]>(
    muscles.map(m => ({
      muscle: m,
      sorenessLevel: null,
      pumpLevel: null,
      pumpDuration: null,
      fatigueLevel: null,
      recoveryFeeling: null,
    }))
  );

  const currentMuscle = muscles[currentMuscleIndex];
  const currentFeedback = feedbackStates[currentMuscleIndex];

  const updateCurrentFeedback = useCallback((
    key: keyof MuscleFeedbackState, 
    value: string
  ) => {
    setFeedbackStates(prev => {
      const updated = [...prev];
      updated[currentMuscleIndex] = {
        ...updated[currentMuscleIndex],
        [key]: value,
      };
      return updated;
    });
  }, [currentMuscleIndex]);

  // Auto-advance to next step after selection
  const handleOptionSelect = useCallback((
    key: keyof MuscleFeedbackState,
    value: string
  ) => {
    // First update the state
    setFeedbackStates(prev => {
      const updated = [...prev];
      updated[currentMuscleIndex] = {
        ...updated[currentMuscleIndex],
        [key]: value,
      };
      return updated;
    });

    // Then auto-advance after a short delay for visual feedback
    setTimeout(() => {
      const stepOrder: FeedbackStep[] = ['soreness', 'pump', 'pump_duration', 'fatigue', 'recovery'];
      const currentIndex = stepOrder.indexOf(currentStep);

      if (currentIndex < stepOrder.length - 1) {
        setCurrentStep(stepOrder[currentIndex + 1]);
      } else {
        // Current muscle complete, check next
        if (currentMuscleIndex < muscles.length - 1) {
          setCurrentMuscleIndex(prev => prev + 1);
          setCurrentStep('soreness');
        } else {
          // All muscles complete, submit
          // We need to submit with the updated state
          submitFeedbackWithValue(key, value);
        }
      }
    }, 200); // 200ms delay for visual feedback
  }, [currentStep, currentMuscleIndex, muscles.length]);

  // Submit with the latest value included
  const submitFeedbackWithValue = useCallback((
    lastKey?: keyof MuscleFeedbackState,
    lastValue?: string
  ) => {
    const completedFeedbacks: MuscleFeedback[] = [];

    for (let i = 0; i < feedbackStates.length; i++) {
      const state = feedbackStates[i];
      // For the current muscle being edited, use the new value
      const finalState = (i === currentMuscleIndex && lastKey && lastValue)
        ? { ...state, [lastKey]: lastValue }
        : state;

      if (finalState.sorenessLevel && finalState.pumpLevel && finalState.pumpDuration && 
          finalState.fatigueLevel && finalState.recoveryFeeling) {
        const feedback = muscleFeedbackService.createFeedback({
          muscle: finalState.muscle,
          workoutId,
          workoutDate,
          sorenessLevel: finalState.sorenessLevel,
          pumpLevel: finalState.pumpLevel,
          pumpDuration: finalState.pumpDuration,
          fatigueLevel: finalState.fatigueLevel,
          recoveryFeeling: finalState.recoveryFeeling,
        });
        completedFeedbacks.push(feedback);
      }
    }

    // Clear pending feedback
    muscleFeedbackService.clearPendingFeedback();

    setCurrentStep('complete');
    onFeedbackSubmitted?.(completedFeedbacks);

    // Auto close after 3 seconds
    setTimeout(() => {
      onClose();
    }, 3000);
  }, [feedbackStates, currentMuscleIndex, workoutId, workoutDate, onFeedbackSubmitted, onClose]);

  const handleNext = useCallback(() => {
    const stepOrder: FeedbackStep[] = ['soreness', 'pump', 'pump_duration', 'fatigue', 'recovery'];
    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    } else {
      // 当前肌肉完成，检查是否还有下一个肌肉
      if (currentMuscleIndex < muscles.length - 1) {
        setCurrentMuscleIndex(prev => prev + 1);
        setCurrentStep('soreness');
      } else {
        // 所有肌肉完成，提交反馈
        submitFeedback();
      }
    }
  }, [currentStep, currentMuscleIndex, muscles.length]);

  const handlePrevious = useCallback(() => {
    const stepOrder: FeedbackStep[] = ['soreness', 'pump', 'pump_duration', 'fatigue', 'recovery'];
    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    } else if (currentMuscleIndex > 0) {
      setCurrentMuscleIndex(prev => prev - 1);
      setCurrentStep('recovery');
    }
  }, [currentStep, currentMuscleIndex]);

  const submitFeedback = useCallback(() => {
    const completedFeedbacks: MuscleFeedback[] = [];

    for (const state of feedbackStates) {
      if (state.sorenessLevel && state.pumpLevel && state.pumpDuration && 
          state.fatigueLevel && state.recoveryFeeling) {
        const feedback = muscleFeedbackService.createFeedback({
          muscle: state.muscle,
          workoutId,
          workoutDate,
          sorenessLevel: state.sorenessLevel,
          pumpLevel: state.pumpLevel,
          pumpDuration: state.pumpDuration,
          fatigueLevel: state.fatigueLevel,
          recoveryFeeling: state.recoveryFeeling,
        });
        completedFeedbacks.push(feedback);
      }
    }

    // 清除待收集反馈
    muscleFeedbackService.clearPendingFeedback();

    setCurrentStep('complete');
    onFeedbackSubmitted?.(completedFeedbacks);

    // 3秒后自动关闭
    setTimeout(() => {
      onClose();
    }, 3000);
  }, [feedbackStates, workoutId, workoutDate, onFeedbackSubmitted, onClose]);

  const isStepComplete = useCallback(() => {
    switch (currentStep) {
      case 'soreness': return !!currentFeedback.sorenessLevel;
      case 'pump': return !!currentFeedback.pumpLevel;
      case 'pump_duration': return !!currentFeedback.pumpDuration;
      case 'fatigue': return !!currentFeedback.fatigueLevel;
      case 'recovery': return !!currentFeedback.recoveryFeeling;
      default: return true;
    }
  }, [currentStep, currentFeedback]);

  if (!isOpen) return null;

  const config = stepConfig[currentStep];
  const progress = ((currentMuscleIndex * 5 + ['soreness', 'pump', 'pump_duration', 'fatigue', 'recovery'].indexOf(currentStep)) / (muscles.length * 5)) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={currentStep === 'complete' ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl"
          >
            {/* Progress Bar */}
            {currentStep !== 'complete' && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}

            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                    {config.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{config.title}</h2>
                    <p className="text-sm text-slate-400">{config.subtitle}</p>
                  </div>
                </div>
                {currentStep !== 'complete' && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-slate-800 transition-colors"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                )}
              </div>

              {/* Muscle Indicator */}
              {currentStep !== 'complete' && muscles.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {muscles.map((muscle, idx) => (
                    <span
                      key={muscle}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        idx === currentMuscleIndex
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : idx < currentMuscleIndex
                          ? 'bg-slate-800 text-slate-500'
                          : 'bg-slate-800/50 text-slate-600'
                      }`}
                    >
                      {muscle}
                      {idx < currentMuscleIndex && ' ✓'}
                    </span>
                  ))}
                </div>
              )}

              {currentStep !== 'complete' && muscles.length === 1 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">{currentMuscle}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {currentStep === 'complete' ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <Check className="w-10 h-10 text-emerald-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">反馈已提交</h3>
                  <p className="text-slate-400 text-sm">
                    AI会根据你的反馈优化恢复计算和训练推荐
                  </p>
                </div>
              ) : (
                <>
                  {/* Options */}
                  <div className="space-y-2 mb-6">
                    {currentStep === 'soreness' && MUSCLE_SORENESS_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleOptionSelect('sorenessLevel', option.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          currentFeedback.sorenessLevel === option.value
                            ? `border-amber-500 bg-amber-500/10 ${option.color}`
                            : 'border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="font-medium">{option.label}</span>
                      </button>
                    ))}

                    {currentStep === 'pump' && MUSCLE_SENSATION_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleOptionSelect('pumpLevel', option.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          currentFeedback.pumpLevel === option.value
                            ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                            : 'border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="font-medium">{option.label}</span>
                      </button>
                    ))}

                    {currentStep === 'pump_duration' && PUMP_DURATION_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleOptionSelect('pumpDuration', option.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          currentFeedback.pumpDuration === option.value
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                            : 'border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="font-medium">{option.label}</span>
                      </button>
                    ))}

                    {currentStep === 'fatigue' && MUSCLE_SENSATION_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleOptionSelect('fatigueLevel', option.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          currentFeedback.fatigueLevel === option.value
                            ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                            : 'border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="font-medium">{option.label}</span>
                      </button>
                    ))}

                    {currentStep === 'recovery' && RECOVERY_FEELING_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleOptionSelect('recoveryFeeling', option.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          currentFeedback.recoveryFeeling === option.value
                            ? `border-emerald-500 bg-emerald-500/10 ${option.color}`
                            : 'border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-3">
                    {(currentMuscleIndex > 0 || currentStep !== 'soreness') && (
                      <button
                        onClick={handlePrevious}
                        className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-400 
                                 hover:text-white hover:border-slate-600 transition-all flex items-center justify-center gap-2"
                        style={{ touchAction: 'manipulation' }}
                      >
                        <ChevronLeft className="w-5 h-5" />
                        上一步
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      disabled={!isStepComplete()}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                        ${isStepComplete()
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      {currentMuscleIndex === muscles.length - 1 && currentStep === 'recovery' 
                        ? '提交反馈' 
                        : '下一步'}
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MuscleFeedbackModal;
