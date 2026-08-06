/**
 * AI Custom Routine Card
 *
 * 显示AI生成的客制化训练计划卡片
 * - 样式与 RoutineBuilder 的 My Routines 完全一致
 * - 支持保存到 My Routines 并带 AI 标签
 * - 每个动作显示视频/GIF预览
 * - 支持删除单个动作
 * - iOS兼容设计
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  Play,
  Save,
  Check,
  Sparkles,
  Zap,
  Trash2,
  Bot,
} from 'lucide-react';
import AICoachService, { type AICustomRoutine, type AICustomExercise } from '../services/AICoachService';
import type { Exercise } from '@/shared/types';
import VideoPlayer from '@/features/exercise/components/VideoPlayer';
import { fuzzyMatchExercise } from '@/features/exercise/utils/exerciseMatching';

interface AICustomRoutineCardProps {
  routine: AICustomRoutine;
  onSelect?: (routine: AICustomRoutine) => void;
  onSave?: (routine: AICustomRoutine) => void;
  onSaveAsRoutine?: (routine: AICustomRoutine) => void;
  // NEW: Exercise library for matching and video preview
  exerciseLibrary?: Exercise[];
}

/** Single exercise row — styled exactly like RoutineBuilder */
const ExerciseRow: React.FC<{
  exercise: AICustomExercise;
  exerciseLibrary: Exercise[];
  onDelete?: () => void;
}> = ({ exercise, exerciseLibrary, onDelete }) => {
  const matched = useMemo(() =>
    fuzzyMatchExercise(exercise.name, exerciseLibrary) || fuzzyMatchExercise(exercise.nameZh, exerciseLibrary),
  [exercise.name, exercise.nameZh, exerciseLibrary]);
  const hasMedia = matched?.gifUrl || matched?.videoUrl;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10, height: 0 }}
      className="flex items-center gap-3 bg-gradient-to-r from-slate-700/30 to-slate-800/30 p-3 rounded-xl border border-slate-600/30 backdrop-blur-sm hover:border-emerald-500/50 transition-all duration-300"
    >
      {/* Media Thumbnail — matches RoutineBuilder exactly */}
      {hasMedia ? (
        <div className="w-16 h-16 flex-shrink-0 bg-slate-700/50 rounded-xl overflow-hidden border border-slate-600/50">
          {matched!.gifUrl ? (
            <img src={matched!.gifUrl} alt={exercise.name} className="w-full h-full object-cover" />
          ) : (
            <VideoPlayer
              videoUrl={matched!.videoUrl}
              lazy={true}
            />
          )}
        </div>
      ) : (
        <div className="w-16 h-16 flex-shrink-0 bg-slate-700/50 rounded-xl flex items-center justify-center border border-slate-600/50">
          <Dumbbell size={20} className="text-slate-500" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium leading-snug">
          {exercise.nameZh || exercise.name}
        </p>
        <p className="text-slate-400 text-xs mt-1">
          {exercise.muscleGroup}
          {' '}
          {matched?.equipment && `• ${matched.equipment}`}
          {' '}
          • {exercise.sets}组 × {exercise.reps}
          {' '}
          • {exercise.restSeconds}s
        </p>
        {exercise.tips && (
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-1">
            {exercise.tips}
          </p>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
        className="p-2 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 rounded-lg transition-all"
        style={{ touchAction: 'manipulation' }}
        title="Remove exercise"
      >
        <Trash2 size={16} className="text-rose-400/70" />
      </button>
    </motion.div>
  );
};

export const AICustomRoutineCard: React.FC<AICustomRoutineCardProps> = ({
  routine,
  onSelect,
  onSave,
  onSaveAsRoutine,
  exerciseLibrary = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(routine.isSaved);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingToRoutine, setIsSavingToRoutine] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletedIndices, setDeletedIndices] = useState<Set<number>>(new Set());

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await AICoachService.saveRoutine(routine.id);
      setIsSaved(true);
      onSave?.(routine);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsRoutine = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSavingToRoutine(true);
    try {
      onSaveAsRoutine?.(routine);
      setTimeout(() => setIsSavingToRoutine(false), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save to routines');
      setIsSavingToRoutine(false);
    }
  }, [onSaveAsRoutine, routine]);

  const handleStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const filteredRoutine = {
      ...routine,
      exercises: routine.exercises.filter((_, idx) => !deletedIndices.has(idx)),
    };
    onSelect?.(filteredRoutine);
  }, [routine, onSelect, deletedIndices]);

  const handleDeleteExercise = useCallback((idx: number) => {
    setDeletedIndices(prev => new Set([...prev, idx]));
  }, []);

  // Filter out deleted exercises
  const visibleExercises = routine.exercises.filter((_, idx) => !deletedIndices.has(idx));
  const visibleCount = visibleExercises.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 shadow-lg backdrop-blur-sm hover:shadow-xl hover:shadow-emerald-500/10"
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 flex justify-between items-center cursor-pointer"
      >
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <Bot size={14} className="text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-medium text-emerald-400">AI Recommend</span>
          </div>
          <h3 className="font-bold text-white text-lg truncate">{routine.name}</h3>
          <p className="text-slate-400 text-sm mt-0.5">
            {visibleCount} Exercises
            {routine.estimatedDuration && ` • ${routine.estimatedDuration} min`}
            {routine.difficulty && ` • ${routine.difficulty.charAt(0).toUpperCase() + routine.difficulty.slice(1)}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isExpanded ? (
            <ChevronUp size={20} className="text-emerald-400" />
          ) : (
            <ChevronDown size={20} className="text-slate-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Description */}
              {routine.description && (
                <p className="text-xs text-slate-400 leading-relaxed">{routine.description}</p>
              )}

              {/* Exercise List */}
              <div className="space-y-2">
                <AnimatePresence>
                  {routine.exercises.map((exercise, idx) => {
                    if (deletedIndices.has(idx)) return null;
                    return (
                      <ExerciseRow
                        key={idx}
                        exercise={exercise}
                        exerciseLibrary={exerciseLibrary}
                        onDelete={() => handleDeleteExercise(idx)}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Deleted count hint */}
              {deletedIndices.size > 0 && (
                <p className="text-[11px] text-slate-500 text-center">
                  {deletedIndices.size} exercise{deletedIndices.size > 1 ? 's' : ''} removed. Click Start to begin with {visibleCount} exercises.
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleStart}
                  className="flex-1 py-3 flex items-center justify-center gap-2
                           bg-gradient-to-r from-emerald-500 to-teal-500
                           hover:from-emerald-400 hover:to-teal-400
                           text-white font-bold rounded-xl
                           transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                  style={{ touchAction: 'manipulation' }}
                >
                  <Play size={16} fill="currentColor" />
                  Start This Routine
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveAsRoutine}
                  disabled={isSavingToRoutine}
                  className="flex-1 py-2.5 flex items-center justify-center gap-2
                           text-sm font-medium
                           bg-emerald-500/10 text-emerald-400
                           hover:bg-emerald-500/20
                           rounded-xl border border-emerald-500/20
                           transition-all active:scale-95"
                  style={{ touchAction: 'manipulation' }}
                >
                  {isSavingToRoutine ? (
                    <><Check size={16} /> Saved to My Routines</>
                  ) : (
                    <><Save size={16} /> Save to My Routines</>
                  )}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaved || isSaving}
                  className={`px-4 py-2.5 rounded-xl font-medium transition-all text-sm
                    ${isSaved
                      ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95'
                    } disabled:opacity-50`}
                  style={{ touchAction: 'manipulation' }}
                >
                  {isSaving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles size={18} />
                    </motion.div>
                  ) : isSaved ? (
                    <Check size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                </button>
              </div>

              {error && (
                <p className="text-xs text-rose-400 text-center">{error}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AICustomRoutineCard;
