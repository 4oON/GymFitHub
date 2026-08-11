/**
 * Weekly Training Coach Card - Enhanced Edition
 * 
 * Features:
 * - Smart exercise recommendations with infinite browse
 * - Duplicate prevention with iOS toast notification
 * - Replace/dislike functionality for each exercise
 * - Auto-switch to other muscle groups when primary is exhausted
 * - Related muscle group synergy recommendations
 * - iOS Compatible: safe localStorage, no browser-only APIs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Dumbbell,
  ChevronRight,
  RotateCcw,
  X,
  Cpu,
  Sparkles,
  Plus,
  List,
  Play,
  MessageCircle
} from 'lucide-react';
// ChevronDown and ChevronUp already imported
import type { WorkoutSession, WeeklyReport, RecoveryStatus, UserProfile, Exercise, ActiveExercise, Routine } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';
import WeeklyTrainingCoachService from '../services/WeeklyTrainingCoachService';
import type { CoachRecommendation, RecommendedExercise } from '../services/WeeklyTrainingCoachService';
import RecommendedExerciseCard from './RecommendedExerciseCard';
import { reportStorage } from '../services/ReportStorageService';
import { INITIAL_EXERCISES } from '@/shared/constants/initial_exercises';
import MuscleFeedbackModal from './MuscleFeedbackModal';
import useMuscleFeedback from '../hooks/useMuscleFeedback';
import muscleFeedbackService from '../services/MuscleFeedbackService';
import type { MuscleFeedback } from '@/shared/types/feedback';
import { iOSStorage } from '@/services/iOSStorageService';

interface WeeklyTrainingCoachCardProps {
  currentWeekSessions: WorkoutSession[];
  lastWeekReport: WeeklyReport | null;
  recoveryState: RecoveryStatus[];
  userProfile: UserProfile;
  justCompletedSession?: WorkoutSession;
  className?: string;
  onSelectExercise?: (exercise: Exercise) => void;
  activeWorkout?: ActiveExercise[];
  routines?: Routine[];
  onStartRoutine?: (routine: Routine) => void;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'feedback';
}

const translations = {
  en: {
    title: 'Training Coach',
    feedbackPending: 'How are your muscles recovering?',
    feedbackPrompt: 'Help AI optimize your training plan',
    subtitle: 'Live Insights',
    days: 'Days',
    sets: 'Sets',
    ready: 'Ready',
    vTaper: 'Back Width',
    symmetry: 'Balance',
    viewDetails: 'View Tips',
    hideDetails: 'Hide',
    nextSession: 'Next Session',
    weakPoints: 'Priority Focus',
    recovered: 'Recovered',
    nextGroup: 'More Options',
    alreadyAdded: 'Exercise already added',
    replaced: 'Replaced with new exercise',
    muscleExhausted: 'All {muscle} exercises viewed. Showing {newMuscle} options.',
    exploreMore: 'Keep exploring for more options',
    allExercisesAdded: 'All exercises added! Click More Options for new suggestions',
    addAll: 'Add All',
    addedAll: 'All exercises added to workout',
    // Feedback section
    muscleFeedbackTitle: '肌肉恢复反馈',
    muscleFeedbackSubtitle: '帮助AI了解你的真实恢复状态',
    feedbackAvailableIn: '{hours}小时后可填写最佳反馈',
    feedbackReady: '现在可以填写反馈',
    feedbackSubmitted: '已提交',
    provideFeedback: '填写反馈',
    recentWorkouts: '最近训练',
    hoursAgo: '{hours}小时前',
    testFeedbackMode: '测试反馈弹窗',
    showFeedbackModal: '立即显示',
  }
};

// iOS Safe localStorage wrapper
const safeStorage = {
  getItem: (key: string): string | null => {
    try { return iOSStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string): boolean => {
    try { iOSStorage.setItem(key, value); return true; } catch { return false; }
  },
  removeItem: (key: string): boolean => {
    try { iOSStorage.removeItem(key); return true; } catch { return false; }
  }
};

const getScoreColor = (score: number) => {
  if (score >= 8) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (score >= 6) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
  if (score >= 4) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
};

const PriorityBadge = ({ priority }: { priority: 'high' | 'medium' | 'low' }) => {
  const colors = {
    high: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${colors[priority]}`}>
      {priority === 'high' ? 'Priority' : priority === 'medium' ? 'Focus' : 'On Track'}
    </span>
  );
};

// iOS-compatible Toast Component
// Muscle Feedback Section Component
interface MuscleFeedbackSectionProps {
  sessions: WorkoutSession[];
  onProvideFeedback: (workoutId: string, muscles: MuscleGroup[]) => void;
  onTestModal?: () => void;
}

const MuscleFeedbackSection: React.FC<MuscleFeedbackSectionProps> = ({
  sessions,
  onProvideFeedback,
  onTestModal,
}) => {
  const [pendingWorkouts, setPendingWorkouts] = useState<Array<{
    workoutId: string;
    workoutDate: number;
    muscles: MuscleGroup[];
    hoursSinceWorkout: number;
    canSubmitNow: boolean;
    submitted: boolean;
  }>>([]);

  useEffect(() => {
    // 准备最近训练数据
    const recentSessions = sessions
      .filter(s => {
        const hoursSince = (Date.now() - new Date(s.date).getTime()) / (60 * 60 * 1000);
        return hoursSince <= 72; // 72小时内的训练
      })
      .map(s => ({
        id: s.id,
        date: new Date(s.date).getTime(),
        muscles: [...new Set(s.exercises?.map(e => e.muscleGroup).filter(Boolean) as MuscleGroup[])],
      }));

    const pending = muscleFeedbackService.getAllPendingFeedbackWorkouts(recentSessions);
    setPendingWorkouts(pending);
  }, [sessions]);

  if (pendingWorkouts.length === 0 && !onTestModal) return null;

  return (
    <div className="px-4 py-3 border-b border-slate-800/50 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <MessageCircle size={16} className="text-indigo-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{translations.en.muscleFeedbackTitle}</h4>
            <p className="text-[10px] text-slate-400">{translations.en.muscleFeedbackSubtitle}</p>
          </div>
        </div>
        {onTestModal && (
          <button
            onClick={onTestModal}
            className="px-3 py-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 
                     rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            style={{ touchAction: 'manipulation' }}
          >
            {translations.en.testFeedbackMode}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {pendingWorkouts.map((workout) => (
          <div
            key={workout.workoutId}
            className={`p-3 rounded-xl border transition-all ${
              workout.submitted
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : workout.canSubmitNow
                ? 'bg-slate-800/50 border-slate-700 hover:border-indigo-500/30'
                : 'bg-slate-800/30 border-slate-800 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-300">
                    {translations.en.hoursAgo.replace('{hours}', Math.round(workout.hoursSinceWorkout).toString())}
                  </span>
                  {workout.submitted && (
                    <span className="px-2 py-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 rounded">
                      {translations.en.feedbackSubmitted}
                    </span>
                  )}
                  {!workout.submitted && workout.hoursSinceWorkout < 24 && (
                    <span className="px-2 py-0.5 text-[10px] font-medium text-amber-400 bg-amber-500/10 rounded">
                      {translations.en.feedbackAvailableIn.replace('{hours}', Math.round(24 - workout.hoursSinceWorkout).toString())}
                    </span>
                  )}
                  {!workout.submitted && workout.hoursSinceWorkout >= 24 && (
                    <span className="px-2 py-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 rounded">
                      {translations.en.feedbackReady}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {workout.muscles.slice(0, 4).map(muscle => (
                    <span
                      key={muscle}
                      className="px-2 py-0.5 text-[10px] text-slate-400 bg-slate-800 rounded"
                    >
                      {muscle}
                    </span>
                  ))}
                  {workout.muscles.length > 4 && (
                    <span className="px-2 py-0.5 text-[10px] text-slate-500">
                      +{workout.muscles.length - 4}
                    </span>
                  )}
                </div>
              </div>
              {!workout.submitted && (
                <button
                  onClick={() => onProvideFeedback(workout.workoutId, workout.muscles)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    workout.canSubmitNow
                      ? 'text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400'
                      : 'text-slate-400 bg-slate-800 cursor-not-allowed'
                  }`}
                  disabled={!workout.canSubmitNow}
                  style={{ touchAction: 'manipulation' }}
                >
                  {translations.en.provideFeedback}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// iOS-compatible Toast Component
const ToastContainer: React.FC<{ 
  toasts: Toast[]; 
  onRemove: (id: string) => void;
  onFeedbackClick?: () => void;
}> = ({ toasts, onRemove, onFeedbackClick }) => {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            onClick={() => {
              if (toast.type === 'feedback') {
                onFeedbackClick?.();
                onRemove(toast.id);
              }
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium shadow-lg pointer-events-auto cursor-pointer
              ${toast.type === 'error' ? 'bg-rose-500/90 text-white' : 
                toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 
                toast.type === 'feedback' ? 'bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white border border-amber-400/30' :
                'bg-slate-800/90 text-white border border-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'feedback' && <MessageCircle size={14} />}
              <span>{toast.message}</span>
              {toast.type === 'feedback' && (
                <span className="text-xs opacity-70 ml-1">点击查看</span>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(toast.id);
                }}
                className="opacity-70 hover:opacity-100"
                style={{ touchAction: 'manipulation' }}
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const WeeklyTrainingCoachCard: React.FC<WeeklyTrainingCoachCardProps> = ({
  currentWeekSessions,
  lastWeekReport,
  recoveryState,
  userProfile,
  justCompletedSession,
  className = '',
  onSelectExercise,
  activeWorkout = [],
  routines = [],
  onStartRoutine
}) => {
  const [recommendation, setRecommendation] = useState<CoachRecommendation | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [allReports, setAllReports] = useState<WeeklyReport[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [addedExerciseIds, setAddedExerciseIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dynamicGroups, setDynamicGroups] = useState<Array<{ id: string; name: string; focus: string; exercises: RecommendedExercise[] }>>([]);
  const [groupCounter, setGroupCounter] = useState(0);
  const [isRoutineExpanded, setIsRoutineExpanded] = useState(false);

  // Muscle Feedback State
  const [selectedFeedbackWorkout, setSelectedFeedbackWorkout] = useState<{
    workoutId: string;
    muscles: MuscleGroup[];
  } | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Muscle Feedback Hook
  const { 
    pendingFeedback, 
    isModalOpen, 
    openModal, 
    closeModal, 
    submitFeedback 
  } = useMuscleFeedback();

  // Show feedback prompt when pending feedback exists
  useEffect(() => {
    if (pendingFeedback && !isModalOpen) {
      // Show feedback toast
      const id = Date.now().toString();
      setToasts(prev => [...prev, { 
        id, 
        message: t.feedbackPending, 
        type: 'feedback' 
      }]);
    }
  }, [pendingFeedback, isModalOpen]);

  // Load all reports
  useEffect(() => {
    const loadReports = async () => {
      try {
        const reports = await reportStorage.getAllReports();
        setAllReports(reports);
      } catch (error) {
        console.error('Failed to load reports:', error);
      }
    };
    loadReports();
  }, []);

  // Generate recommendation when data changes
  useEffect(() => {
    const rec = WeeklyTrainingCoachService.getCoachRecommendation(
      currentWeekSessions,
      recoveryState,
      lastWeekReport,
      justCompletedSession,
      allReports
    );
    setRecommendation(rec);
    
    // Initialize dynamic groups and filter out exercises already in active workout
    if (rec?.nextSessionSuggestion?.recommendationGroups) {
      const activeWorkoutIds = new Set(activeWorkout.map(ex => ex.exerciseId));
      
      const initialGroups = rec.nextSessionSuggestion.recommendationGroups.map(group => ({
        ...group,
        exercises: group.exercises.filter(e => !activeWorkoutIds.has(e.exercise.id))
      })).filter(group => group.exercises.length > 0);
      
      setDynamicGroups(initialGroups);
      setGroupCounter(initialGroups.length);
      
      // Initialize addedExerciseIds with active workout exercises
      setAddedExerciseIds(activeWorkoutIds);
    } else {
      setDynamicGroups([]);
      setGroupCounter(0);
      setAddedExerciseIds(new Set(activeWorkout.map(ex => ex.exerciseId)));
    }
    
    setCurrentGroupIndex(0);
  }, [currentWeekSessions, recoveryState, lastWeekReport, justCompletedSession, allReports, activeWorkout]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Handle providing feedback for a specific workout
  const handleProvideFeedback = useCallback((workoutId: string, muscles: MuscleGroup[]) => {
    setSelectedFeedbackWorkout({ workoutId, muscles });
    setIsFeedbackModalOpen(true);
  }, []);

  // Test mode: Show feedback modal with test data
  const handleTestFeedbackModal = useCallback(() => {
    // Create a test workout with Lats (based on user's scenario)
    const testWorkoutId = `test_${Date.now()}`;
    const testMuscles: MuscleGroup[] = [MuscleGroup.LATS, MuscleGroup.TRAPS, MuscleGroup.BICEPS];
    
    // Set as pending feedback
    muscleFeedbackService.setPendingFeedback(testWorkoutId, testMuscles);
    
    // Open modal
    setSelectedFeedbackWorkout({ workoutId: testWorkoutId, muscles: testMuscles });
    setIsFeedbackModalOpen(true);
    
    showToast('测试模式：模拟昨天训练了 Lats', 'info');
  }, [showToast]);

  const t = translations.en;

  // Get all exercise IDs that should be excluded (added + in active workout)
  const getExcludedExerciseIds = useCallback((): Set<string> => {
    const excluded = new Set(addedExerciseIds);
    activeWorkout.forEach(ex => {
      excluded.add(ex.exerciseId);
    });
    return excluded;
  }, [addedExerciseIds, activeWorkout]);

  // Generate a new exercise that's not in the current group and not already added
  const generateNewExercise = useCallback((currentExercises: RecommendedExercise[], muscleGroup: string): RecommendedExercise | null => {
    const excludedIds = getExcludedExerciseIds();
    
    // Also exclude current exercises in the group
    currentExercises.forEach(e => excludedIds.add(e.exercise.id));
    
    // Filter exercises from INITIAL_EXERCISES for this muscle group
    const muscleExercises = INITIAL_EXERCISES.filter((e: Exercise) => 
      e.muscleGroup === muscleGroup && !excludedIds.has(e.id)
    );
    
    if (muscleExercises.length > 0) {
      const randomExercise = muscleExercises[Math.floor(Math.random() * muscleExercises.length)];
      return {
        exercise: randomExercise,
        totalVolume: 0,
        totalSets: 0,
        frequency: 0,
        isNewExercise: true,
        reason: 'New option'
      };
    }
    
    return null;
  }, [getExcludedExerciseIds]);

  // Handle exercise replacement
  const handleReplaceExercise = useCallback((exerciseToReplace: Exercise) => {
    if (!recommendation?.nextSessionSuggestion) return;
    
    const currentGroup = dynamicGroups[currentGroupIndex];
    if (!currentGroup) return;

    const newExercise = generateNewExercise(currentGroup.exercises, exerciseToReplace.muscleGroup);
    
    if (newExercise) {
      // Replace the exercise in the current group
      const updatedGroups = [...dynamicGroups];
      updatedGroups[currentGroupIndex] = {
        ...currentGroup,
        exercises: currentGroup.exercises.map(e => 
          e.exercise.id === exerciseToReplace.id ? newExercise : e
        )
      };
      setDynamicGroups(updatedGroups);
      showToast(t.replaced, 'success');
    } else {
      // If no more exercises for this muscle, try related muscles
      const relatedMuscles: Record<string, string[]> = {
        'Lats': ['Traps', 'Lower Back'],
        'Traps': ['Lats', 'Lower Back'],
        'Lower Back': ['Lats', 'Traps'],
        'Chest': ['Triceps', 'Front Delt'],
        'Shoulders': ['Traps', 'Triceps']
      };
      
      const related = relatedMuscles[exerciseToReplace.muscleGroup];
      if (related) {
        for (const muscle of related) {
          const altExercise = generateNewExercise([], muscle);
          if (altExercise) {
            const updatedGroups = [...dynamicGroups];
            updatedGroups[currentGroupIndex] = {
              ...currentGroup,
              exercises: currentGroup.exercises.map(e => 
                e.exercise.id === exerciseToReplace.id ? altExercise : e
              )
            };
            setDynamicGroups(updatedGroups);
            showToast(`Showing ${muscle} option instead`, 'info');
            return;
          }
        }
      }
      
      showToast('No more options available', 'error');
    }
  }, [dynamicGroups, currentGroupIndex, generateNewExercise, recommendation, showToast, t.replaced]);

  // Generate more groups when user clicks "More Options"
  const generateMoreGroups = useCallback(() => {
    if (!recommendation?.nextSessionSuggestion) return;

    const targetMuscles = recommendation.nextSessionSuggestion.targetMuscles;
    const primaryMuscle = targetMuscles[0];
    
    // Get all available muscles (primary + related + recovered)
    const relatedMuscles: Record<string, string[]> = {
      'Lats': ['Traps', 'Lower Back', 'Biceps'],
      'Traps': ['Lats', 'Lower Back', 'Shoulders'],
      'Lower Back': ['Lats', 'Traps', 'Glutes'],
      'Chest': ['Triceps', 'Front Delt', 'Shoulders'],
      'Shoulders': ['Traps', 'Triceps', 'Chest'],
      'Biceps': ['Lats', 'Back', 'Forearms'],
      'Triceps': ['Chest', 'Shoulders'],
      'Quads': ['Glutes', 'Calves', 'Hamstrings'],
      'Hamstrings': ['Glutes', 'Lower Back', 'Quads'],
      'Glutes': ['Hamstrings', 'Quads', 'Lower Back']
    };
    
    const recoveredMuscles = recoveryState
      .filter(r => r.recoveryPercentage >= 85)
      .map(r => r.muscle);
    
    const allMuscles = [...new Set([
      primaryMuscle,
      ...(relatedMuscles[primaryMuscle] || []),
      ...recoveredMuscles
    ])];

    // Generate a new group with 2 exercises from available muscles
    const newGroupExercises: RecommendedExercise[] = [];
    const excludedIds = getExcludedExerciseIds();
    
    // Track IDs used in this generation to avoid duplicates within the group
    const usedInGeneration = new Set<string>();
    
    for (const muscle of allMuscles) {
      if (newGroupExercises.length >= 2) break;
      
      const availableExercises = INITIAL_EXERCISES.filter((e: Exercise) => 
        e.muscleGroup === muscle && !excludedIds.has(e.id) && !usedInGeneration.has(e.id)
      );
      
      if (availableExercises.length > 0) {
        const randomExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];
        newGroupExercises.push({
          exercise: randomExercise,
          totalVolume: 0,
          totalSets: 0,
          frequency: 0,
          isNewExercise: true,
          reason: muscle === primaryMuscle ? 'More options' : `Related: ${muscle}`
        });
        usedInGeneration.add(randomExercise.id);
      }
    }

    if (newGroupExercises.length > 0) {
      const newGroup = {
        id: `generated-${groupCounter}`,
        name: newGroupExercises.length === 2 && newGroupExercises[0].exercise.muscleGroup !== newGroupExercises[1].exercise.muscleGroup
          ? `${newGroupExercises[0].exercise.muscleGroup} + ${newGroupExercises[1].exercise.muscleGroup}`
          : `${newGroupExercises[0].exercise.muscleGroup} Options`,
        focus: 'Dynamic',
        exercises: newGroupExercises
      };
      
      setDynamicGroups(prev => [...prev, newGroup]);
      setGroupCounter(prev => prev + 1);
      setCurrentGroupIndex(dynamicGroups.length);
    } else {
      // No more exercises available
      showToast('No more exercises available. Try a different muscle group!', 'error');
    }
  }, [dynamicGroups.length, groupCounter, getExcludedExerciseIds, recommendation, recoveryState, showToast]);

  // Handle next group
  const handleNextGroup = useCallback(() => {
    // Always generate new exercises when clicking More Options
    generateMoreGroups();
  }, [generateMoreGroups]);

  // Auto-replace exercise in current group after it's added
  const autoReplaceExercise = useCallback((addedExercise: Exercise) => {
    const currentGroup = dynamicGroups[currentGroupIndex];
    if (!currentGroup) return;

    // Find the index of the added exercise in current group
    const exerciseIndex = currentGroup.exercises.findIndex(
      e => e.exercise.id === addedExercise.id
    );
    
    if (exerciseIndex === -1) return;

    // Delay the replacement to allow user to see the "ADDED" state
    setTimeout(() => {
      // Generate a new exercise for the same muscle group
      const newExercise = generateNewExercise(
        currentGroup.exercises.filter(e => e.exercise.id !== addedExercise.id),
        addedExercise.muscleGroup
      );

      if (newExercise) {
        // Replace the added exercise with the new one
        const updatedGroups = [...dynamicGroups];
        updatedGroups[currentGroupIndex] = {
          ...currentGroup,
          exercises: currentGroup.exercises.map((e, idx) => 
            idx === exerciseIndex ? newExercise : e
          )
        };
        setDynamicGroups(updatedGroups);
      }
    }, 1500); // 1.5 second delay for smooth transition
  }, [dynamicGroups, currentGroupIndex, generateNewExercise]);

  // Handle exercise selection
  const handleExerciseSelect = useCallback((exercise: Exercise) => {
    if (addedExerciseIds.has(exercise.id)) {
      showToast(t.alreadyAdded, 'error');
      return;
    }

    // Check if exercise is already in active workout
    const isInActiveWorkout = activeWorkout.some(ex => ex.exerciseId === exercise.id);
    if (isInActiveWorkout) {
      showToast(t.alreadyAdded, 'error');
      return;
    }

    setAddedExerciseIds(prev => new Set([...prev, exercise.id]));
    onSelectExercise?.(exercise);
    
    // Auto-replace with a new exercise in the same position
    autoReplaceExercise(exercise);
  }, [addedExerciseIds, activeWorkout, onSelectExercise, showToast, t.alreadyAdded, autoReplaceExercise]);

  // Handle adding all exercises from current group (must be before early return)
  const handleAddAllExercises = useCallback(() => {
    const group = dynamicGroups[currentGroupIndex];
    if (!group) return;
    
    let addedCount = 0;
    const exercisesToAdd: Exercise[] = [];
    
    // Collect all exercises that can be added
    for (const rec of group.exercises) {
      if (addedExerciseIds.has(rec.exercise.id)) continue;
      if (activeWorkout.some(ex => ex.exerciseId === rec.exercise.id)) continue;
      
      exercisesToAdd.push(rec.exercise);
    }
    
    // Add all collected exercises
    for (const exercise of exercisesToAdd) {
      setAddedExerciseIds(prev => new Set([...prev, exercise.id]));
      onSelectExercise?.(exercise);
      addedCount++;
    }
    
    if (addedCount > 0) {
      showToast(`${addedCount} exercises added to workout`, 'success');
      
      // Auto-replace all added exercises after a delay
      setTimeout(() => {
        for (const exercise of exercisesToAdd) {
          autoReplaceExercise(exercise);
        }
      }, 1500);
    } else {
      showToast(t.alreadyAdded, 'info');
    }
  }, [dynamicGroups, currentGroupIndex, addedExerciseIds, activeWorkout, onSelectExercise, showToast, t.alreadyAdded, autoReplaceExercise]);

  // Find best matching routine based on target muscles
  const findBestRoutine = useCallback((targetMuscles: string[]): Routine | null => {
    if (!routines || routines.length === 0 || targetMuscles.length === 0) return null;
    
    let bestRoutine: Routine | null = null;
    let bestScore = 0;
    
    for (const routine of routines) {
      if (!routine.exercises || routine.exercises.length === 0) continue;
      
      // Calculate how many target muscles this routine covers
      const routineMuscles = new Set<string>(routine.exercises.map(e => e.muscleGroup).filter(Boolean) as string[]);
      let matchScore = 0;
      
      for (const muscle of targetMuscles) {
        if (routineMuscles.has(muscle)) {
          matchScore += 10; // Primary match
        }
        // Check synergy muscles
        const synergies: Record<string, string[]> = {
          'Lats': ['Traps', 'Lower Back'],
          'Traps': ['Lats', 'Lower Back'],
          'Lower Back': ['Lats', 'Traps'],
          'Chest': ['Triceps', 'Shoulders'],
          'Shoulders': ['Traps', 'Triceps'],
          'Quads': ['Glutes', 'Hamstrings'],
          'Hamstrings': ['Glutes', 'Quads']
        };
        const related = synergies[muscle] || [];
        for (const relatedMuscle of related) {
          if (routineMuscles.has(relatedMuscle)) {
            matchScore += 5; // Synergy match
          }
        }
      }
      
      // Bonus for appropriate size (6-10 exercises is ideal for a session)
      const exerciseCount = routine.exercises.length;
      if (exerciseCount >= 6 && exerciseCount <= 10) {
        matchScore += 5;
      }
      
      if (matchScore > bestScore) {
        bestScore = matchScore;
        bestRoutine = routine;
      }
    }
    
    return bestRoutine;
  }, [routines]);

  if (!recommendation) {
    return (
      <div className={`bg-slate-900 rounded-2xl border border-slate-800 p-4 ${className}`}>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
            <div className="h-3 bg-slate-800 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const { insight, currentProgress, nextSessionSuggestion } = recommendation;
  const { vTaperScore, symmetryScore, weakPoints } = 
    WeeklyTrainingCoachService.analyzePhysique?.(currentProgress.muscleDistribution, currentProgress.totalSets, recoveryState) || 
    { vTaperScore: 0, symmetryScore: 0, weakPoints: [], strengths: [] };

  const currentGroup = dynamicGroups[currentGroupIndex];

  return (
    <>
      {/* Toast Notifications */}
      <ToastContainer 
        toasts={toasts} 
        onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
        onFeedbackClick={openModal}
      />

      {/* Muscle Feedback Modal - Auto-detected pending feedback */}
      {pendingFeedback && (
        <MuscleFeedbackModal
          isOpen={isModalOpen}
          onClose={closeModal}
          workoutId={pendingFeedback.workoutId}
          workoutDate={pendingFeedback.workoutDate}
          muscles={pendingFeedback.muscles}
          onFeedbackSubmitted={(feedback) => {
            submitFeedback(feedback);
            showToast('反馈已记录，AI会优化你的训练计划', 'success');
          }}
        />
      )}

      {/* Muscle Feedback Modal - Manual selection */}
      {selectedFeedbackWorkout && (
        <MuscleFeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => {
            setIsFeedbackModalOpen(false);
            setSelectedFeedbackWorkout(null);
          }}
          workoutId={selectedFeedbackWorkout.workoutId}
          workoutDate={Date.now() - 24 * 60 * 60 * 1000} // Simulate yesterday
          muscles={selectedFeedbackWorkout.muscles}
          onFeedbackSubmitted={(feedback) => {
            setIsFeedbackModalOpen(false);
            setSelectedFeedbackWorkout(null);
            showToast('反馈已记录，AI会优化你的训练计划', 'success');
          }}
        />
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 overflow-hidden ${className}`}
      >
        {/* Header - Compact - Dark Style */}
        <div className="p-4 border-b border-slate-800/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                <Target size={16} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">{t.title}</h3>
                <p className="text-[10px] text-slate-500">{insight.title}</p>
              </div>
            </div>
            <PriorityBadge priority={insight.priority} />
          </div>
          
          <p className="text-slate-300 text-sm leading-relaxed">
            {insight.message}
          </p>
        </div>

        {/* Key Metrics - Horizontal */}
        <div className="px-4 py-3 border-b border-slate-800/50">
          <div className="grid grid-cols-5 gap-2">
            <div className="text-center">
              <p className="text-lg font-bold text-white">{currentProgress.daysTrained}</p>
              <p className="text-[10px] text-slate-500">{t.days}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{currentProgress.totalSets}</p>
              <p className="text-[10px] text-slate-500">{t.sets}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-cyan-400">{currentProgress.readyMuscles.length}</p>
              <p className="text-[10px] text-slate-500">{t.ready}</p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold ${vTaperScore >= 7 ? 'text-emerald-400' : vTaperScore >= 5 ? 'text-amber-400' : 'text-rose-400'}`}>
                {vTaperScore.toFixed(1)}
              </p>
              <p className="text-[10px] text-slate-500">{t.vTaper}</p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold ${symmetryScore >= 7 ? 'text-emerald-400' : symmetryScore >= 5 ? 'text-amber-400' : 'text-rose-400'}`}>
                {symmetryScore}
              </p>
              <p className="text-[10px] text-slate-500">{t.symmetry}</p>
            </div>
          </div>
        </div>

        {/* Muscle Feedback Section - Shows pending feedbacks */}
        <MuscleFeedbackSection
          sessions={currentWeekSessions}
          onProvideFeedback={handleProvideFeedback}
          onTestModal={handleTestFeedbackModal}
        />

        {/* Priority Focus & Next Session - Combined Compact Section */}
        <div className="border-b border-slate-800/50">
          {/* Weak Points */}
          {weakPoints.length > 0 && (
            <div className="px-4 py-2 border-b border-slate-800/30">
              <div className="flex items-center gap-2">
                <AlertCircle size={12} className="text-amber-400 flex-shrink-0" />
                <span className="text-xs font-medium text-amber-400">{t.weakPoints}:</span>
                <div className="flex flex-wrap gap-1">
                  {weakPoints.slice(0, 3).map((wp, i) => (
                    <span key={i} className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] rounded border border-amber-500/20">
                      {wp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Next Session with Exercise Cards */}
          {nextSessionSuggestion && (
            <div className="p-4">
              {/* Group Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap size={12} className="text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-400">{t.nextSession}</span>
                  {currentGroup && (
                    <span className="text-[10px] text-slate-500">
                      {currentGroup.name}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-1">
                  {nextSessionSuggestion.targetMuscles.map((m, i) => (
                    <span key={i} className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] rounded">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Exercise Cards - Individual Recommendations */}
              <div className="relative">
                {currentGroup && currentGroup.exercises.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <AnimatePresence>
                      {currentGroup.exercises.map((rec, index) => (
                        <RecommendedExerciseCard
                          key={`${currentGroup.id}-${rec.exercise.id}`}
                          exercise={rec.exercise}
                          frequency={rec.frequency}
                          isNewExercise={rec.isNewExercise}
                          reason={rec.reason}
                          onSelect={handleExerciseSelect}
                          onReplace={handleReplaceExercise}
                          isAdded={addedExerciseIds.has(rec.exercise.id)}
                          index={index}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-xs text-slate-500 mb-2">{t.allExercisesAdded}</p>
                    <p className="text-[10px] text-slate-600">Click More Options for new suggestions</p>
                  </div>
                )}
                {currentGroup && currentGroup.exercises.length > 0 && (
                  <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none" />
                )}
              </div>

              {/* Add All + More Options Buttons */}
              <div className="flex gap-2 mt-3">
                {/* Add All Button */}
                {currentGroup && currentGroup.exercises.length > 0 && (
                  <button
                    onClick={handleAddAllExercises}
                    className="flex-1 py-2 flex items-center justify-center gap-2 text-xs
                             text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20
                             rounded-lg transition-all active:scale-95 border border-cyan-500/20"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <Plus size={12} />
                    {t.addAll}
                  </button>
                )}
                
                {/* More Options Button */}
                <button
                  onClick={handleNextGroup}
                  className="flex-1 py-2 flex items-center justify-center gap-2 text-xs 
                           text-slate-400 hover:text-cyan-400 bg-slate-800/50 hover:bg-slate-800 
                           rounded-lg transition-all active:scale-95"
                  style={{ touchAction: 'manipulation' }}
                >
                  <RotateCcw size={12} />
                  {t.nextGroup}
                  <ChevronRight size={12} />
                </button>
              </div>

              {/* Recommended Routine Card - Matching RoutineBuilder Style */}
              {(() => {
                const bestRoutine = findBestRoutine(nextSessionSuggestion.targetMuscles);
                if (!bestRoutine) return null;
                
                const routineMuscles = [...new Set(bestRoutine.exercises.map(e => e.muscleGroup).filter(Boolean))];
                const matchingMuscles = routineMuscles.filter(m => nextSessionSuggestion.targetMuscles.includes(m));
                
                return (
                  <div className="mt-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300 shadow-lg backdrop-blur-sm">
                    {/* Header - Clickable to expand */}
                    <div 
                      className="p-4 flex justify-between items-center cursor-pointer"
                      onClick={() => setIsRoutineExpanded(!isRoutineExpanded)}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <List size={14} className="text-indigo-400 flex-shrink-0" />
                          <span className="text-xs font-bold text-indigo-400">Recommended Routine</span>
                        </div>
                        <h4 className="font-bold text-white text-base mb-1 truncate">{bestRoutine.name}</h4>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-slate-400 text-xs">{bestRoutine.exercises.length} Exercises</span>
                          {matchingMuscles.length > 0 && (
                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] rounded">
                              Matches {matchingMuscles.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isRoutineExpanded ? (
                          <ChevronUp size={20} className="text-indigo-400" />
                        ) : (
                          <ChevronDown size={20} className="text-slate-400" />
                        )}
                      </div>
                    </div>
                    
                    {/* Expanded Exercise List - Static Preview */}
                    {isRoutineExpanded && (
                      <div className="px-4 pb-4 space-y-3">
                        {bestRoutine.exercises.map((exercise, index) => (
                          <div
                            key={`${exercise.id}-${index}`}
                            className="flex items-center gap-3 bg-gradient-to-r from-slate-800/50 to-slate-900/50 p-3 rounded-xl border border-slate-700/50"
                          >
                            {/* Video/GIF Thumbnail - Static */}
                            {(exercise.gifUrl || exercise.videoUrl) && (
                              <div className="w-16 h-16 flex-shrink-0 bg-slate-800 rounded-xl overflow-hidden border border-slate-700/50">
                                {exercise.gifUrl ? (
                                  <img
                                    src={exercise.gifUrl}
                                    alt={exercise.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : exercise.videoUrl ? (
                                  <img
                                    src={exercise.videoUrl}
                                    alt={exercise.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : null}
                              </div>
                            )}
                            
                            {/* Exercise Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">
                                {exercise.nameZh || exercise.name}
                              </p>
                              <p className="text-slate-400 text-xs mt-1">
                                {exercise.muscleGroup}
                                {exercise.equipment && ` • ${exercise.equipment}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Start Routine Button */}
                    <div className="px-4 pb-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartRoutine?.(bestRoutine);
                        }}
                        className="w-full py-3 flex items-center justify-center gap-2 text-sm
                                 text-white font-bold bg-gradient-to-r from-cyan-600 to-blue-600
                                 hover:from-cyan-500 hover:to-blue-500
                                 rounded-xl transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
                        style={{ touchAction: 'manipulation' }}
                      >
                        <Play size={16} fill="currentColor" />
                        Start This Routine
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Session Info */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/30">
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Dumbbell size={10} />
                  <span>{nextSessionSuggestion.estimatedSets} sets</span>
                </div>
                <span className="text-[10px] text-slate-500 capitalize">
                  {nextSessionSuggestion.focus} focus
                </span>
              </div>

              {/* Token Usage - Dark Style */}
              {recommendation.tokenUsage && (
                <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm mt-3">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-slate-700 text-cyan-400">
                          <Cpu size={14} />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-white">
                              {recommendation.tokenUsage.total_tokens.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-500">tokens</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                            <span>Input: {(recommendation.tokenUsage.prompt_tokens / 1000).toFixed(1)}k</span>
                            <span>•</span>
                            <span>Output: {(recommendation.tokenUsage.completion_tokens / 1000).toFixed(1)}k</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {recommendation.estimatedCost && (
                          <div className="text-base font-bold text-cyan-400">
                            ¥{recommendation.estimatedCost.totalCost < 0.01 ? '<0.01' : recommendation.estimatedCost.totalCost.toFixed(2)}
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-1 text-[9px] text-slate-500">
                          <Sparkles size={10} />
                          <span>AI Powered</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expandable Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-b border-slate-800/50"
            >
              <div className="px-4 py-3 space-y-3">
                {insight.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                      <p className="text-xs text-slate-400 leading-relaxed">{rec}</p>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-3 flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-400 transition-colors"
          style={{ touchAction: 'manipulation' }}
        >
          {expanded ? t.hideDetails : t.viewDetails}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </motion.div>
    </>
  );
};

export default WeeklyTrainingCoachCard;
