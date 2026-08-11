import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MuscleGroup } from '@/shared/types';
import type { Exercise, ActiveExercise } from '@/shared/types';
import { INITIAL_EXERCISES } from '@/shared/constants/initial_exercises';
import { Search, ChevronLeft, List, RefreshCw, User, X, CheckCircle2, Dumbbell } from 'lucide-react';
import MuscleAnatomyViewer from '@/features/anatomy/components/MuscleAnatomyViewer';
import HeroExerciseCard from './HeroExerciseCard';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

interface ExerciseSelectorProps {
  onSelectExercise: (exercise: Exercise) => void;
  onAskAI: (exerciseName: string) => void;
  activeWorkoutStats: { compound: number; isolation: number; total: number };
  activeWorkout: ActiveExercise[];
  commonExercises: Exercise[];
  comprehensiveExercises: Exercise[];
  onMoveToCommon: (id: string) => void;
  onMoveToComprehensive: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenProfile: () => void;
  userProfile: { weight: number, unit: 'kg' | 'lbs' };
  isSelectionMode?: boolean;
  selectedExerciseIds?: string[];
  onToggleSelection?: (exercise: Exercise) => void;
  onFinishSelection?: () => void;
  onClose?: () => void;
  onRemoveExercise?: (exerciseId: string) => void;
  onAddToRoutine?: (exercise: Exercise) => void;
  selectedMuscleGroup?: MuscleGroup | null;
  forceListView?: boolean;
}


