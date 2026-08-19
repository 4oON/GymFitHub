
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // 添加导航hook
import { useAuth } from '@/context/AuthContext'; // 添加认证 hook
import WorkoutSyncService from '@/services/WorkoutSyncService';
import RoutineSyncService from '@/services/RoutineSyncService';
import RecoveryCalculationService from '@/services/RecoveryCalculationService';
import WorkoutDurationCalculator from '@/utils/WorkoutDurationCalculator';
import apiClient from '@/services/apiClient';
import { SHOULDER_ROUTINE_1, hasPredefinedRoutine } from '@/data/predefined-routines';
import {
  LayoutGrid,
  Dumbbell,
  LineChart,
  Sparkles,
  X,
  Loader2,
  Bell,
  User,
  Plus,
  Play,
  Trash2,
  Save,
  CheckCircle2,
  Battery,
  Zap,
  FileImage,
  List,
  LogOut,
  Bug
} from 'lucide-react';
import ConfirmDialog from '@/shared/components/ui/ConfirmDialog';
import { useHealthSyncPrompt } from '@/hooks/useHealthSyncPrompt';
import type { ActiveExercise, WorkoutSet, Exercise, WorkoutSession, RecoveryStatus, TimerState, UserProfile, Routine, BodyMetricsHistory } from '@/shared/types';
import { AppScreen, MuscleGroup } from '@/shared/types';
import { Haptics } from '@capacitor/haptics';
import GlobalTimer from '@/features/workout/components/GlobalTimer';
import { INITIAL_EXERCISES } from '@/shared/constants/initial_exercises';
import { COMPREHENSIVE_EXERCISES_PROMISE } from '@/features/exercise/data/comprehensive_exercises';
import { ExerciseFrequencyService } from '@/features/exercise/services/ExerciseFrequencyService';
import { normalizeEquipment } from '@/features/exercise/utils/equipmentUtils';
import ExerciseSelector from '@/features/exercise/components/ExerciseSelector';
import WorkoutLogger from '@/features/workout/components/WorkoutLogger';
import ProgressView from '@/features/report/components/ProgressView';
import RoutineBuilder from '@/features/routine/components/RoutineBuilder';
import RoutineCreator from '@/features/routine/components/RoutineCreator';
import ProfileSetup from '@/features/profile/components/ProfileSetup';
import ProfileEditorModal from '@/features/profile/components/ProfileEditorModal';
import ProfileView from '@/features/profile/components/ProfileView';
import { getExerciseTip, generateWorkoutReport } from '@/features/ai/services/geminiService';
import { generateUUID, getCurrentTimestamp } from '@/shared/utils/uuid';
import { autoGenerateWeeklyReport, checkForNewWeek, getWeekInfo } from '@/features/report/services/WeeklyReportService';
import WeeklyReportViewer from "@/features/report/components/WeeklyReportViewer";
import WeeklySummaryCard from "@/features/report/components/WeeklySummaryCard";
import WeeklySummaryModal from "@/features/report/components/WeeklySummaryModal";
import WeeklyTrainingCoachCardWithAI from "@/features/report/components/WeeklyTrainingCoachCardWithAI";
import type { WeeklyReport } from "@/shared/types";
import WeeklySummaryService from "@/features/report/services/WeeklySummaryService";
import { usePreventBackGesture } from "@/hooks/usePreventBackGesture";
import { useActiveWorkoutPersistence } from "@/hooks/useActiveWorkoutPersistence";
import { useDailyHealthSync } from "@/hooks/useDailyHealthSync";
import { iOSStorage, safeParseJSON, safeSaveJSON } from "@/services/iOSStorageService";
import { WorkoutTimerService } from '@/services/WorkoutTimerService';

// New modular components
import ExerciseLibraryView from '@/features/exercise/components/ExerciseLibraryView';
import InProgressWorkout from '@/features/workout/components/InProgressWorkout';
import HeroExerciseCard from '@/features/exercise/components/HeroExerciseCard';
import MuscleAnatomyViewer from '@/features/anatomy/components/MuscleAnatomyViewer';
import AdaptiveHeightContainer from '@/shared/components/layout/AdaptiveHeightContainer';
import CollapsibleSection from '@/shared/components/layout/CollapsibleSection';
import AIRecommendationPanel from '@/features/ai/components/AIRecommendationPanel';
import EnhancedAIRecommendationPanel from '@/features/ai/components/EnhancedAIRecommendationPanel';
import HistoryBasedAIRecommendationPanel from '@/features/ai/components/HistoryBasedAIRecommendationPanel';
import { AIControlBar } from '@/features/ai';
import AIRecommendationService from '@/features/ai/services/AIRecommendationService';
import EnhancedAIRecommendationService from '@/features/ai/services/EnhancedAIRecommendationService';
import EnhancedAIRecommendationServiceV2 from '@/features/ai/services/EnhancedAIRecommendationServiceV2';
import type { WorkoutRecommendation } from '@/features/ai/services/AIRecommendationService';
import type { EnhancedWorkoutRecommendation } from '@/features/ai/services/EnhancedAIRecommendationService';
import type { HistoryBasedRecommendation } from '@/features/ai/services/EnhancedAIRecommendationServiceV2';