const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  onSelectExercise,
  onAskAI,
  activeWorkoutStats,
  activeWorkout,
  commonExercises,
  comprehensiveExercises,
  onMoveToCommon,
  onMoveToComprehensive,
  onToggleFavorite,
  onOpenProfile,
  userProfile,
  onClose,
  isSelectionMode,
  selectedExerciseIds,
  onToggleSelection,
  onFinishSelection,
  onRemoveExercise,
  onAddToRoutine,
  selectedMuscleGroup,
  forceListView
}) => {
  const { toasts, showSuccess, removeToast } = useToast();
  const [viewState, setViewState] = useState<'model' | 'list'>(
    forceListView ? 'list' : (selectedMuscleGroup ? 'list' : 'model')
  );
  const [activeTab, setActiveTab] = useState<'common' | 'comprehensive'>('common');
  const [bodyFacing, setBodyFacing] = useState<'front' | 'back'>('front');
  const [selectedCategory, setSelectedCategory] = useState<MuscleGroup | 'All'>(selectedMuscleGroup || 'All');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredMuscleId, setHoveredMuscleId] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(50); // Increased initial limit
  const observerTarget = useRef<HTMLDivElement>(null);

  // Filter Logic
  const availableEquipment = useMemo(() => {
    const sourceList = (activeTab === 'common' ? commonExercises : comprehensiveExercises) || [];
    const exercisesInGroup = sourceList.filter(
      ex => selectedCategory === 'All' || ex.muscleGroup === selectedCategory
    );
    const equipmentSet = new Set(exercisesInGroup.map(ex => ex.equipment || 'Other'));
    return ['All', ...Array.from(equipmentSet).sort()];
  }, [selectedCategory, activeTab, commonExercises, comprehensiveExercises]);

  const filteredExercises = useMemo(() => {
    const sourceList = (activeTab === 'common' ? commonExercises : comprehensiveExercises) || [];
    const filtered = sourceList.filter((ex) => {
      const searchLower = searchTerm.toLowerCase();

      // Search in exercise name (English and Chinese)
      const matchesName =
        ex.name.toLowerCase().includes(searchLower) ||
        (ex.nameZh && ex.nameZh.includes(searchTerm));

      // Search in muscle group
      const matchesMuscleGroup = ex.muscleGroup.toLowerCase().includes(searchLower);

      // Search in secondary muscles
      const matchesSecondaryMusclesSearch = ex.secondaryMuscles?.some(
        muscle => muscle.toLowerCase().includes(searchLower)
      ) || false;

      // Search in equipment (English and Chinese)
      const matchesEquipment = (ex.equipment || 'Other').toLowerCase().includes(searchLower) ||
        ((ex as any).equipment_type_zh && (ex as any).equipment_type_zh.includes(searchTerm));

      // Search in detailed muscle IDs (biceps, triceps, glutes, etc.)
      const matchesMuscleIds = ex.muscle_ids?.some(
        muscleId => muscleId.toLowerCase().includes(searchLower)
      ) || false;

      // Search in difficulty
      const matchesDifficulty = ex.difficulty?.toLowerCase().includes(searchLower) || false;

      // Search in mechanic
      const matchesMechanic = ex.mechanic?.toLowerCase().includes(searchLower) || false;

      // Combine all search matches
      const matchesSearch = matchesName || matchesMuscleGroup || matchesSecondaryMusclesSearch ||
        matchesEquipment || matchesMuscleIds || matchesDifficulty || matchesMechanic;

      // Category Filter Logic (Updated for Detailed Muscles)
      let categoryToMatch = selectedCategory;

      // Special handling for rear shoulders on back view
      // When on back view and Shoulders is selected, we want to match "rear-shoulders"
      const shouldMatchRearShoulders = bodyFacing === 'back' && selectedCategory === MuscleGroup.SHOULDERS;

      // Check if exercise matches the selected category
      const isPrimaryMatch = ex.muscleGroup === selectedCategory;

      const isSecondaryMatch = selectedCategory !== 'All' && (
        // Check if the selected category is in the exercise's muscle_ids
        // Use .includes() to match variations like "traps", "traps-middle", etc.
        ex.muscle_ids?.some(id => {
          const idLower = id.toLowerCase();
          const categoryLower = categoryToMatch.toLowerCase();

          // Special case: on back view with shoulders selected, match rear-shoulders
          if (shouldMatchRearShoulders) {
            return idLower.includes('rear') && idLower.includes('shoulder');
          }

          // Normal matching
          return idLower.includes(categoryLower);
        }) ||
        // Check if the selected category is in the secondary muscles
        ex.secondaryMuscles?.includes(selectedCategory as MuscleGroup)
      );

      const matchesCategory = selectedCategory === 'All' || isPrimaryMatch || isSecondaryMatch;

      const matchesEquipmentFilter = selectedEquipment === 'All' || (ex.equipment || 'Other') === selectedEquipment;

      // Add isPrimaryMuscle flag to help with sorting
      if (matchesSearch && matchesCategory && matchesEquipmentFilter) {
        (ex as any).isPrimaryMuscle = isPrimaryMatch;
        return true;
      }
      return false;
    });

    // Sort exercises: primary muscle matches first, then secondary matches
    return filtered.sort((a, b) => {
      const aIsPrimary = (a as any).isPrimaryMuscle || false;
      const bIsPrimary = (b as any).isPrimaryMuscle || false;

      // Primary exercises come first
      if (aIsPrimary && !bIsPrimary) return -1;
      if (!aIsPrimary && bIsPrimary) return 1;

      // Within same category, sort by name
      return (a.nameZh || a.name).localeCompare(b.nameZh || b.name, 'zh-CN');
    });
  }, [searchTerm, selectedCategory, selectedEquipment, activeTab, commonExercises, comprehensiveExercises, bodyFacing]);

  // Simple Lazy Loading
  useEffect(() => {
    if (viewState !== 'list') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setDisplayLimit(prev => Math.min(prev + 20, filteredExercises.length));
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [filteredExercises, viewState]);

  useEffect(() => {
    setDisplayLimit(50);
    setIsFilterExpanded(true);
  }, [selectedCategory, searchTerm]);

  const handleCategorySelect = (category: MuscleGroup | 'All') => {
    setSelectedCategory(category);
    setSelectedEquipment('All');
    setViewState('list');
  };

  // Auto-navigate to list view if muscle group is pre-selected
  React.useEffect(() => {
    if (selectedMuscleGroup) {
      setSelectedCategory(selectedMuscleGroup);
      setViewState('list');
    }
  }, [selectedMuscleGroup]);

  const handleBack = () => {
    setViewState('model');
  };

  // Enhanced exercise selection with toast notification
  const handleSelectExercise = (exercise: Exercise) => {
    onSelectExercise(exercise);
    showSuccess(
      '动作已添加到训练计划',
      exercise.nameZh || exercise.name,
      {
        label: '查看训练',
        onClick: () => {
          if (onClose) onClose();
        }
      }
    );
  };

  // Calculate active muscles for viewer
  const activeMusclesForViewer = useMemo(() => {
    const muscles = Array.from(new Set(activeWorkout.map(ex => {
      const exercise = [...commonExercises, ...comprehensiveExercises].find(e => e.id === ex.exerciseId);
      return exercise?.muscleGroup;
    }).filter(Boolean) as MuscleGroup[]));
    return muscles;
  }, [activeWorkout, commonExercises, comprehensiveExercises]);

  if (viewState === 'model') {

    return (
      <div className="flex flex-col h-full animate-fade-in relative overflow-y-auto no-scrollbar max-w-md mx-auto w-full bg-slate-950">
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

        <div className="px-6 pt-2 mb-2 flex justify-between items-start z-10">
          <div>
            <div className="flex items-center gap-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 -ml-2 text-slate-400 hover:text-white"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              <h2 className="text-2xl font-bold text-white tracking-tight">Anatomy Map</h2>
            </div>
            <p className="text-slate-400 text-sm mt-1">Select target muscle / 点击肌肉选择</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onOpenProfile} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400 hover:text-white backdrop-blur-sm flex items-center gap-2">
              <User size={20} />
              <span className="text-xs font-bold">{userProfile.weight}kg</span>
            </button>
            <button onClick={() => handleCategorySelect('All')} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400 hover:text-white backdrop-blur-sm"><List size={20} /></button>
          </div>
        </div>

        <MuscleAnatomyViewer
          bodyFacing={bodyFacing}
          onBodyFacingChange={setBodyFacing}
          onMuscleSelect={handleCategorySelect}
          selectedMuscles={selectedCategory !== 'All' ? [selectedCategory as MuscleGroup] : []}
          activeMuscles={activeMusclesForViewer}
          size="lg"
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-slide-up max-w-md mx-auto w-full bg-slate-950">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Active Workout Quick View Bar */}
      {activeWorkout.length > 0 && (
        <div className="sticky top-0 z-30 bg-gradient-to-r from-emerald-900/40 to-emerald-800/40 backdrop-blur-md border-b border-emerald-700/30">
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell size={16} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-100">
                训练中: {activeWorkout.length} 个动作
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-emerald-300">
              <span>复合: {activeWorkoutStats.compound}</span>
              <span>孤立: {activeWorkoutStats.isolation}</span>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="px-4 pt-2 pb-2">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={selectedMuscleGroup ? onClose : handleBack} className="p-2 -ml-2 text-slate-400 hover:text-white"><ChevronLeft size={24} /></button>
            <h2 className="text-xl font-bold text-white">{selectedCategory === 'All' ? 'All Exercises' : selectedCategory}</h2>
            {selectedMuscleGroup && (
              <div className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                Target: {selectedMuscleGroup}
              </div>
            )}
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl mb-4 border border-slate-800">
            <button
              onClick={() => setActiveTab('common')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'common' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Common Library
            </button>
            <button
              onClick={() => setActiveTab('comprehensive')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'comprehensive' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Comprehensive
            </button>
          </div>
          <div className="relative group mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input type="text" placeholder="Search..." className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 text-sm focus:border-emerald-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className={`flex gap-2 -mx-4 px-4 transition-all duration-300 ${isFilterExpanded ? 'flex-wrap pb-2' : 'overflow-x-auto pb-2 no-scrollbar'}`}>
            {availableEquipment.map(eq => (
              <button key={eq} onClick={() => { setSelectedEquipment(eq); setIsFilterExpanded(false); }} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border ${selectedEquipment === eq ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>{eq}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 pb-24 no-scrollbar">
        {filteredExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Search size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No exercises found</p>
          </div>
        ) : (
          <>
            {filteredExercises.slice(0, displayLimit).map((exercise) => {
              const isSelected = isSelectionMode
                ? (selectedExerciseIds || []).includes(exercise.id)
                : activeWorkout.some(e => e.exerciseId === exercise.id);

              return (
                <HeroExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  isSelected={isSelected}
                  onToggle={() => {
                    if (isSelectionMode && onToggleSelection) {
                      onToggleSelection(exercise);
                    }
                  }}
                  onAddToWorkout={() => {
                    if (isSelectionMode && onToggleSelection) {
                      // 在选择模式下，点击卡片应该切换选择状态
                      onToggleSelection(exercise);
                    } else {
                      // 在正常模式下，添加到训练
                      handleSelectExercise(exercise);
                    }
                  }}
                  onRemoveFromWorkout={() => onRemoveExercise && onRemoveExercise(exercise.id)}
                  onAddToRoutine={() => onAddToRoutine && onAddToRoutine(exercise)}
                  showVideo={true}
                  showDetailedMuscles={true}
                  size="md"
                />
              );
            })}
            <div ref={observerTarget} className="h-20 flex items-center justify-center w-full">
              {displayLimit < filteredExercises.length && <RefreshCw className="animate-spin text-slate-700" size={20} />}
            </div>
          </>
        )}
      </div >

      {/* Fixed Bottom Bar for Selection Mode */}
      {
        isSelectionMode && (
          <div className="sticky bottom-0 left-0 right-0 p-4 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 z-30">
            <button
              onClick={onFinishSelection}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={20} />
              Finish Selection ({selectedExerciseIds?.length || 0})
            </button>
          </div>
        )
      }
    </div >
  );
};

export default ExerciseSelector;