export const MainApp: React.FC = () => {
  const navigate = useNavigate(); // 初始化导航
  const { user, isAuthenticated } = useAuth(); // 获取认证状态
  const { showPrompt: showHealthPrompt, onConfirm: onHealthConfirm, onCancel: onHealthCancel } = useHealthSyncPrompt();

  // 延迟 2 秒执行每日 Health 同步，避免阻塞首屏渲染
  const { lastSampleDates, staleMetrics } = useDailyHealthSync({ delayMs: 2000 });

  // 48 小时无 Health 数据更新提醒（只提示一次）
  const staleNotifiedRef = React.useRef(false);
  useEffect(() => {
    if (staleMetrics.length > 0 && !staleNotifiedRef.current) {
      staleNotifiedRef.current = true;
      setNotification({
        message: `Health data reminder: no ${staleMetrics.join('/')} update in the past 48 hours`,
        visible: true,
      });
      setTimeout(() => setNotification(null), 5000);
    }
  }, [staleMetrics]);

  // Use iOS-compatible storage
  const safeParse = <T,>(key: string, fallback: T): T => {
    return safeParseJSON(key, fallback);
  };

  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.HOME);
  const [activeTab, setActiveTab] = useState('workout');
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showExerciseLibraryView, setShowExerciseLibraryView] = useState(false);
  const [showMuscleSelector, setShowMuscleSelector] = useState(false);
  const [selectedMuscleForWorkout, setSelectedMuscleForWorkout] = useState<MuscleGroup | null>(null);
  const [bodyFacing, setBodyFacing] = useState<'front' | 'back'>('front');
  const [routines, setRoutines] = useState<Routine[]>(() => safeParse('zenfit_routines', []));
  const [showRoutineCreator, setShowRoutineCreator] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [routineName, setRoutineName] = useState('');
  const [selectedRoutineExercises, setSelectedRoutineExercises] = useState<Exercise[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // 使用持久化的active workout状态
  const {
    activeWorkout,
    setActiveWorkout,
    workoutStartTime,
    setWorkoutStartTime,
    hasRestoredData,
    clearPersistedWorkout,
    dismissRestoredNotification
  } = useActiveWorkoutPersistence();
  
  // 阻止后退手势（当active workout有内容时）
  usePreventBackGesture(activeWorkout.length > 0);
  
  const [pendingRoutineExercise, setPendingRoutineExercise] = useState<Exercise | null>(null);
  const [showAddToRoutineModal, setShowAddToRoutineModal] = useState(false);

  // New state for modular components
  const [showInProgressWorkout, setShowInProgressWorkout] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<WorkoutRecommendation[]>([]);
  const [enhancedAiRecommendations, setEnhancedAiRecommendations] = useState<EnhancedWorkoutRecommendation[]>([]);
  const [historyBasedRecommendations, setHistoryBasedRecommendations] = useState<HistoryBasedRecommendation[]>([]);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [showHistoryBasedAI, setShowHistoryBasedAI] = useState(false);
  const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<string>>(new Set());
  const [acceptedRecommendations, setAcceptedRecommendations] = useState<Set<string>>(new Set());

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    variant: 'warning'
  });

  // --- EXERCISE LIBRARY STATE ---
  const [comprehensiveExercises, setComprehensiveExercises] = useState<Exercise[]>(() => safeParse('comprehensiveExercises', []));

  // Load comprehensive exercises asynchronously
  useEffect(() => {
    COMPREHENSIVE_EXERCISES_PROMISE.then(exercises => {
      if (exercises.length > 0) {
        setComprehensiveExercises(exercises);
        console.log('✅ Loaded comprehensive exercises:', exercises.length);
      }
    }).catch(error => {
      console.error('❌ Failed to load comprehensive exercises:', error);
    });
  }, []);

  // 原生计时器事件订阅：Apple Watch 点"结束休息" → 同步 Web UI
  useEffect(() => {
    if (!WorkoutTimerService.isNative) return;

    // 请求通知权限（后台提醒）
    WorkoutTimerService.requestPermission();

    const unsubFinish = WorkoutTimerService.onFinish(({ exerciseId }) => {
      setTimers(prev => {
        const next = { ...prev };
        if (next[exerciseId]) {
          delete next[exerciseId];
          // 触发 finishedTimerQueue 让 UI 知道休息结束，可以进入下一组
          setFinishedTimerQueue(prevQueue => [...prevQueue, exerciseId]);
        }
        return next;
      });
    });

    const unsubTick = WorkoutTimerService.onTick(({ exerciseId, remaining }) => {
      setTimers(prev => {
        const current = prev[exerciseId];
        if (!current) return prev;
        // 用原生时间戳校准 Web 侧剩余时间（后台时 Web 计时会漂移）
        const targetTime = Date.now() + remaining * 1000;
        if (Math.abs(targetTime - current.targetTime) > 2000) {
          return { ...prev, [exerciseId]: { ...current, targetTime } };
        }
        return prev;
      });
    });

    return () => { unsubFinish(); unsubTick(); };
  }, []);

  // Load weekly reports data for Training Coach
  useEffect(() => {
    const loadWeeklyReports = async () => {
      try {
        const reports = await WeeklySummaryService.getWeeklyReportsData();
        setWeeklyReports(reports);
      } catch (error) {
        console.error('Failed to load weekly reports:', error);
      }
    };
    loadWeeklyReports();
  }, []);

  // Helper: Filter exercises by muscle_ids
  const filterByMuscleId = (exercises: Exercise[], targetMuscleIds: string[]): Exercise[] => {
    return exercises.filter(ex => {
      if (!ex.muscle_ids || ex.muscle_ids.length === 0) return false;
      return targetMuscleIds.some(targetId =>
        ex.muscle_ids!.some(muscleId =>
          muscleId.toLowerCase().includes(targetId.toLowerCase())
        )
      );
    });
  };

  // Helper: Select exercises with equipment diversity
  const selectWithEquipmentDiversity = (
    exercises: Exercise[],
    count: number,
    minEquipmentTypes: number
  ): Exercise[] => {
    const selected: Exercise[] = [];
    const equipmentUsed = new Set<string>();
    const priority = ['Barbell', 'Dumbbell', 'Machine', 'Bodyweight', 'Band', 'Smith'];

    // First: ensure equipment diversity
    for (const equipment of priority) {
      if (equipmentUsed.size >= minEquipmentTypes) break;
      const withEquipment = exercises.filter(e =>
        e.equipment === equipment && !selected.includes(e)
      );
      if (withEquipment.length > 0) {
        selected.push(...withEquipment.slice(0, 2));
        equipmentUsed.add(equipment);
      }
    }

    // Second: fill remaining slots
    const remaining = exercises.filter(e => !selected.includes(e));
    selected.push(...remaining.slice(0, count - selected.length));
    return selected.slice(0, count);
  };

  const [commonExercises, setCommonExercises] = useState<Exercise[]>(() => {
    const parsed = safeParse<Exercise[]>('commonExercises', []);
    if (parsed.length > 0) return parsed;

    // Use INITIAL_EXERCISES from constants.ts directly
    console.log(`✅ Initialized ${INITIAL_EXERCISES.length} exercises from INITIAL_EXERCISES`);
    return INITIAL_EXERCISES;
  });

  // Unified exercise library: merges curated seed, cached common list, and comprehensive data.
  // Normalizes equipment vocabulary and deduplicates by id, preferring richer metadata.
  const unifiedExerciseLibrary = useMemo<Exercise[]>(() => {
    const all = [...INITIAL_EXERCISES, ...commonExercises, ...comprehensiveExercises];
    const byId = new Map<string, Exercise>();

    all.forEach(ex => {
      const normalized: Exercise = {
        ...ex,
        equipment: normalizeEquipment(ex.equipment)
      };

      const existing = byId.get(normalized.id);
      if (!existing) {
        byId.set(normalized.id, normalized);
        return;
      }

      // Merge richer metadata without mutating original objects.
      byId.set(normalized.id, {
        ...existing,
        ...normalized,
        equipment: normalized.equipment || existing.equipment,
        muscle_ids: normalized.muscle_ids?.length
          ? normalized.muscle_ids
          : existing.muscle_ids,
        difficulty: normalized.difficulty || existing.difficulty,
        mechanic: normalized.mechanic || existing.mechanic,
        videoUrl: normalized.videoUrl || existing.videoUrl,
      });
    });

    return Array.from(byId.values());
  }, [commonExercises, comprehensiveExercises]);

  // --- USER PROFILE STATE ---
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = safeParseJSON<UserProfile>('zenfit_user_profile', { weight: 70, unit: 'kg' as const });
    console.log('📋 Initial userProfile loaded:', saved);
    return saved;
  });
  const [showProfileSetup, setShowProfileSetup] = useState<boolean>(false);

  useEffect(() => {
    console.log('💾 Saving userProfile:', userProfile);
    safeSaveJSON('zenfit_user_profile', userProfile);
  }, [userProfile]);

  // 🆕 iOS FIX: Force reload profile from backend on mount (iOS WebView loses localStorage)
  useEffect(() => {
    const reloadProfileFromBackend = async () => {
      if (!isAuthenticated || !user?.id) return;
      
      try {
        console.log('[iOS Fix] Force reloading profile from backend...');
        const backendProfile = await apiClient.getProfile();
        console.log('[iOS Fix] Backend profile:', backendProfile);
        
        if (backendProfile) {
          const backendWeight = backendProfile.weight;
          const backendBodyFat = (backendProfile as any).bodyFatPercent;
          if (
            (backendWeight && backendWeight > 0 && backendWeight !== userProfile.weight) ||
            (backendBodyFat && backendBodyFat > 0 && backendBodyFat !== userProfile.bodyFatPercentage)
          ) {
            console.log(`[iOS Fix] Updating weight/bodyFat from backend`);
            setUserProfile(prev => ({
              ...prev,
              weight: backendWeight && backendWeight > 0 ? Math.round(Number(backendWeight) * 10) / 10 : prev.weight,
              age: backendProfile.age ?? prev.age,
              gender: (backendProfile.gender as UserProfile['gender']) ?? prev.gender,
              bodyFatPercentage: backendBodyFat && backendBodyFat > 0
                ? Math.round(Number(backendBodyFat) * 10) / 10
                : prev.bodyFatPercentage,
            }));
          }
        }
      } catch (err) {
        console.error('[iOS Fix] Failed to reload profile:', err);
      }
    };
    
    reloadProfileFromBackend();
  }, []); // Run once on mount

  // Body Metrics History
  const [bodyMetricsHistory, setBodyMetricsHistory] = useState<BodyMetricsHistory[]>(() =>
    safeParse('zenfit_body_metrics_history', [])
  );

  useEffect(() => {
    safeSaveJSON('zenfit_body_metrics_history', bodyMetricsHistory);
  }, [bodyMetricsHistory]);

  const saveBodyMetricsToHistory = (profile: UserProfile) => {
    const newEntry: BodyMetricsHistory = {
      id: generateUUID(),
      timestamp: getCurrentTimestamp(),
      weight: profile.weight,
      unit: profile.unit,
      bodyFatPercentage: profile.bodyFatPercentage
    };
    setBodyMetricsHistory(prev => [newEntry, ...prev]);
  };

  // 🆕 从后端加载 Routines - 监听用户认证状态
  useEffect(() => {
    const loadRoutinesFromBackend = async () => {
      // ✅ 第一步：确保用户已认证且有有效token
      if (!isAuthenticated || !user) {
        console.log('⏸️ User not authenticated, skipping routine load');
        // 只加载本地数据
        const localRoutines = safeParse<Routine[]>('zenfit_routines', []);
        setRoutines(localRoutines);
        return;
      }

      // ✅ 第二步：确保有有效的 token
      const token = apiClient.getToken();
      if (!token) {
        console.log('⏸️ No auth token found, skipping routine load');
        // 只加载本地数据
        const localRoutines = safeParse<Routine[]>('zenfit_routines', []);
        setRoutines(localRoutines);
        return;
      }

      // ✅ 第三步：确保 exercise 库已加载
      if (unifiedExerciseLibrary.length === 0) {
        console.log('⏸️ Exercise library not loaded yet, skipping routine load');
        return;
      }

      try {
        console.log(`📥 Loading routines for user: ${user.email}`);

        // 并行加载本地和远程 Routines
        const localRoutines = safeParse<Routine[]>('zenfit_routines', []);
        const remoteRoutines = await RoutineSyncService.loadRoutinesFromBackend(unifiedExerciseLibrary);

        // 合并数据
        let mergedRoutines = RoutineSyncService.mergeRoutineData(localRoutines, remoteRoutines);
        console.log(`✅ Loaded ${remoteRoutines.length} remote + ${localRoutines.length} local = ${mergedRoutines.length} total routines`);

        // 🆕 自动添加预定义的肩部训练组1（如果用户还没有）
        if (!hasPredefinedRoutine(mergedRoutines, SHOULDER_ROUTINE_1.name)) {
          console.log('📋 Adding predefined Shoulder Routine 1...');
          const shoulderRoutine: Routine = {
            ...SHOULDER_ROUTINE_1,
            id: generateUUID(),
            createdAt: getCurrentTimestamp()
          };

          // ✅ 只在用户已认证时同步到后端
          if (isAuthenticated && user && apiClient.getToken()) {
            try {
              const backendId = await RoutineSyncService.syncRoutineToBackend(shoulderRoutine);
              if (backendId) {
                shoulderRoutine.id = backendId;
                console.log('✅ Shoulder Routine 1 synced to backend!');
              }
            } catch (error) {
              console.error('❌ Failed to sync Shoulder Routine 1:', error);
            }
          } else {
            console.log('⏸️ User not authenticated, Shoulder Routine 1 will be local only');
          }

          mergedRoutines = [shoulderRoutine, ...mergedRoutines];
          console.log('✅ Shoulder Routine 1 added successfully!');
        }

        setRoutines(mergedRoutines);

        // 🆕 强制更新localStorage，清除旧的重复数据
        safeSaveJSON('zenfit_routines', mergedRoutines);
        console.log('💾 Updated localStorage with merged routines');

        // ✅ 只在用户已认证时同步本地未同步的 Routines 到后端
        if (isAuthenticated && user && apiClient.getToken()) {
          // 同步本地未同步的 Routines 到后端（只同步非UUID格式的本地ID）
          const localRoutinesToSync = localRoutines.filter(routine => {
            const isLocalId = !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(routine.id);
            return isLocalId;
          });

          if (localRoutinesToSync.length > 0) {
            console.log(`🔄 Found ${localRoutinesToSync.length} local routines to sync...`);
            try {
              await RoutineSyncService.syncLocalRoutinesToBackend(localRoutinesToSync);
            } catch (syncError) {
              console.error('⚠️ Failed to sync local routines, will retry later:', syncError);
              // 不阻塞主流程，继续使用合并后的数据
            }
          }
        } else {
          console.log('⏸️ User not authenticated, skipping local routine sync');
        }
      } catch (error) {
        console.error('❌ Failed to load routines from backend:', error);
        // 失败时使用本地数据
        const localRoutines = safeParse<Routine[]>('zenfit_routines', []);
        setRoutines(localRoutines);
      }
    };

    loadRoutinesFromBackend();
  }, [isAuthenticated, user?.id, unifiedExerciseLibrary.length]);

  // 保存 Routines 到 localStorage（作为备份）
  useEffect(() => {
    safeSaveJSON('zenfit_routines', routines);
  }, [routines]);

  const handleUpdateProfile = (newProfile: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...newProfile }));
    setModalContent(null);
  };

  const handleCompleteProfileSetup = (profile: UserProfile) => {
    setUserProfile(profile);
    setShowProfileSetup(false);
  };

  // Profile Editor Modal State
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showProfileView, setShowProfileView] = useState(false);

  // Weekly Report Viewer State
  const [showWeeklyReportViewer, setShowWeeklyReportViewer] = useState(false);
  const [showWeeklySummaryModal, setShowWeeklySummaryModal] = useState(false);

  // Weekly Training Coach State
  const [weeklyReports, setWeeklyReports] = useState<{ current: WeeklyReport | null; previous: WeeklyReport | null }>({ current: null, previous: null });

  // Debug Panel State (iOS debugging)
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Weekly Report Notification State
  const [weeklyReportNotification, setWeeklyReportNotification] = useState<{
    show: boolean;
    weekNumber: number;
    year: number;
  } | null>(null);

  // Debug Panel: Capture console errors for iOS debugging
  useEffect(() => {
    if (import.meta.env.DEV) return; // Only in production builds
    
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args: any[]) => {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      setDebugLogs(prev => [...prev.slice(-19), `❌ ${new Date().toLocaleTimeString()}: ${message}`]);
      originalError.apply(console, args);
    };
    
    console.warn = (...args: any[]) => {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      setDebugLogs(prev => [...prev.slice(-19), `⚠️ ${new Date().toLocaleTimeString()}: ${message}`]);
      originalWarn.apply(console, args);
    };
    
    // Capture unhandled errors
    const handleError = (e: ErrorEvent) => {
      setDebugLogs(prev => [...prev.slice(-19), `💥 ${new Date().toLocaleTimeString()}: ${e.message}`]);
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleError);
    };
  }, []);

  const handleOpenProfile = () => {
    setShowProfileView(true);
  };

  const handleOpenEditor = () => {
    setShowProfileView(false);
    setShowProfileEditor(true);
  };

  const handleSaveProfile = async (profile: UserProfile) => {
    // Check if weight or body fat changed
    const weightChanged = profile.weight !== userProfile.weight;
    const bodyFatChanged = profile.bodyFatPercentage !== userProfile.bodyFatPercentage;

    setUserProfile(profile);

    // Save to history if body metrics changed
    if (weightChanged || bodyFatChanged) {
      saveBodyMetricsToHistory(profile);
    }

    // 🆕 同步所有身体信息到后端（包括训练目标和经验等级）
    try {
      console.log('🔄 Syncing profile data to backend...');

      // 字段映射：前端格式 -> 后端格式
      const goalMapping: Record<string, string> = {
        'Hypertrophy': 'build_muscle',
        'Strength': 'improve_endurance',
        'Endurance': 'improve_endurance',
        'General Fitness': 'maintain',
      };
      
      const levelMapping: Record<string, string> = {
        'Beginner': 'beginner',
        'Intermediate': 'intermediate',
        'Advanced': 'advanced',
      };

      const backendProfile = {
        age: profile.age,
        gender: profile.gender?.toLowerCase() as 'male' | 'female' | 'other',
        weight: profile.weight !== undefined ? Math.round(profile.weight * 10) / 10 : undefined,
        height: undefined, // 前端暂时没有身高字段
        // ✅ 现在同步训练目标和经验等级
        fitnessGoal: (profile.primaryGoal ? goalMapping[profile.primaryGoal] : undefined) as 'lose_weight' | 'build_muscle' | 'maintain' | 'improve_endurance' | undefined,
        experienceLevel: (profile.experienceLevel ? levelMapping[profile.experienceLevel] : undefined) as 'beginner' | 'intermediate' | 'advanced' | undefined,
      };

      // 尝试更新，如果不存在则创建
      try {
        await apiClient.updateProfile(backendProfile);
        console.log('✅ Health data synced to backend successfully!');
      } catch (error: any) {
        // 如果 profile 不存在（404），则创建
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          console.log('📝 Profile not found, creating new profile...');
          await apiClient.createProfile(backendProfile);
          console.log('✅ Profile created in backend successfully!');
        } else {
          throw error;
        }
      }

      // 🆕 同步体重/体脂到后端健康数据表（供 Profile 页面体脂卡片和网页端使用）
      if (profile.weight !== undefined || profile.bodyFatPercentage !== undefined) {
        try {
          await apiClient.syncHealthData({
            weight: profile.weight !== undefined ? Math.round(profile.weight * 10) / 10 : undefined,
            bodyFatPercent: profile.bodyFatPercentage !== undefined ? Math.round(profile.bodyFatPercentage * 10) / 10 : undefined,
          });
          console.log('✅ Body metrics synced to backend health data');
        } catch (healthSyncErr: any) {
          console.warn('⚠️ Failed to sync body metrics to backend health:', healthSyncErr);
        }
      }
    } catch (error) {
      console.error('❌ Failed to sync health data to backend:', error);
      // 不阻塞用户操作，只记录错误
    }
  };

  // --- Persistence State ---
  const [history, setHistory] = useState<WorkoutSession[]>(() => safeParse('zenfit_history', []));
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Per-exercise frequency: sessions where the exercise had >= 3 completed sets.
  // Derived from merged local + backend history; recomputes immediately when a
  // workout is finished, with no extra network traffic.
  const exerciseFrequency = useMemo(
    () => ExerciseFrequencyService.computeFrequency(history, unifiedExerciseLibrary),
    [history, unifiedExerciseLibrary]
  );

  // Check for new weekly reports on app startup
  useEffect(() => {
    const checkWeeklyReports = async () => {
      try {
        const newWeekInfo = await checkForNewWeek(history);
        if (newWeekInfo && history.length > 0) {
          // Show notification that a new report can be generated
          setWeeklyReportNotification({
            show: true,
            weekNumber: newWeekInfo.weekNumber,
            year: newWeekInfo.year
          });
        }
      } catch (error) {
        console.error('Failed to check for new weekly reports:', error);
      }
    };

    // Check on app startup (after a small delay to let other data load)
    const timer = setTimeout(checkWeeklyReports, 2000);
    return () => clearTimeout(timer);
  }, [history.length]);

  // Auto-generate weekly report
  const handleGenerateWeeklyReport = async () => {
    if (!weeklyReportNotification) return;

    // Show loading state
    setNotification({
      message: 'Generating weekly report...',
      visible: true
    });

    try {
      console.log('🔄 Generating weekly report for:', weeklyReportNotification);
      console.log('📊 Total workout sessions:', history.length);
      console.log('👤 User profile:', userProfile);

      const report = await autoGenerateWeeklyReport(history, userProfile);

      if (report) {
        console.log('✅ Report generated successfully:', report);
        setWeeklyReportNotification(null);
        setNotification({
          message: `Week ${report.weekNumber} report generated!`,
          visible: true
        });
        setTimeout(() => setNotification(null), 3000);

        // Optionally open the report viewer
        setShowWeeklyReportViewer(true);
      } else {
        console.log('❌ No report generated - checking reasons...');

        // Debug: Check if there are workouts in the target week
        const { getWeekInfo } = await import('@/features/report/services/WeeklyReportService');
        const targetWeekSessions = history.filter(session => {
          const sessionWeek = getWeekInfo(new Date(session.date));
          return sessionWeek.year === weeklyReportNotification.year &&
            sessionWeek.weekNumber === weeklyReportNotification.weekNumber;
        });

        console.log(`📅 Sessions in Week ${weeklyReportNotification.weekNumber}, ${weeklyReportNotification.year}:`, targetWeekSessions);

        setWeeklyReportNotification(null);
        setNotification({
          message: targetWeekSessions.length === 0
            ? `No workouts found for Week ${weeklyReportNotification.weekNumber}`
            : `Report generation failed (${targetWeekSessions.length} workouts found)`,
          visible: true
        });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (error) {
      console.error('❌ Failed to generate weekly report:', error);
      setWeeklyReportNotification(null);
      setNotification({
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        visible: true
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleDismissWeeklyReportNotification = () => {
    setWeeklyReportNotification(null);
  };



  // Persist Libraries (legacy keys kept for backward compatibility)
  useEffect(() => {
    safeSaveJSON('commonExercises', commonExercises);
  }, [commonExercises]);

  useEffect(() => {
    safeSaveJSON('comprehensiveExercises', comprehensiveExercises);
  }, [comprehensiveExercises]);

  // Library Management Handlers (deprecated: Common/Comprehensive split replaced by Frequent/More)

  const [modalContent, setModalContent] = useState<{ title: string, content: React.ReactNode } | null>(null);

  // Global Notification State
  const [notification, setNotification] = useState<{ message: string, visible: boolean } | null>(null);

  // Loading states for various operations
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false);
  const [isLoadingRoutine, setIsLoadingRoutine] = useState(false);

  // --- GLOBAL TIMER STATE ---
  const [timers, setTimers] = useState<TimerState>({});

  // Queue to handle state updates safely outside the interval loop
  const [finishedTimerQueue, setFinishedTimerQueue] = useState<string[]>([]);

  // Audio Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isPlayingSoundRef = useRef<boolean>(false);
  const lastSoundTimeRef = useRef<number>(0);

  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };
    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('touchstart', initAudio, { once: true });
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  const playAlarmSound = async () => {
    // 🆕 防止重复播放 - 如果1秒内已经播放过，就不播放
    const now = Date.now();
    if (isPlayingSoundRef.current || now - lastSoundTimeRef.current < 1000) {
      return;
    }
    
    isPlayingSoundRef.current = true;
    lastSoundTimeRef.current = now;
    
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      const t = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // 单音调提示音 - 简洁清晰
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, t);
      oscillator.frequency.exponentialRampToValueAtTime(440, t + 0.4);

      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.5, t + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

      oscillator.start(t);
      oscillator.stop(t + 0.4);
      
      // 重置播放标志
      setTimeout(() => {
        isPlayingSoundRef.current = false;
      }, 500);
      
    } catch (err) {
      console.error('[Timer] Failed to play alarm sound:', err);
      isPlayingSoundRef.current = false;
    }
  };

  // 🆕 后台计时支持 - 使用 Page Visibility API
  const lastVisibleTimeRef = useRef<number>(Date.now());
  const missedAlarmsRef = useRef<string[]>([]);
  const alarmsPlayedInBackgroundRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时记录时间
        lastVisibleTimeRef.current = Date.now();
        console.log('[Timer] App went to background at', new Date().toLocaleTimeString());
      } else {
        // 页面重新显示时，检查是否有错过的计时器
        const now = Date.now();
        const hiddenDuration = now - lastVisibleTimeRef.current;
        console.log('[Timer] App returned to foreground, was hidden for', hiddenDuration, 'ms');
        
        // 检查哪些计时器在后台期间完成了
        setTimers(prev => {
          const next = { ...prev };
          let changed = false;
          const finishedIds: string[] = [];
          
          Object.keys(next).forEach(key => {
            if (next[key].targetTime <= now) {
              finishedIds.push(key);
              delete next[key];
              changed = true;
            }
          });
          
          if (finishedIds.length > 0) {
            // 过滤掉已经播放过的闹钟
            const newFinishedIds = finishedIds.filter(id => !alarmsPlayedInBackgroundRef.current.has(id));
            if (newFinishedIds.length > 0) {
              missedAlarmsRef.current = newFinishedIds;
              setFinishedTimerQueue(prevQueue => [...prevQueue, ...finishedIds]);
            }
          }
          
          return changed ? next : prev;
        });
        
        // 如果有错过的闹钟，立即播放声音和震动（只播放一次）
        if (missedAlarmsRef.current.length > 0) {
          console.log('[Timer] Playing missed alarms for:', missedAlarmsRef.current);
          missedAlarmsRef.current.forEach(id => alarmsPlayedInBackgroundRef.current.add(id));
          
          setTimeout(() => {
            Haptics.vibrate({ duration: 200 }).catch(() => {});
            playAlarmSound();
            missedAlarmsRef.current = [];
          }, 100);
        }
        
        // 清理已完成的闹钟记录（防止内存无限增长）
        setTimeout(() => {
          alarmsPlayedInBackgroundRef.current.clear();
        }, 5000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Global ticker - 使用 requestAnimationFrame 提高精度
  useEffect(() => {
    let animationFrameId: number;
    let lastCheck = Date.now();
    
    const checkTimers = () => {
      const now = Date.now();
      
      // 每秒检查一次
      if (now - lastCheck >= 1000) {
        lastCheck = now;
        
        setTimers(prev => {
          const next = { ...prev };
          let changed = false;
          const finishedIds: string[] = [];
          let shouldPlaySound = false;

          Object.keys(next).forEach(key => {
            // Check if target time has passed
            if (next[key].targetTime <= now) {
              finishedIds.push(key);
              delete next[key];
              changed = true;

              // 标记需要播放声音（只在页面可见时）
              if (!document.hidden && !alarmsPlayedInBackgroundRef.current.has(key)) {
                shouldPlaySound = true;
                alarmsPlayedInBackgroundRef.current.add(key);
              }
            }
          });

          // 只播放一次声音（即使有多个计时器同时完成）
          if (shouldPlaySound) {
            Haptics.vibrate({ duration: 200 }).catch(() => {});
            playAlarmSound();
          }

          if (finishedIds.length > 0) {
            setFinishedTimerQueue(prevQueue => [...prevQueue, ...finishedIds]);
          }

          return changed ? next : prev;
        });
      }
      
      animationFrameId = requestAnimationFrame(checkTimers);
    };
    
    animationFrameId = requestAnimationFrame(checkTimers);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Process Finished Timers -> Update Set Data
  useEffect(() => {
    if (finishedTimerQueue.length > 0) {
      const exId = finishedTimerQueue[0];

      setActiveWorkout(prev => {
        const workout = [...prev];
        const exIndex = workout.findIndex(e => e.id === exId);

        if (exIndex !== -1) {
          const ex = { ...workout[exIndex] };
          // 1. Update Exercise-Level Rest Stamp (Legacy/Backup)
          ex.lastRestCompleted = Date.now();

          // 2. Update SPECIFIC SET Rest Stamp
          // Logic: Find the *latest completed set* that doesn't have a rest time yet.
          const sets = [...ex.sets];
          for (let i = sets.length - 1; i >= 0; i--) {
            if (sets[i].completed && !sets[i].restCompletedAt) {
              sets[i] = { ...sets[i], restCompletedAt: Date.now() };
              break; // Only tag the latest completed set
            }
          }
          ex.sets = sets;
          workout[exIndex] = ex;

          // Notification
          setNotification({
            message: `${ex.exerciseName} Rest Complete!`,
            visible: true
          });
          setTimeout(() => setNotification(null), 5000);
        }
        return workout;
      });

      setFinishedTimerQueue(prev => prev.slice(1));
    }
  }, [finishedTimerQueue]);


  const toggleTimer = (exerciseId: string, duration: number, forceStart: boolean = false, exerciseName: string = 'Rest') => {
    setTimers(prev => {
      if (prev[exerciseId] && !forceStart) {
        // Cancel
        const next = { ...prev };
        delete next[exerciseId];
        // 同步取消原生计时器（含 Watch 同步）
        WorkoutTimerService.finishRest(exerciseId);
        return next;
      } else {
        // Start or Restart (Force Start)
        const now = Date.now();
        // 同步启动原生计时器：后台不挂起 + 本地通知 + Apple Watch 同步
        WorkoutTimerService.startRest(exerciseId, exerciseName, duration);
        return {
          ...prev,
          [exerciseId]: {
            targetTime: now + (duration * 1000),
            duration,
            startTime: now,
            exerciseName
          }
        };
      }
    });
  };

  const cancelTimer = (exerciseId: string) => {
    setTimers(prev => {
      const next = { ...prev };
      delete next[exerciseId];
      // 同步取消原生计时器
      WorkoutTimerService.finishRest(exerciseId);
      return next;
    });
  };

  const handleFinishTimer = (exerciseId: string) => {
    setTimers(prev => {
      const next = { ...prev };
      // Set target to NOW to trigger natural completion logic in next tick
      if (next[exerciseId]) {
        next[exerciseId] = { ...next[exerciseId], targetTime: Date.now() - 1 };
      }
      return next;
    });
    // 同步结束原生计时器
    WorkoutTimerService.finishRest(exerciseId);
  };

  const [recoveryState, setRecoveryState] = useState<RecoveryStatus[]>(() => safeParse('zenfit_recovery', [
    { muscle: MuscleGroup.CHEST, lastWorked: 0, recoveryPercentage: 100 },
    { muscle: MuscleGroup.LATS, lastWorked: 0, recoveryPercentage: 100 },
    { muscle: MuscleGroup.QUADS, lastWorked: 0, recoveryPercentage: 100 },
    { muscle: MuscleGroup.GLUTES, lastWorked: 0, recoveryPercentage: 100 },
    { muscle: MuscleGroup.SHOULDERS, lastWorked: 0, recoveryPercentage: 100 },
    { muscle: MuscleGroup.BICEPS, lastWorked: 0, recoveryPercentage: 100 },
    { muscle: MuscleGroup.ABS, lastWorked: 0, recoveryPercentage: 100 },
    { muscle: MuscleGroup.CARDIO, lastWorked: 0, recoveryPercentage: 100 },
  ]));

  // Save on change (保留本地备份)
  useEffect(() => {
    safeSaveJSON('zenfit_history', history);
  }, [history]);

  // 🆕 从后端加载训练历史记录和用户资料 - 监听用户认证状态
  useEffect(() => {
    const loadDataFromBackend = async () => {
      // ✅ 确保用户已认证且有有效token
      if (!isAuthenticated || !user) {
        console.log('⏸️ User not authenticated, skipping data load');
        setIsLoadingHistory(false);
        return;
      }

      // ✅ 确保有有效的 token
      const token = apiClient.getToken();
      if (!token) {
        console.log('⏸️ No auth token found, skipping data load');
        setIsLoadingHistory(false);
        return;
      }

      setIsLoadingHistory(true);
      try {
        console.log(`📥 Loading data for user: ${user.email}`);

        // 并行加载训练历史和用户资料
        const [remoteWorkouts, backendProfile] = await Promise.all([
          WorkoutSyncService.loadWorkoutsFromBackend(),
          apiClient.getProfile().catch(err => {
            console.log('ℹ️ No profile found in backend:', err.message);
            return null;
          })
        ]);

        // 处理训练历史
        const localWorkouts = safeParse<WorkoutSession[]>('zenfit_history', []);
        const mergedWorkouts = WorkoutSyncService.mergeWorkoutData(localWorkouts, remoteWorkouts);
        console.log(`✅ Loaded ${remoteWorkouts.length} remote + ${localWorkouts.length} local = ${mergedWorkouts.length} total workouts`);
        setHistory(mergedWorkouts);

        // 🆕 基于训练历史重新计算恢复状态
        console.log('🔄 Calculating recovery state from workout history...');
        const calculatedRecoveryState = RecoveryCalculationService.calculateRecoveryFromHistory(mergedWorkouts);
        setRecoveryState(calculatedRecoveryState);
        console.log('✅ Recovery state calculated:', calculatedRecoveryState);

        // 处理用户资料 - 同步所有字段（包括训练目标和经验等级）
        console.log('📋 Backend profile raw data:', backendProfile);
        if (backendProfile) {
          console.log('📋 Loading profile data from backend:', backendProfile);
          console.log('📋 Current local profile:', userProfile);
          console.log('📋 Backend weight value:', backendProfile.weight, 'type:', typeof backendProfile.weight);

          // 🆕 反向字段映射：后端格式 -> 前端格式
          const reverseGoalMapping: Record<string, string> = {
            'build_muscle': 'Hypertrophy',
            'improve_endurance': 'Endurance',
            'maintain': 'General Fitness',
            'lose_weight': 'General Fitness',
          };
          
          const reverseLevelMapping: Record<string, string> = {
            'beginner': 'Beginner',
            'intermediate': 'Intermediate',
            'advanced': 'Advanced',
          };

          // 🆕 iOS FIX: Always use backend data if available, ignoring localStorage defaults
          // This fixes iOS WebView losing localStorage on app restart
          const backendWeight = backendProfile.weight;
          const backendAge = backendProfile.age;
          const backendGender = backendProfile.gender;
          const backendExpLevel = backendProfile.experienceLevel;
          const backendFitnessGoal = backendProfile.fitnessGoal;
          const backendBodyFat = (backendProfile as any).bodyFatPercent;

          // 🆕 Force update from backend if valid data exists
          const updatedProfile: UserProfile = {
            // Start with a clean default
            weight: 70,
            unit: 'kg',

            // Override with local data if it has valid weight (not default)
            ...(userProfile.weight !== 70 && userProfile),

            // Always override with backend data if valid
            ...(backendWeight !== undefined && backendWeight !== null && backendWeight > 0 && {
              weight: Math.round(Number(backendWeight) * 10) / 10
            }),

            ...(backendAge !== undefined && backendAge !== null && backendAge > 0 && {
              age: Number(backendAge)
            }),

            ...(backendGender && {
              gender: (String(backendGender).charAt(0).toUpperCase() + String(backendGender).slice(1)) as any
            }),

            ...(backendExpLevel && {
              experienceLevel: reverseLevelMapping[backendExpLevel] as any
            }),

            ...(backendFitnessGoal && {
              primaryGoal: reverseGoalMapping[backendFitnessGoal] as any
            }),

            ...(backendBodyFat !== undefined && backendBodyFat !== null && backendBodyFat > 0 && {
              bodyFatPercentage: Math.round(Number(backendBodyFat) * 10) / 10
            }),
          };

          setUserProfile(updatedProfile);
          console.log('✅ Profile data synced from backend (including goals and experience level)');
          console.log('📋 Updated profile:', updatedProfile);
        }

        // 同步本地未同步的数据到后端
        if (localWorkouts.some(w => w.syncStatus === 'pending')) {
          console.log('🔄 Syncing pending local workouts to backend...');
          await WorkoutSyncService.syncPendingWorkouts(localWorkouts);
        }
      } catch (error) {
        console.error('❌ Failed to load data from backend:', error);
        // 失败时使用本地数据
        const localWorkouts = safeParse<WorkoutSession[]>('zenfit_history', []);
        setHistory(localWorkouts);

        // 🆕 即使失败也要计算恢复状态
        const calculatedRecoveryState = RecoveryCalculationService.calculateRecoveryFromHistory(localWorkouts);
        setRecoveryState(calculatedRecoveryState);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    // 当用户认证状态变化时重新加载数据
    loadDataFromBackend();
  }, [isAuthenticated, user?.id]); // 监听认证状态和用户ID变化

  useEffect(() => {
    safeSaveJSON('zenfit_recovery', recoveryState);
  }, [recoveryState]);

  // Real-time recovery percentage update - runs every minute
  useEffect(() => {
    const updateRecoveryPercentages = () => {
      setRecoveryState(prev => prev.map(status => ({
        ...status,
        recoveryPercentage: calculateRecoveryPercentage(status.lastWorked, 72)
      })));
    };

    // Update immediately on mount
    updateRecoveryPercentages();

    // Then update every minute (60000ms)
    const interval = setInterval(updateRecoveryPercentages, 60000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array - only set up once

  const calculateRecoveryPercentage = (lastWorked: number, durationHours: number = 72) => {
    // Handle undefined, null, 0, or invalid values
    if (!lastWorked || typeof lastWorked !== 'number' || isNaN(lastWorked)) {
      return 100;
    }
    const now = Date.now();
    const elapsed = now - lastWorked;
    const durationMs = durationHours * 60 * 60 * 1000;
    const percentage = (elapsed / durationMs) * 100;
    // Ensure we return a valid number between 0 and 100
    return Math.min(100, Math.max(0, isNaN(percentage) ? 100 : percentage));
  };

  const deleteSession = (sessionId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除训练记录 / Delete Workout',
      message: '确定要删除这条训练记录吗？此操作无法撤销。\n\nAre you sure you want to delete this workout record? This action cannot be undone.',
      variant: 'danger',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setHistory(prev => prev.filter(s => s.id !== sessionId));
      }
    });
  };

  // --- Derived Stats ---
  const activeWorkoutStats = useMemo(() => {
    let compound = 0;
    let isolation = 0;
    activeWorkout.forEach(ex => {
      if (ex.mechanic === 'Compound') compound++;
      if (ex.mechanic === 'Isolation') isolation++;
    });
    return { compound, isolation, total: activeWorkout.length };
  }, [activeWorkout]);

  // --- Actions ---

  const handleAddExercise = (exercise: Exercise, isAIRecommended: boolean = false) => {
    setIsLoadingWorkout(true);

    // Check for duplicates - prevent adding same exercise twice
    const isAlreadyInWorkout = activeWorkout.some(
      activeEx => activeEx.exerciseId === exercise.id
    );
    
    if (isAlreadyInWorkout) {
      // Show notification that exercise is already in workout
      setNotification({
        message: `${exercise.nameZh || exercise.name} is already in your workout`,
        visible: true
      });
      setTimeout(() => setNotification(null), 2000);
      setIsLoadingWorkout(false);
      return;
    }

    const restTime = exercise.mechanic === 'Compound' ? 180 : (exercise.mechanic === 'Isolation' ? 90 : 60);
    const now = getCurrentTimestamp();

    const newActiveExercise: ActiveExercise = {
      id: generateUUID(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      exerciseNameZh: exercise.nameZh,
      muscleGroup: exercise.muscleGroup,
      secondaryMuscles: exercise.secondaryMuscles,
      mechanic: exercise.mechanic,
      recommendedRestSeconds: restTime,
      createdAt: now,
      isAIRecommended: isAIRecommended,
      sets: [
        {
          id: generateUUID(),
          weight: exercise.equipment === 'Bodyweight' ? userProfile.weight : 0,
          reps: 0,
          completed: false
        },
      ],
    };

    if (activeWorkout.length === 0 && !workoutStartTime) {
      setWorkoutStartTime(Date.now());

      // Check for weekly reports when starting a new workout
      checkForNewWeek(history).then(newWeekInfo => {
        if (newWeekInfo && history.length > 0 && !weeklyReportNotification?.show) {
          setWeeklyReportNotification({
            show: true,
            weekNumber: newWeekInfo.weekNumber,
            year: newWeekInfo.year
          });
        }
      }).catch(error => {
        console.error('Failed to check for new weekly reports:', error);
      });
    }

    setActiveWorkout([...activeWorkout, newActiveExercise]);
    
    // Show success notification
    setNotification({
      message: `Added ${exercise.nameZh || exercise.name} to workout`,
      visible: true
    });
    setTimeout(() => setNotification(null), 2000);

    // Set a brief timeout to simulate processing and improve UX perception
    setTimeout(() => {
      setIsLoadingWorkout(false);
    }, 300);
  };

  const handleUpdateSet = (exerciseIndex: number, setIndex: number, field: keyof WorkoutSet, value: number | boolean) => {
    const updatedWorkout = [...activeWorkout];
    const exercise = updatedWorkout[exerciseIndex];
    const set = exercise.sets[setIndex];

    // 🆕 Smart Reordering: Record start time when user first enters weight/reps OR completes a set
    const isEnteringData = (field === 'weight' || field === 'reps') && typeof value === 'number' && value > 0;
    const isCompletingSet = field === 'completed' && value === true;
    
    if ((isEnteringData || isCompletingSet) && !exercise.startedAt) {
      exercise.startedAt = getCurrentTimestamp();
    }

    // Auto-Start Timer Logic
    if (field === 'completed' && value === true) {
      // Check for insufficient rest on previous set
      // Check for insufficient rest on previous set
      if (timers[exercise.id]) {
        const targetTime = timers[exercise.id].targetTime;
        const remainingMs = Math.max(0, targetTime - Date.now());
        const remainingSeconds = Math.ceil(remainingMs / 1000);

        const totalDuration = exercise.recommendedRestSeconds || 90;
        const actual = totalDuration - remainingSeconds; // Actual rest taken

        // Find the latest completed set (which is the one BEFORE this new one)
        // We need to iterate backwards from the set *before* the current one being marked complete.
        const sets = [...exercise.sets];
        for (let i = setIndex - 1; i >= 0; i--) { // Start from setIndex - 1
          if (sets[i].completed && !sets[i].restCompletedAt) {
            // Mark it as done but record actual rest
            sets[i] = {
              ...sets[i],
              restCompletedAt: Date.now(),
              actualRestSeconds: actual
            };
            break; // Only tag the latest completed set
          }
        }
        exercise.sets = sets; // Update the exercise with the modified sets array
      }

      // Auto-start timer for the NEW set (Force Start)
      const restTime = exercise.recommendedRestSeconds || 90;
      toggleTimer(exercise.id, restTime, true, exercise.exerciseName);

      // Mark set completion timestamp
      (set as any).completedAt = getCurrentTimestamp();
    }
    (set as any)[field] = value; // Apply the original update (e.g., set.completed = true)
    
    // 🆕 Smart Reordering: Sort exercises based on start time
    // Order: 1) Started exercises (by start time), 2) Not started exercises (by creation time)
    updatedWorkout.sort((a, b) => {
      // Both have startedAt - sort by start time
      if (a.startedAt && b.startedAt) {
        return a.startedAt - b.startedAt;
      }
      // Only A started - A goes first
      if (a.startedAt && !b.startedAt) {
        return -1;
      }
      // Only B started - B goes first
      if (!a.startedAt && b.startedAt) {
        return 1;
      }
      // Neither started - keep original order (by createdAt)
      return a.createdAt - b.createdAt;
    });
    
    setActiveWorkout(updatedWorkout);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const updatedWorkout = [...activeWorkout];
    const previousSet = updatedWorkout[exerciseIndex].sets[updatedWorkout[exerciseIndex].sets.length - 1];

    updatedWorkout[exerciseIndex].sets.push({
      id: generateUUID(),
      weight: previousSet ? previousSet.weight : 0,
      reps: previousSet ? previousSet.reps : 0,
      completed: false,
    });
    setActiveWorkout(updatedWorkout);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const updatedWorkout = [...activeWorkout];
    updatedWorkout[exerciseIndex].sets.splice(setIndex, 1);
    if (updatedWorkout[exerciseIndex].sets.length === 0) {
      updatedWorkout.splice(exerciseIndex, 1);
    }
    setActiveWorkout(updatedWorkout);
  };

  const handleRemoveExercise = (exerciseIndex: number) => {
    const updatedWorkout = [...activeWorkout];
    updatedWorkout.splice(exerciseIndex, 1);
    setActiveWorkout(updatedWorkout);
  };

  const handleFinishWorkout = async () => {
    if (activeWorkout.length === 0) return;

    // 🆕 清除持久化的训练数据
    clearPersistedWorkout();

    setModalContent({
      title: "Finishing Workout...",
      content: (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="animate-spin text-emerald-500 h-10 w-10 mb-4" />
          <p className="text-slate-400 text-center">Calculating duration & <br />Saving data...</p>
        </div>
      )
    });

    // 🆕 使用智能时长计算
    // 基于组完成时间戳，自动检测并排除暂停时间
    const durationResult = WorkoutDurationCalculator.calculateSmartDuration(activeWorkout);

    const durationMinutes = durationResult.durationMinutes;

    const volumeLoad = activeWorkout.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0);

    // Smart Recovery Engine
    const primaryMuscles = new Set<MuscleGroup>();
    const secondaryMuscles = new Set<MuscleGroup>();

    activeWorkout.forEach(ex => {
      primaryMuscles.add(ex.muscleGroup);
      if (ex.secondaryMuscles) {
        ex.secondaryMuscles.forEach(m => secondaryMuscles.add(m));
      }
    });

    const now = Date.now();

    // 🆕 使用 RecoveryCalculationService 更新恢复状态
    const newRecoveryState = RecoveryCalculationService.updateRecoveryAfterWorkout(
      recoveryState,
      primaryMuscles,
      secondaryMuscles,
      72 // 恢复时间：72小时
    );

    console.log('💾 Saving new recovery state:', newRecoveryState);
    setRecoveryState(newRecoveryState);

    const sessionTime = getCurrentTimestamp();
    const newSession: WorkoutSession = {
      id: generateUUID(),
      date: sessionTime,
      createdAt: sessionTime,
      syncStatus: 'pending',
      exercises: activeWorkout, // This includes the new restCompletedAt data in sets
      durationMinutes,
      volumeLoad
    };

    // 🆕 立即同步到后端
    try {
      console.log('🔄 Syncing workout to backend...');
      const backendId = await WorkoutSyncService.syncWorkoutToBackend(newSession);

      if (backendId) {
        // 标记为已同步
        newSession.syncStatus = 'synced';
        console.log('✅ Workout synced to backend successfully!');
      } else {
        console.warn('⚠️ Workout saved locally but sync failed');
      }
    } catch (error) {
      console.error('❌ Failed to sync workout to backend:', error);
      // 保持 syncStatus 为 'pending'，稍后重试
    }

    setHistory(prev => [...prev, newSession]);

    // Clear all active timers
    // Clear all active timers
    setTimers({});
    setWorkoutStartTime(null);

    // REMOVED AI REPORT GENERATION FOR INSTANT FEEDBACK
    // const aiReport = await generateWorkoutReport(activeWorkout, durationMinutes);

    setModalContent({
      title: "Session Complete!",
      content: (
        <div className="animate-fade-in">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-800/50 p-3 rounded-xl text-center border border-slate-700">
              <div className="text-2xl font-bold text-emerald-400">{activeWorkout.length}</div>
              <div className="text-xs text-slate-500 uppercase">Exercises</div>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl text-center border border-slate-700">
              <div className="text-2xl font-bold text-emerald-400">{volumeLoad}</div>
              <div className="text-xs text-slate-500 uppercase">Volume (kg)</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700 relative overflow-hidden">
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <CheckCircle2 size={48} className="text-emerald-500 mb-2" />
              <h4 className="text-white font-bold text-lg">Workout Saved!</h4>
              <p className="text-slate-400 text-sm">Great job today. Rest up!</p>
            </div>
          </div>

          <button
            onClick={() => {
              setModalContent(null);
              setActiveWorkout([]);
              setWorkoutStartTime(null);
              setCurrentScreen(AppScreen.HISTORY);
            }}
            className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-900/50"
          >
            View Recovery & History
          </button>
        </div>
      )
    });
  };

  const handleToggleSelection = (exercise: Exercise) => {
    setSelectedRoutineExercises(prev => {
      const exists = prev.find(e => e.id === exercise.id);
      if (exists) return prev.filter(e => e.id !== exercise.id);
      return [...prev, exercise];
    });
  };

  const handleSaveRoutine = async () => {
    setIsLoadingRoutine(true);

    if (!routineName.trim()) {
      setNotification({ message: '请为您的训练计划输入名称', visible: true });
      setIsLoadingRoutine(false);
      return;
    }

    if (selectedRoutineExercises.length === 0) {
      setNotification({ message: '没有可保存的训练内容', visible: true });
      setIsLoadingRoutine(false);
      return;
    }

    const now = getCurrentTimestamp();
    const newRoutine: Routine = {
      id: generateUUID(),
      name: routineName,
      exercises: selectedRoutineExercises,
      createdAt: now
    };

    // 🆕 立即同步到后端
    try {
      console.log('🔄 Syncing new routine to backend...');
      const backendId = await RoutineSyncService.syncRoutineToBackend(newRoutine);

      if (backendId) {
        // 使用后端返回的 ID
        newRoutine.id = backendId;
        console.log('✅ Routine synced to backend successfully!');
      } else {
        console.warn('⚠️ Routine saved locally but sync failed');
      }

      setRoutines(prev => [...prev, newRoutine]);
      setNotification({ message: '训练计划已保存', visible: true });
    } catch (error) {
      console.error('❌ Failed to sync routine to backend:', error);
      setNotification({ message: '保存失败，请重试', visible: true });
    } finally {
      setIsLoadingRoutine(false);
      setShowRoutineCreator(false);
      setRoutineName('');
      setSelectedRoutineExercises([]);
      setIsSelectionMode(false);
    }
  };

  const handleStartRoutine = (routine: Routine) => {
    // Add all exercises from routine to active workout
    const now = getCurrentTimestamp();
    const restTime = (mechanic: string | undefined) =>
      mechanic === 'Compound' ? 180 : (mechanic === 'Isolation' ? 90 : 60);

    const newExercises: ActiveExercise[] = routine.exercises.map(ex => ({
      id: generateUUID(),
      exerciseId: ex.id,
      exerciseName: ex.name,
      exerciseNameZh: ex.nameZh,
      muscleGroup: ex.muscleGroup,
      secondaryMuscles: ex.secondaryMuscles,
      mechanic: ex.mechanic,
      recommendedRestSeconds: restTime(ex.mechanic),
      createdAt: now,
      sets: [{
        id: generateUUID(),
        weight: ex.equipment === 'Bodyweight' ? userProfile.weight : 0,
        reps: 0,
        completed: false
      }]
    }));

    setActiveWorkout(prev => [...prev, ...newExercises]);

    // Initialize start time if not set
    if (!workoutStartTime) {
      setWorkoutStartTime(Date.now());
    }

    setActiveTab('workout');
    setCurrentScreen(AppScreen.WORKOUT);
  };

  const handleRemoveExerciseById = (exerciseId: string) => {
    setActiveWorkout(prev => prev.filter(e => e.exerciseId !== exerciseId));
  };

  const handleClearAllExercises = () => {
    // 🆕 使用自定义确认对话框（移动端友好）
    setConfirmDialog({
      isOpen: true,
      title: '删除所有动作 / Clear All Exercises',
      message: '确定要删除所有动作吗？此操作无法撤销。\n\nAre you sure you want to clear all exercises? This action cannot be undone.',
      variant: 'danger',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setActiveWorkout([]);
        setWorkoutStartTime(null);
        // 🆕 清除持久化的训练数据
        clearPersistedWorkout();
        // Clear all active timers
        setTimers({});
      }
    });
  };

  // 从 active workout 保存为 routine
  const handleSaveActiveWorkoutAsRoutine = () => {
    if (activeWorkout.length === 0) {
      setNotification({
        message: 'No exercises to save',
        visible: true
      });
      setTimeout(() => setNotification(null), 2000);
      return;
    }

    // 将 ActiveExercise 转换为 Exercise 格式
    const exercisesForRoutine: Exercise[] = activeWorkout.map(activeEx => {
      // 从 exercise library 中查找完整的 exercise 信息
      const fullExercise = unifiedExerciseLibrary.find(
        ex => ex.id === activeEx.exerciseId
      );

      if (fullExercise) {
        return fullExercise;
      }

      // 如果找不到，创建一个基本的 Exercise 对象
      return {
        id: activeEx.exerciseId,
        name: activeEx.exerciseName,
        nameZh: activeEx.exerciseNameZh,
        muscleGroup: activeEx.muscleGroup,
        secondaryMuscles: activeEx.secondaryMuscles,
        mechanic: activeEx.mechanic,
        equipment: 'Barbell', // 默认值
        difficulty: 'Intermediate', // 默认值
        videoUrl: '',
        gifUrl: ''
      } as Exercise;
    });

    // 设置选中的动作并打开 routine creator
    setSelectedRoutineExercises(exercisesForRoutine);
    setEditingRoutine(null);
    setRoutineName('');
    setShowRoutineCreator(true);
  };

  const handleAddToRoutine = (exercise: Exercise) => {
    setPendingRoutineExercise(exercise);
    setShowAddToRoutineModal(true);
  };

  // 从历史记录复制训练到 active workout
  const handleCopyWorkoutToActive = (exercises: ActiveExercise[]) => {
    // 显示确认对话框
    setConfirmDialog({
      isOpen: true,
      title: '复制训练 / Copy Workout',
      message: `确定要将这 ${exercises.length} 个动作添加到当前训练吗？\n\nAdd ${exercises.length} exercises to active workout?`,
      variant: 'info',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));

        // 复制动作到 active workout
        const now = getCurrentTimestamp();
        const newExercises: ActiveExercise[] = exercises.map(ex => ({
          ...ex,
          id: generateUUID(), // 生成新的ID
          createdAt: now,
          sets: ex.sets.map(set => ({
            ...set,
            id: generateUUID(), // 生成新的set ID
            completed: false, // 重置完成状态
            completedAt: undefined,
            restCompletedAt: undefined,
            actualRestSeconds: undefined
          }))
        }));

        // 添加到 active workout
        setActiveWorkout(prev => [...prev, ...newExercises]);

        // 初始化训练开始时间
        if (!workoutStartTime) {
          setWorkoutStartTime(Date.now());
        }

        // 切换到 workout 页面
        setCurrentScreen(AppScreen.WORKOUT);

        // 显示成功提示
        setNotification({
          message: `已添加 ${exercises.length} 个动作到当前训练`,
          visible: true
        });
        setTimeout(() => setNotification(null), 2000);
      }
    });
  };

  const confirmAddToRoutine = (routineId: string) => {
    if (!pendingRoutineExercise) return;
    setRoutines(prev => prev.map(r => {
      if (r.id === routineId) {
        // Check if already exists
        if (r.exercises.find(e => e.id === pendingRoutineExercise.id)) return r;
        return { ...r, exercises: [...r.exercises, pendingRoutineExercise] };
      }
      return r;
    }));
    setShowAddToRoutineModal(false);
    setPendingRoutineExercise(null);
    setNotification({ message: 'Added to Routine', visible: true });
    setTimeout(() => setNotification(null), 2000);
  };

  const handleRemoveExerciseFromRoutine = async (exerciseId: string, routineId: string) => {
    const target = routines.find(r => r.id === routineId);
    if (!target) return;

    const updatedRoutine: Routine = { ...target, exercises: target.exercises.filter(e => e.id !== exerciseId) };
    setRoutines(prev => prev.map(r => (r.id === routineId ? updatedRoutine : r)));

    const isBackendId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(routineId);
    if (isBackendId && isAuthenticated && user) {
      try {
        await RoutineSyncService.updateRoutineInBackend(updatedRoutine);
      } catch (error) {
        console.error('❌ Failed to sync routine removal to backend:', error);
      }
    }
  };
  const handleAddExercisesToRoutine = async (exercises: Exercise[], routineId?: string): Promise<string | undefined> => {
    if (!exercises || exercises.length === 0) {
      setNotification({ message: 'No exercises to save', visible: true });
      setTimeout(() => setNotification(null), 2000);
      return undefined;
    }

    if (routineId) {
      // ---- 追加到现有 routine（按 exercise.id 去重）----
      const target = routines.find(r => r.id === routineId);
      if (!target) {
        setNotification({ message: 'Routine not found', visible: true });
        setTimeout(() => setNotification(null), 2000);
        return undefined;
      }

      const existingIds = new Set(target.exercises.map(e => e.id));
      const newOnes = exercises.filter(e => !existingIds.has(e.id));
      const skipped = exercises.length - newOnes.length;

      if (newOnes.length === 0) {
        setNotification({ message: 'All exercises already in this routine', visible: true });
        setTimeout(() => setNotification(null), 2000);
        return routineId;
      }

      const updatedRoutine: Routine = { ...target, exercises: [...target.exercises, ...newOnes] };
      setRoutines(prev => prev.map(r => (r.id === routineId ? updatedRoutine : r)));

      // 异步同步到后端（仅当是后端 ID 且已认证）
      const isBackendId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(routineId);
      if (isBackendId && isAuthenticated && user) {
        try {
          await RoutineSyncService.updateRoutineInBackend(updatedRoutine);
        } catch (error) {
          console.error('❌ Failed to sync routine update to backend:', error);
        }
      }

      setNotification({
        message: skipped > 0
          ? `Added ${newOnes.length} to "${target.name}" (${skipped} already there)`
          : `Added ${newOnes.length} exercise${newOnes.length > 1 ? 's' : ''} to "${target.name}"`,
        visible: true
      });
      setTimeout(() => setNotification(null), 2500);
      return routineId;
    }

    // ---- 新建 routine：自动命名（第一个动作名 + " Routine"），source: 'ai' ----
    const baseName = exercises[0]?.nameZh || exercises[0]?.name || 'AI';
    const newRoutine: Routine = {
      id: generateUUID(),
      name: `${baseName} Routine`,
      exercises,
      createdAt: getCurrentTimestamp(),
      source: 'ai'
    };

    // 先加入本地状态（立即反馈），localStorage 由 useEffect 自动持久化
    setRoutines(prev => [...prev, newRoutine]);

    // 然后异步同步到后端，成功后用后端 ID 替换本地 ID
    if (isAuthenticated && user) {
      try {
        const backendId = await RoutineSyncService.syncRoutineToBackend(newRoutine);
        if (backendId) {
          setRoutines(prev => prev.map(r => (r.id === newRoutine.id ? { ...r, id: backendId } : r)));
        }
      } catch (error) {
        console.error('❌ Failed to sync new routine to backend:', error);
        // 不影响用户体验，routine 已保存在本地
      }
    }

    setNotification({
      message: `Saved ${exercises.length} exercise${exercises.length > 1 ? 's' : ''} as "${newRoutine.name}"`,
      visible: true
    });
    setTimeout(() => setNotification(null), 2500);
    return newRoutine.id;
  };

  const handleDeleteRoutine = async (id: string) => {
    // 找到要删除的routine
    const routineToDelete = routines.find(r => r.id === id);
    if (!routineToDelete) {
      console.warn('⚠️ Routine not found:', id);
      return;
    }

    // 🆕 使用自定义确认对话框（移动端友好）
    setConfirmDialog({
      isOpen: true,
      title: '删除训练计划 / Delete Routine',
      message: `确定要删除"${routineToDelete.name}"吗？\n\nAre you sure you want to delete "${routineToDelete.name}"?`,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        await performDeleteRoutine(id, routineToDelete);
      }
    });
  };

  // 实际执行删除操作的函数
  const performDeleteRoutine = async (id: string, routineToDelete: Routine) => {

    // 显示删除中提示
    setNotification({
      message: 'Deleting routine...',
      visible: true
    });

    try {
      // ✅ 检查是否是后端ID（UUID格式）
      const isBackendId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      if (isBackendId && isAuthenticated && user) {
        // 🆕 只有后端ID且用户已认证才尝试从后端删除
        console.log('🗑️ Deleting routine from backend:', id);
        const success = await RoutineSyncService.deleteRoutineFromBackend(id);

        if (!success) {
          console.error('❌ Backend deletion failed');
          setNotification({
            message: 'Backend deletion failed, deleting locally',
            visible: true
          });
          setTimeout(() => setNotification(null), 2000);
        }
      } else {
        console.log('🗑️ Deleting local-only routine:', id);
      }

      // 🆕 无论后端是否成功，都从本地删除（确保UI更新）
      setRoutines(prev => {
        const newRoutines = prev.filter(r => r.id !== id);
        console.log(`✅ Deleted routine from state. Before: ${prev.length}, After: ${newRoutines.length}`);

        // 🆕 强制更新 localStorage
        iOSStorage.setItem('zenfit_routines', JSON.stringify(newRoutines));

        return newRoutines;
      });

      // 显示成功通知
      setNotification({
        message: `已删除"${routineToDelete.name}"`,
        visible: true
      });
      setTimeout(() => setNotification(null), 2000);
    } catch (error) {
      console.error('❌ Failed to delete routine:', error);

      // 即使出错也尝试从本地删除
      setRoutines(prev => {
        const newRoutines = prev.filter(r => r.id !== id);
        iOSStorage.setItem('zenfit_routines', JSON.stringify(newRoutines));
        return newRoutines;
      });

      setNotification({
        message: 'Error occurred, deleted locally',
        visible: true
      });
      setTimeout(() => setNotification(null), 2000);
    }
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setShowRoutineCreator(true);
  };

  // 登出功能
  const handleLogout = () => {
    setConfirmDialog({
      isOpen: true,
      title: '登出 / Logout',
      message: '确定要登出吗？\n\nAre you sure you want to logout?',
      variant: 'warning',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        // 清除认证token
        iOSStorage.removeItem('zenfit_auth_token');
        // 跳转到登录页
        navigate('/login');
      }
    });
  };

  // --- AI RECOMMENDATION HANDLERS ---
  const generateAIRecommendations = () => {
    const recentWorkouts = history.slice(-5).map(session => session.exercises);

    console.log('🤖 Generating AI recommendations...');
    // 🆕 优先使用基于历史数据的AI推荐服务V2
    if (history.length > 0) {
      generateHistoryBasedRecommendations();
    } else {
      console.log('⚠️ No workout history found, skipping history-based recommendations');
    }

    // 使用增强的AI推荐服务作为备用
    const enhancedContext = {
      userProfile,
      currentWorkout: activeWorkout,
      recoveryState,
      recentWorkouts,
      workoutHistory: history, // 传入完整的训练历史
      exerciseLibrary: unifiedExerciseLibrary,
      currentDate: new Date(),
    };

    const enhancedRecommendations = EnhancedAIRecommendationService.generateEnhancedRecommendations(enhancedContext)
      .filter(rec => !dismissedRecommendations.has(rec.id) && !acceptedRecommendations.has(rec.id));

    console.log('✨ Enhanced recommendations generated:', enhancedRecommendations.length);
    setEnhancedAiRecommendations(enhancedRecommendations);

    // 保持原有的推荐作为备用
    const context = {
      userProfile,
      currentWorkout: activeWorkout,
      recoveryState,
      recentWorkouts,
      exerciseLibrary: unifiedExerciseLibrary,
      currentDate: new Date(),
    };

    const recommendations = AIRecommendationService.generateRecommendations(context)
      .filter(rec => !dismissedRecommendations.has(rec.id) && !acceptedRecommendations.has(rec.id));

    console.log('🔧 Basic recommendations generated:', recommendations.length);
    setAiRecommendations(recommendations);
  };

  const handleAcceptRecommendation = (recommendation: WorkoutRecommendation) => {
    if (recommendation.type === 'exercise' && recommendation.suggestedExercises) {
      // Check for duplicates and add only new exercises
      let addedCount = 0;
      let duplicateCount = 0;

      recommendation.suggestedExercises.forEach(exercise => {
        // Check if exercise is already in active workout
        const isAlreadyAdded = activeWorkout.some(activeEx =>
          activeEx.exerciseId === exercise.id || activeEx.exerciseName === exercise.name
        );

        if (isAlreadyAdded) {
          duplicateCount++;
        } else {
          handleAddExercise(exercise, true); // Mark as AI recommended
          addedCount++;
        }
      });

      // Show appropriate notification
      if (addedCount > 0 && duplicateCount > 0) {
        setNotification({
          message: `Added ${addedCount} exercises, ${duplicateCount} already in workout`,
          visible: true
        });
      } else if (addedCount > 0) {
        setNotification({
          message: `Added ${addedCount} AI recommended exercise${addedCount > 1 ? 's' : ''}!`,
          visible: true
        });
      } else {
        setNotification({
          message: 'All recommended exercises already in workout',
          visible: true
        });
      }
    }

    // Mark as accepted to prevent re-generation
    setAcceptedRecommendations(prev => new Set([...prev, recommendation.id]));

    // Remove from current recommendations
    setAiRecommendations(prev => prev.filter(r => r.id !== recommendation.id));

    setTimeout(() => setNotification(null), 3000);
  };

  // 增强AI推荐处理函数
  const handleAcceptEnhancedRecommendation = (recommendation: EnhancedWorkoutRecommendation) => {
    if (recommendation.type === 'exercise' && recommendation.suggestedExercises) {
      // 处理练习推荐
      let addedCount = 0;
      let duplicateCount = 0;

      recommendation.suggestedExercises.forEach(exercise => {
        const isAlreadyAdded = activeWorkout.some(activeEx =>
          activeEx.exerciseId === exercise.id || activeEx.exerciseName === exercise.name
        );

        if (isAlreadyAdded) {
          duplicateCount++;
        } else {
          handleAddExercise(exercise, true);
          addedCount++;
        }
      });

      if (addedCount > 0) {
        setNotification({
          message: `已添加 ${addedCount} 个AI推荐动作！`,
          visible: true
        });
      } else {
        setNotification({
          message: '推荐的动作已在训练中',
          visible: true
        });
      }
    } else if (recommendation.type === 'weight_adjustment' && recommendation.smartWeightRecommendation) {
      // 处理重量调整推荐
      const smartWeight = recommendation.smartWeightRecommendation;

      // 找到对应的练习并更新重量
      setActiveWorkout(prev => prev.map(exercise => {
        // 通过推荐ID找到对应的练习
        const exerciseId = recommendation.id.replace('weight-adjustment-', '');
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: exercise.sets.map((set, index) =>
              index === 0 ? { ...set, weight: smartWeight.recommendedWeight } : set
            )
          };
        }
        return exercise;
      }));

      setNotification({
        message: `重量已调整为 ${smartWeight.recommendedWeight}kg`,
        visible: true
      });
    }

    // 标记为已接受
    setAcceptedRecommendations(prev => new Set([...prev, recommendation.id]));
    setEnhancedAiRecommendations(prev => prev.filter(r => r.id !== recommendation.id));

    setTimeout(() => setNotification(null), 3000);
  };

  // AI推荐反馈处理
  const handleAIRecommendationFeedback = (recommendationId: string, feedback: 'positive' | 'negative' | 'regenerate') => {
    EnhancedAIRecommendationService.handleRecommendationFeedback(recommendationId, feedback, {
      userProfile,
      currentWorkout: activeWorkout,
      workoutHistory: history
    });

    if (feedback === 'regenerate') {
      // 重新生成推荐
      generateAIRecommendations();
      setNotification({
        message: '正在重新生成推荐...',
        visible: true
      });
      setTimeout(() => setNotification(null), 2000);
    } else {
      setNotification({
        message: feedback === 'positive' ? '感谢您的反馈！' : '我们会改进推荐质量',
        visible: true
      });
      setTimeout(() => setNotification(null), 2000);
    }
  };

  // 基于历史数据的AI推荐处理函数
  const handleAcceptHistoryBasedRecommendation = (recommendation: HistoryBasedRecommendation) => {
    // 查找对应的动作
    const exercise = unifiedExerciseLibrary.find(
      ex => ex.name === recommendation.exerciseName || ex.id === recommendation.exerciseName
    );

    if (exercise) {
      // 检查是否已在训练中
      const isAlreadyAdded = activeWorkout.some(activeEx =>
        activeEx.exerciseId === exercise.id || activeEx.exerciseName === exercise.name
      );

      if (isAlreadyAdded) {
        setNotification({
          message: '该动作已在当前训练中',
          visible: true
        });
      } else {
        // 添加动作到训练，并预设推荐的重量
        const restTime = exercise.mechanic === 'Compound' ? 180 : (exercise.mechanic === 'Isolation' ? 90 : 60);
        const now = getCurrentTimestamp();

        const newActiveExercise: ActiveExercise = {
          id: generateUUID(),
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          exerciseNameZh: exercise.nameZh,
          muscleGroup: exercise.muscleGroup,
          secondaryMuscles: exercise.secondaryMuscles,
          mechanic: exercise.mechanic,
          recommendedRestSeconds: restTime,
          createdAt: now,
          isAIRecommended: true,
          sets: [
            {
              id: generateUUID(),
              weight: recommendation.smartWeight.weight, // 使用AI推荐的重量
              reps: parseInt(recommendation.reps.split('-')[0]) || 8, // 使用推荐次数的下限
              completed: false
            },
          ],
        };

        // 如果是第一个动作，设置训练开始时间
        if (activeWorkout.length === 0 && !workoutStartTime) {
          setWorkoutStartTime(Date.now());
        }

        setActiveWorkout(prev => [...prev, newActiveExercise]);

        setNotification({
          message: `已添加 ${exercise.name}，预设重量 ${recommendation.smartWeight.weight}kg`,
          visible: true
        });
      }
    } else {
      setNotification({
        message: '未找到对应的动作',
        visible: true
      });
    }

    // 记录反馈
    EnhancedAIRecommendationServiceV2.recordRecommendationFeedback(
      recommendation.exerciseName,
      recommendation.smartWeight.weight,
      recommendation.smartWeight.weight, // 假设用户接受了推荐重量
      'helpful'
    );

    setTimeout(() => setNotification(null), 3000);
  };

  // 生成基于历史数据的AI推荐
  const generateHistoryBasedRecommendations = () => {
    console.log('🔍 Starting history-based recommendation generation...');
    console.log('📚 Exercise library size:', unifiedExerciseLibrary.length);
    const context = {
      userProfile,
      currentWorkout: activeWorkout,
      recoveryState,
      recentWorkouts: history.slice(-5).map(session => session.exercises),
      workoutHistory: history,
      exerciseLibrary: unifiedExerciseLibrary,
    };

    const recommendations = EnhancedAIRecommendationServiceV2.generateHistoryBasedRecommendations(
      context,
      undefined,
      3
    );

    setHistoryBasedRecommendations(recommendations);
  };

  const handleDismissRecommendation = (recommendationId: string) => {
    setDismissedRecommendations(prev => new Set([...prev, recommendationId]));
    setAiRecommendations(prev => prev.filter(r => r.id !== recommendationId));
  };

  // Generate AI recommendations when workout changes
  useEffect(() => {
    if (activeWorkout.length > 0) {
      generateAIRecommendations();
    }
  }, [activeWorkout.length, recoveryState]);

  // --- RENDER SCREENS ---
  const renderHomeScreen = () => (
    <div className="flex flex-col animate-fade-in px-6 pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Hello, <span className="text-emerald-400">Athlete</span></h1>
          <p className="text-slate-400">Ready to crush your goals?</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleOpenProfile}
            className="p-3 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl text-slate-400 hover:text-white transition-all duration-300 backdrop-blur-sm shadow-lg shadow-slate-900/50"
            title="用户资料"
          >
            <User size={24} />
          </button>
          <button
            onClick={handleLogout}
            className="p-3 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl text-slate-400 hover:text-rose-400 transition-all duration-300 backdrop-blur-sm shadow-lg shadow-slate-900/50"
            title="登出"
          >
            <LogOut size={24} />
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => {
            setIsSelectionMode(false);
            setShowExerciseSelector(true);
          }}
          disabled={isLoadingWorkout}
          className={`bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all duration-300 active:scale-95 flex flex-col items-center gap-3 group hover:shadow-emerald-500/30 ${isLoadingWorkout ? 'opacity-70' : ''}`}
        >
          <div className="bg-white/20 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
            {isLoadingWorkout ? <Loader2 size={28} className="text-white animate-spin" /> : <Dumbbell size={28} className="text-white" />}
          </div>
          <span className="font-bold text-lg">{isLoadingWorkout ? 'Adding...' : 'Start Workout'}</span>
        </button>

        <button
          onClick={() => setCurrentScreen(AppScreen.HISTORY)}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 text-white p-5 rounded-2xl transition-all duration-300 active:scale-95 flex flex-col items-center gap-3 group hover:border-emerald-500/50 hover:shadow-emerald-500/10"
        >
          <div className="bg-slate-700 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
            <LineChart size={28} className="text-emerald-400" />
          </div>
          <span className="font-bold text-lg">Progress</span>
        </button>
      </div>

      {/* AI Coach Control Bar - 替换 DEBUG AI Recommendations 位置 */}
      <AIControlBar />

      {/* AI RECOMMENDATIONS SECTION */}
      {(historyBasedRecommendations.length > 0 || enhancedAiRecommendations.length > 0 || aiRecommendations.length > 0) && (
        <div className="mb-8">
          {/* 🔍 DEBUG: 显示推荐状态（仅开发环境） */}
          {import.meta.env.DEV && (
            <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 text-xs">
              <div>🔍 DEBUG AI Recommendations:</div>
              <div>History-based: {historyBasedRecommendations.length}</div>
              <div>Enhanced: {enhancedAiRecommendations.length}</div>
              <div>Basic: {aiRecommendations.length}</div>
              <div>Show History AI: {showHistoryBasedAI ? 'true' : 'false'}</div>
            </div>
          )}

          {/* 🆕 优先显示基于历史数据的AI推荐 */}
          {historyBasedRecommendations.length > 0 ? (
            <HistoryBasedAIRecommendationPanel
              context={{
                userProfile,
                currentWorkout: activeWorkout,
                recoveryState,
                recentWorkouts: history.slice(-5).map(session => session.exercises),
                workoutHistory: history,
                exerciseLibrary: unifiedExerciseLibrary,
              }}
              onAcceptRecommendation={handleAcceptHistoryBasedRecommendation}
              isExpanded={showHistoryBasedAI}
              onToggleExpanded={setShowHistoryBasedAI}
            />
          ) : (
            <CollapsibleSection
              title="AI智能推荐"
              defaultExpanded={false}
              animationDuration={400}
            >
              {enhancedAiRecommendations.length > 0 ? (
                <EnhancedAIRecommendationPanel
                  recommendations={enhancedAiRecommendations}
                  onAcceptRecommendation={handleAcceptEnhancedRecommendation}
                  onDismissRecommendation={(id) => {
                    setDismissedRecommendations(prev => new Set([...prev, id]));
                    setEnhancedAiRecommendations(prev => prev.filter(r => r.id !== id));
                  }}
                  onFeedback={handleAIRecommendationFeedback}
                  showDetails={true}
                />
              ) : (
                <AIRecommendationPanel
                  recommendations={aiRecommendations}
                  onAcceptRecommendation={handleAcceptRecommendation}
                  onDismissRecommendation={handleDismissRecommendation}
                  showDetails={true}
                />
              )}
            </CollapsibleSection>
          )}
        </div>
      )}


      {/* AI WEEKLY SUMMARY - 每周训练总结 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">AI Training Summary</h2>
          <button
            onClick={() => setShowWeeklySummaryModal(true)}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-bold transition-colors"
          >
            View Details →
          </button>
        </div>
        <WeeklySummaryCard
          userProfile={userProfile}
          recoveryState={recoveryState}
          onOpenFullAnalysis={() => setShowWeeklySummaryModal(true)}
        />
      </div>

      {/* WEEKLY TRAINING COACH - 实时训练建议 */}
      {(() => {
        // Filter current week sessions from history
        const now = new Date();
        const currentWeek = getWeekInfo(now);
        const currentWeekSessions = history.filter(session => {
          const sessionDate = new Date(session.date);
          const sessionWeek = getWeekInfo(sessionDate);
          return sessionWeek.year === currentWeek.year && sessionWeek.weekNumber === currentWeek.weekNumber;
        });
        
        return (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Training Coach</h2>
            </div>
            <WeeklyTrainingCoachCardWithAI
              currentWeekSessions={currentWeekSessions}
              lastWeekReport={weeklyReports.previous}
              recoveryState={recoveryState}
              userProfile={userProfile}
              onSelectExercise={(exercise) => handleAddExercise(exercise, true)}
              activeWorkout={activeWorkout}
              routines={routines}
              onStartRoutine={handleStartRoutine}
              exercises={(() => {
                const allExercises = unifiedExerciseLibrary;
                const uniqueExercises = Array.from(
                  new Map(allExercises.map(ex => [ex.id, ex])).values()
                );
                return uniqueExercises;
              })()}
              onAddExercise={handleAddExercise}
              onRemoveExercise={(exercise) => handleRemoveExerciseById(exercise.id)}
              onAddExercisesToRoutine={handleAddExercisesToRoutine}
              onRemoveExerciseFromWorkout={handleRemoveExerciseById}
              onRemoveExerciseFromRoutine={handleRemoveExerciseFromRoutine}
            />
          </div>
        );
      })()}

      {/* WEEKLY REPORTS SECTION */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Weekly Reports</h2>
          <button
            onClick={() => setShowWeeklyReportViewer(true)}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-bold transition-colors"
          >
            View All →
          </button>
        </div>
        <button
          onClick={() => setShowWeeklyReportViewer(true)}
          className="w-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4 text-left hover:from-emerald-500/20 hover:to-teal-500/20 transition-all duration-300 backdrop-blur-sm shadow-lg shadow-emerald-500/5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white mb-1">Export Training Reports</h3>
              <p className="text-slate-400 text-sm">Generate SVG, PDF, and PNG reports</p>
            </div>
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm border border-emerald-500/30">
              <FileImage size={24} className="text-emerald-400" />
            </div>
          </div>
        </button>
      </div>

      {/* MY ROUTINES SECTION */}
      <RoutineBuilder
        routines={routines}
        onCreateRoutine={() => {
          setEditingRoutine(null);
          setRoutineName('');
          setSelectedRoutineExercises([]);
          setShowRoutineCreator(true);
        }}
        onDeleteRoutine={handleDeleteRoutine}
        onStartRoutine={handleStartRoutine}
        onEditRoutine={handleEditRoutine}
      />

      {/* RECOVERY STATUS */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Recovery Status</h2>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-4 border border-slate-700/50 backdrop-blur-sm shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            {(recoveryState || []).slice(0, 4).map((status) => {
              const percentage = status.recoveryPercentage || calculateRecoveryPercentage(status.lastWorked, 72);
              return (
                <div key={status.muscle} className="bg-gradient-to-br from-slate-700/30 to-slate-800/30 p-4 rounded-xl border border-slate-600/30 backdrop-blur-sm hover:border-emerald-500/50 transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-slate-300 text-sm font-bold uppercase">{status.muscle}</span>
                    <div className={`w-3 h-3 rounded-full ${percentage > 80 ? 'bg-emerald-500' : percentage > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                  </div>
                  <div className="text-white font-bold text-xl">{Math.round(percentage)}%</div>
                </div>
              );
            })}
          </div>

          {/* Quick Recovery Visualization */}
        </div>
      </div>

      {/* DEBUG PANEL - iOS Debugging (only shows when there are logs) */}
      {debugLogs.length > 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-50">
          {/* Toggle Button */}
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="mb-2 px-3 py-2 bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-2"
          >
            <Bug size={14} />
            Debug ({debugLogs.length})
            {showDebugPanel ? '▼' : '▶'}
          </button>
          
          {/* Log Panel */}
          {showDebugPanel && (
            <div className="bg-slate-950/95 border border-red-500/30 rounded-xl p-3 shadow-2xl max-h-60 overflow-auto">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                <span className="text-red-400 text-xs font-bold">iOS Debug Console</span>
                <button
                  onClick={() => { setDebugLogs([]); setShowDebugPanel(false); }}
                  className="text-slate-500 hover:text-white text-xs"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1 font-mono text-[10px] leading-tight">
                {debugLogs.map((log, i) => (
                  <div key={i} className={`break-words ${log.startsWith('❌') ? 'text-red-400' : log.startsWith('⚠️') ? 'text-amber-400' : 'text-slate-400'}`}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Handle muscle selection for workout
  const handleMuscleSelectForWorkout = (muscle: MuscleGroup) => {
    setSelectedMuscleForWorkout(muscle);
    setShowMuscleSelector(false);
    setShowExerciseSelector(true);
  };

  const handleAskAI = async (exerciseName: string) => {
    setModalContent({
      title: `ZenFit AI: ${exerciseName}`,
      content: (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-emerald-500 h-8 w-8" />
        </div>
      )
    });

    const tip = await getExerciseTip(exerciseName);

    setModalContent({
      title: `ZenFit AI: ${exerciseName}`,
      content: <p className="text-slate-300 text-lg leading-relaxed">{tip}</p>
    });
  };

  // Handle navigation with modal cleanup
  const handleNavigate = (screen: AppScreen) => {
    // Close all selector modals when navigating
    setShowExerciseSelector(false);
    setShowExerciseLibraryView(false);
    setShowMuscleSelector(false);
    setSelectedMuscleForWorkout(null);
    setCurrentScreen(screen);
  };

  const NavButton = ({ screen, icon: Icon, label, active }: any) => (
    <button
      onClick={() => handleNavigate(screen)}
      className={`flex flex-col items-center justify-center w-full py-2 transition-all duration-300 ${active ? 'text-emerald-500 -translate-y-1' : 'text-slate-500 hover:text-slate-300'
        }`}
    >
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium mt-0.5">{label}</span>
    </button>
  );




  const renderContent = () => {
    switch (currentScreen) {
      case AppScreen.HOME:
        return renderHomeScreen();
      case AppScreen.WORKOUT:
        // Show InProgressWorkout if there are active exercises, otherwise show WorkoutLogger
        if (activeWorkout.length > 0) {
          return (
            <InProgressWorkout
              exercises={activeWorkout}
              onExerciseUpdate={(exerciseId, updatedExercise) => {
                setActiveWorkout(prev => prev.map(ex =>
                  ex.id === exerciseId ? updatedExercise : ex
                ));
              }}
              onSetComplete={(exerciseId, setId) => {
                const exerciseIndex = activeWorkout.findIndex(ex => ex.id === exerciseId);
                const setIndex = activeWorkout[exerciseIndex]?.sets.findIndex(s => s.id === setId);
                if (exerciseIndex !== -1 && setIndex !== -1) {
                  handleUpdateSet(exerciseIndex, setIndex, 'completed', true);
                }
              }}
              onSetReset={(exerciseId, setId) => {
                const exerciseIndex = activeWorkout.findIndex(ex => ex.id === exerciseId);
                const setIndex = activeWorkout[exerciseIndex]?.sets.findIndex(s => s.id === setId);
                if (exerciseIndex !== -1 && setIndex !== -1) {
                  handleUpdateSet(exerciseIndex, setIndex, 'completed', false);
                }
              }}
              onAddSet={(exerciseId) => {
                const exerciseIndex = activeWorkout.findIndex(ex => ex.id === exerciseId);
                if (exerciseIndex !== -1) {
                  handleAddSet(exerciseIndex);
                }
              }}
              onRemoveSet={(exerciseId, setId) => {
                const exerciseIndex = activeWorkout.findIndex(ex => ex.id === exerciseId);
                const setIndex = activeWorkout[exerciseIndex]?.sets.findIndex(s => s.id === setId);
                if (exerciseIndex !== -1 && setIndex !== -1) {
                  handleRemoveSet(exerciseIndex, setIndex);
                }
              }}
              onRemoveExercise={(exerciseId) => {
                const exerciseIndex = activeWorkout.findIndex(ex => ex.id === exerciseId);
                if (exerciseIndex !== -1) {
                  handleRemoveExercise(exerciseIndex);
                }
              }}
              onClearAllExercises={handleClearAllExercises}
              onFinishWorkout={handleFinishWorkout}
              onSaveAsRoutine={handleSaveActiveWorkoutAsRoutine}
              workoutDuration={workoutStartTime ? Math.floor((Date.now() - workoutStartTime) / 1000) : 0}
              timers={timers}
              onToggleTimer={toggleTimer}
              exerciseLibrary={(() => {
                // Create a complete exercise library with deduplication
                const allExercises = unifiedExerciseLibrary;
                const uniqueExercises = Array.from(
                  new Map(allExercises.map(ex => [ex.id, ex])).values()
                );
                return uniqueExercises;
              })()}
              userProfile={userProfile}
            />
          );
        } else {
          return (
            <WorkoutLogger
              activeWorkout={activeWorkout}
              timers={timers}
              onToggleTimer={toggleTimer}
              onUpdateSet={handleUpdateSet}
              onAddSet={handleAddSet}
              onRemoveSet={handleRemoveSet}
              onFinishWorkout={handleFinishWorkout}
              onRemoveExercise={handleRemoveExercise}
              exerciseLibrary={(() => {
                const allExercises = unifiedExerciseLibrary;
                const uniqueExercises = Array.from(
                  new Map(allExercises.map(ex => [ex.id, ex])).values()
                );
                return uniqueExercises;
              })()}
              userProfile={userProfile}
              onAddExercise={handleAddExercise}
            />
          );
        }
      case AppScreen.HISTORY:
        return <ProgressView
          history={history}
          recoveryState={recoveryState}
          userProfile={userProfile}
          onDeleteSession={deleteSession}
          onCopyToActiveWorkout={handleCopyWorkoutToActive}
        />;
      default:
        return <div className="text-white p-10 text-center">Coming Soon</div>;
    }
  };

  return (
    <div className="h-full relative text-slate-200 font-sans bg-slate-950 selection:bg-emerald-500/30 selection:text-emerald-200">
        {/* Global Toast Notification - FIXED POSITION */}
        <GlobalTimer
          activeTimers={timers}
          onToggleTimer={toggleTimer}
          onFinishTimer={handleFinishTimer}
        />

        {/* Weekly Report Notification - 修复 pointer-events 避免遮挡下方内容 */}
        {weeklyReportNotification?.show && (
          <div
            className="fixed left-0 right-0 z-[100] flex justify-center pointer-events-none"
            style={{ top: '80px' }}
          >
            <div
              onClick={handleDismissWeeklyReportNotification}
              className="pointer-events-auto bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-3 rounded-xl shadow-2xl animate-slide-up max-w-sm mx-4 w-full cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <LineChart size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">Weekly Report Ready!</p>
                    <p className="text-xs text-purple-50 opacity-90 truncate">
                      Week {weeklyReportNotification.weekNumber}, {weeklyReportNotification.year} can be generated
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismissWeeklyReportNotification();
                  }}
                  className="text-white/70 hover:text-white p-1 flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={handleGenerateWeeklyReport}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors"
                >
                  Generate Report
                </button>
                <button
                  onClick={handleDismissWeeklyReportNotification}
                  className="px-3 py-2 text-white/70 hover:text-white text-sm transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🆕 数据恢复提示 - 修复 pointer-events 避免遮挡下方内容 */}
        {hasRestoredData && (
          <div
            className="fixed left-0 right-0 z-[95] flex justify-center pointer-events-none"
            style={{ top: weeklyReportNotification?.show ? '100px' : '80px' }}
          >
            <div
              onClick={() => { setCurrentScreen(AppScreen.WORKOUT); }}
              className="pointer-events-auto bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up cursor-pointer hover:from-blue-400 hover:to-indigo-400 transition-colors max-w-sm mx-4 w-full"
            >
              <div className="bg-white/20 p-2 rounded-full"><Bell size={18} className="animate-bounce" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">训练数据已恢复</p>
                <p className="text-xs text-blue-50 opacity-90 truncate">检测到未完成的训练，点击继续</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // 仅关闭提示，不删除恢复的数据
                  dismissRestoredNotification();
                }}
                className="text-white/70 hover:text-white p-1 flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* 通知提示 - 修复 pointer-events 避免遮挡下方内容 */}
        {notification && notification.visible && (
          <div
            className="fixed left-0 right-0 z-[90] flex justify-center pointer-events-none"
            style={{ top: weeklyReportNotification?.show || hasRestoredData ? '100px' : '80px' }}
          >
            <div
              onClick={() => { setCurrentScreen(AppScreen.WORKOUT); setNotification(null); }}
              className="pointer-events-auto bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up cursor-pointer hover:bg-emerald-400 transition-colors max-w-sm mx-4 w-full"
            >
              <div className="bg-white/20 p-2 rounded-full"><Bell size={18} className="animate-bounce" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">Notification</p>
                <p className="text-xs text-emerald-50 opacity-90 truncate">{notification.message}</p>
              </div>
            </div>
          </div>
        )}

        <main className="absolute inset-0 overflow-y-auto pt-safe">
          <div className="absolute top-0 left-0 w-full h-96 bg-emerald-900/5 rounded-b-[3rem] pointer-events-none blur-3xl" />
          {renderContent()}
          {/* 底部导航栏占位（含 safe-area） */}
          <div className="h-24" />
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/50 pb-safe-nav">
          <div className="max-w-md mx-auto pointer-events-auto">
            <nav className="flex justify-around items-center px-2 py-2">
              <NavButton
                screen={AppScreen.HOME}
                icon={LayoutGrid}
                label="Home"
                active={currentScreen === AppScreen.HOME}
              />
              <div className="relative -top-4">
                <button
                  onClick={() => handleNavigate(AppScreen.WORKOUT)}
                  className={`h-14 w-14 rounded-full flex items-center justify-center shadow-2xl shadow-black transition-all duration-300 border-[5px] border-slate-950 ${currentScreen === AppScreen.WORKOUT
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white rotate-180 scale-105'
                    : 'bg-gradient-to-br from-slate-800 to-slate-700 text-emerald-500 hover:from-emerald-600 hover:to-teal-600 hover:text-white'
                    }`}
                >
                  <Dumbbell size={27} fill={currentScreen === AppScreen.WORKOUT ? "currentColor" : "none"} />
                  {activeWorkout.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-br from-rose-500 to-rose-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-slate-950 animate-fade-in">
                      {activeWorkout.length}
                    </span>
                  )}
                </button>
              </div>
              <NavButton
                screen={AppScreen.HISTORY}
                icon={LineChart}
                label="Progress"
                active={currentScreen === AppScreen.HISTORY}
              />
            </nav>
          </div>
        </div>

        {
          modalContent && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-slate-900 w-full max-w-sm rounded-[2rem] border border-slate-800 shadow-2xl p-6 transform animate-slide-up relative ring-1 ring-white/10">
                {!modalContent.title.includes("Finishing") && (
                  <button
                    onClick={() => setModalContent(null)}
                    className="absolute top-5 right-5 text-slate-500 hover:text-white bg-slate-800/50 p-1 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
                <div className="flex items-center gap-3 mb-6">
                  {!modalContent.title.includes("Finishing") && (
                    <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                      <Sparkles className="text-emerald-500" size={20} />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white tracking-tight">{modalContent.title}</h3>
                </div>
                {modalContent.content}
              </div>
            </div>
          )
        }

        {/* ROUTINE CREATOR MODAL */}
        <RoutineCreator
          isOpen={showRoutineCreator}
          onClose={() => {
            setShowRoutineCreator(false);
            setEditingRoutine(null);
          }}
          onSave={async (name, exercises) => {
            // 🆕 防止重复保存 - 检查是否已经在保存中
            if ((window as any).__savingRoutine) {
              console.warn('⚠️ Already saving routine, please wait...');
              return;
            }

            try {
              // 设置保存标志
              (window as any).__savingRoutine = true;

              // 显示加载提示
              setNotification({
                message: 'Saving routine...',
                visible: true
              });

              if (editingRoutine) {
                // Update existing routine
                const updatedRoutine = { ...editingRoutine, name, exercises };

                // ✅ 检查是否是后端ID（UUID格式）
                const isBackendId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingRoutine.id);

                if (isBackendId && isAuthenticated && user) {
                  // 🆕 只有后端ID且用户已认证才尝试同步更新到后端
                  try {
                    console.log('🔄 Updating routine in backend:', editingRoutine.id);
                    await RoutineSyncService.updateRoutineInBackend(updatedRoutine);
                    console.log('✅ Routine updated in backend successfully!');
                  } catch (error) {
                    console.error('❌ Failed to update routine in backend:', error);
                    setNotification({
                      message: 'Failed to sync to backend, saved locally',
                      visible: true
                    });
                    setTimeout(() => setNotification(null), 2000);
                  }
                } else {
                  console.log('🔄 Updating local-only routine:', editingRoutine.id);
                }

                setRoutines(prev => prev.map(r =>
                  r.id === editingRoutine.id ? updatedRoutine : r
                ));

                setNotification({
                  message: 'Routine updated!',
                  visible: true
                });
              } else {
                // Create new routine
                const now = getCurrentTimestamp();
                const newRoutine: Routine = {
                  id: generateUUID(), // ✅ 使用UUID而不是Date.now()
                  name: name,
                  exercises: exercises,
                  createdAt: now
                };

                // 🆕 检查是否已存在同名routine（防止重复）
                const existingRoutine = routines.find(r =>
                  r.name.toLowerCase().trim() === name.toLowerCase().trim()
                );

                if (existingRoutine) {
                  console.warn('⚠️ Routine with same name already exists:', name);
                  setNotification({
                    message: `Routine "${name}" already exists!`,
                    visible: true
                  });
                  setTimeout(() => setNotification(null), 2000);
                  return;
                }

                // 🆕 先添加到本地状态（立即反馈）
                setRoutines(prev => [...prev, newRoutine]);

                // 🆕 然后异步同步到后端
                if (isAuthenticated && user) {
                  try {
                    console.log('🔄 Syncing new routine to backend...');
                    const backendId = await RoutineSyncService.syncRoutineToBackend(newRoutine);

                    if (backendId) {
                      // 更新本地routine的ID为后端ID
                      setRoutines(prev => prev.map(r =>
                        r.id === newRoutine.id ? { ...r, id: backendId } : r
                      ));
                      console.log('✅ Routine synced to backend successfully!');
                    }
                  } catch (error) {
                    console.error('❌ Failed to sync routine to backend:', error);
                    // 不影响用户体验，routine已经保存在本地
                  }
                }

                setNotification({
                  message: 'Routine created!',
                  visible: true
                });
              }

              // 关闭模态框并清理状态
              setShowRoutineCreator(false);
              setEditingRoutine(null);
              setRoutineName('');
              setSelectedRoutineExercises([]);
              setIsSelectionMode(false);

              // 清除通知
              setTimeout(() => setNotification(null), 2000);
            } finally {
              // 清除保存标志
              (window as any).__savingRoutine = false;
            }
          }}
          exercises={selectedRoutineExercises}
          onUpdateExercises={setSelectedRoutineExercises}
          onManualAdd={() => {
            // 保持当前已选择的动作，不要清空
            // selectedRoutineExercises 已经通过 RoutineCreator 的 exercises prop 传入
            setIsSelectionMode(true);
            setShowExerciseLibraryView(true);
          }}
          recoveryState={recoveryState}
          exerciseLibrary={unifiedExerciseLibrary}
          onViewHistory={() => setCurrentScreen(AppScreen.HISTORY)}
          userProfile={userProfile}
          editingRoutine={editingRoutine}
        />

        {/* EXERCISE SELECTOR MODAL */}
        {
          showExerciseSelector && (
            <div className="fixed inset-0 bg-slate-950 z-40 pt-safe">
              <ExerciseSelector
                key={`selector-${selectedMuscleForWorkout || 'none'}`}
                onSelectExercise={(exercise) => {
                  handleAddExercise(exercise);
                  // Don't close the selector, allow continuous selection
                }}
                activeWorkoutStats={activeWorkoutStats}
                activeWorkout={activeWorkout}
                exercises={unifiedExerciseLibrary}
                exerciseFrequency={exerciseFrequency}
                onOpenProfile={handleOpenProfile}
                userProfile={userProfile}
                isSelectionMode={isSelectionMode}
                selectedExerciseIds={selectedRoutineExercises.map(e => e.id)}
                onToggleSelection={handleToggleSelection}
                onFinishSelection={() => setShowExerciseSelector(false)}
                onClose={() => {
                  if (selectedMuscleForWorkout) {
                    // If we came from muscle selection, go back to muscle selector
                    setShowExerciseSelector(false);
                    setShowMuscleSelector(true);
                    setSelectedMuscleForWorkout(null);
                  } else {
                    // If we came from "All Exercises", close completely
                    setShowExerciseSelector(false);
                    setSelectedMuscleForWorkout(null);
                  }
                }}
                onRemoveExercise={handleRemoveExerciseById}
                onAddToRoutine={handleAddToRoutine}
                selectedMuscleGroup={selectedMuscleForWorkout}
                forceListView={false}
              />
            </div>
          )
        }

        {/* EXERCISE LIBRARY VIEW MODAL - Using ExerciseSelector for better performance */}
        {showExerciseLibraryView && (
          <div className="fixed inset-0 bg-slate-950 z-[100] pt-safe">
            <ExerciseSelector
              key="selector-library"
              onSelectExercise={(exercise) => {
                // 在非选择模式下，添加到训练并关闭视图
                // 在选择模式下，这个回调不应该被调用（由 onToggleSelection 处理）
                if (!isSelectionMode) {
                  handleAddExercise(exercise);
                  setShowExerciseLibraryView(false);
                }
              }}
              activeWorkoutStats={activeWorkoutStats}
              activeWorkout={activeWorkout}
              exercises={unifiedExerciseLibrary}
              exerciseFrequency={exerciseFrequency}
              onOpenProfile={handleOpenProfile}
              userProfile={userProfile}
              isSelectionMode={isSelectionMode}
              selectedExerciseIds={selectedRoutineExercises.map(e => e.id)}
              onToggleSelection={handleToggleSelection}
              onFinishSelection={() => {
                setShowExerciseLibraryView(false);
                setIsSelectionMode(false);
              }}
              onClose={() => setShowExerciseLibraryView(false)}
              onRemoveExercise={handleRemoveExerciseById}
              onAddToRoutine={handleAddToRoutine}
              forceListView={true}
            />
          </div>
        )}

        {/* ADD TO ROUTINE MODAL */}
        {
          showAddToRoutineModal && pendingRoutineExercise && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-800 p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Add to Routine</h3>
                  <button onClick={() => setShowAddToRoutineModal(false)} className="p-2 text-slate-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setSelectedRoutineExercises([pendingRoutineExercise]);
                      setShowAddToRoutineModal(false);
                      setShowRoutineCreator(true);
                    }}
                    className="w-full p-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus size={20} />
                    Create New Routine
                  </button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-900 px-2 text-slate-500">Or add to existing</span>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {routines.length === 0 ? (
                      <p className="text-center text-slate-500 py-4 text-sm">No existing routines</p>
                    ) : (
                      routines.map(routine => (
                        <button
                          key={routine.id}
                          onClick={() => confirmAddToRoutine(routine.id)}
                          className="w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-colors group"
                        >
                          <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{routine.name}</div>
                          <div className="text-xs text-slate-400">{routine.exercises.length} exercises</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* MUSCLE SELECTOR MODAL - Full Screen */}
        {showMuscleSelector && (
          <div className="fixed inset-0 bg-slate-950 z-40 pt-safe">
            <div className="flex flex-col h-full max-w-md mx-auto">
              <div className="px-6 pt-2 mb-2 flex justify-between items-start z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowMuscleSelector(false)}
                      className="p-1 -ml-2 text-slate-400 hover:text-white"
                    >
                      <X size={24} />
                    </button>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Anatomy Map</h2>
                  </div>
                  <p className="text-slate-400 text-sm mt-1">Select target muscle / 点击肌肉选择</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleOpenProfile} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400 hover:text-white backdrop-blur-sm flex items-center gap-2">
                    <User size={20} />
                    <span className="text-xs font-bold">{userProfile.weight}kg</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMuscleSelector(false);
                      setSelectedMuscleForWorkout(null);
                      setIsSelectionMode(false);
                      setShowExerciseSelector(true);
                    }}
                    className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400 hover:text-white backdrop-blur-sm"
                    title="Browse All Exercises"
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>

              <MuscleAnatomyViewer
                bodyFacing={bodyFacing}
                onBodyFacingChange={setBodyFacing}
                onMuscleSelect={handleMuscleSelectForWorkout}
                activeMuscles={Array.from(new Set(activeWorkout.map(ex => ex.muscleGroup)))}
                size="lg"
                className="flex-1"
              />
            </div>
          </div>
        )}

      {/* Profile Setup - Show on first launch */}
      {showProfileSetup && (
        <ProfileSetup onComplete={handleCompleteProfileSetup} />
      )}

      {/* Profile View - Bento Style */}
      {showProfileView && (
        <ProfileView
          isOpen={showProfileView}
          onClose={() => setShowProfileView(false)}
          profile={userProfile}
          onEdit={handleOpenEditor}
          onHealthSettings={() => {
            setShowProfileView(false);
            navigate('/health-settings');
          }}
          healthTimestamps={lastSampleDates}
          staleMetrics={staleMetrics}
        />
      )}

      {/* Profile Editor Modal */}
      {showProfileEditor && (
        <ProfileEditorModal
          isOpen={showProfileEditor}
          onClose={() => setShowProfileEditor(false)}
          currentProfile={userProfile}
          onSave={handleSaveProfile}
        />
      )}

      {/* Weekly Report Viewer */}
      {showWeeklyReportViewer && (
        <WeeklyReportViewer
          isOpen={showWeeklyReportViewer}
          onClose={() => setShowWeeklyReportViewer(false)}
        />
      )}

      {/* Weekly Summary Modal - AI每周训练总结 */}
      <WeeklySummaryModal
        isOpen={showWeeklySummaryModal}
        onClose={() => setShowWeeklySummaryModal(false)}
        userProfile={userProfile}
        recoveryState={recoveryState}
      />

      {/* Confirm Dialog - 移动端友好的确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div >
  );
};

// Removed createRoot code - MainApp is now exported as a component
// to be used in the main App.tsx routing system
