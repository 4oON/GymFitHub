/**
 * Recommended Exercise Card Component
 * 
 * Displays exercise recommendations with:
 * - Video preview
 * - Add to workout functionality
 * - Dislike/Replace button for new recommendations
 * - Duplicate prevention state
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, Check, RefreshCw, History } from 'lucide-react';
import type { Exercise } from '@/shared/types';
import VideoPlayer from '@/features/exercise/components/VideoPlayer';

interface RecommendedExerciseCardProps {
  exercise: Exercise;
  frequency: number;
  isNewExercise: boolean;
  reason: string;
  onSelect: (exercise: Exercise) => void;
  onReplace?: (exercise: Exercise) => void;
  isAdded?: boolean;
  index?: number;
}

const RecommendedExerciseCard: React.FC<RecommendedExerciseCardProps> = ({
  exercise,
  frequency,
  isNewExercise,
  reason,
  onSelect,
  onReplace,
  isAdded = false,
  index = 0
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showAdded, setShowAdded] = useState(isAdded);

  // Sync with parent state
  useEffect(() => {
    setShowAdded(isAdded);
  }, [isAdded]);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdding || showAdded) return;
    
    setIsAdding(true);
    onSelect(exercise);
    
    setTimeout(() => {
      setIsAdding(false);
      setShowAdded(true);
    }, 300);
  };

  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReplace?.(exercise);
  };

  const handleCardClick = () => {
    if (showAdded) return;
    onSelect(exercise);
    setShowAdded(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      layout
      onClick={handleCardClick}
      className={`relative flex-shrink-0 w-40 bg-slate-900 rounded-xl border overflow-hidden 
                 transition-all duration-200 ${
                   showAdded 
                     ? 'border-emerald-500/50 opacity-70' 
                     : 'border-slate-800 hover:border-slate-600 cursor-pointer'
                 }`}
      style={{ touchAction: 'manipulation' }}
    >
      {/* New Exercise Badge */}
      {isNewExercise && !showAdded && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-1.5 py-0.5 bg-violet-500/20 text-violet-400 rounded text-[8px] font-bold border border-violet-500/30">
          <Sparkles size={8} />
          NEW
        </div>
      )}

      {/* Added Indicator */}
      {showAdded && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[8px] font-bold border border-emerald-500/30">
          <Check size={8} />
          ADDED
        </div>
      )}

      {/* Replace Button */}
      {!showAdded && onReplace && (
        <button
          onClick={handleReplace}
          className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-slate-800/80 hover:bg-slate-700 
                     flex items-center justify-center transition-colors border border-slate-700"
          style={{ touchAction: 'manipulation' }}
          title="Replace with another exercise"
        >
          <RefreshCw size={10} className="text-slate-400" />
        </button>
      )}

      {/* Video Section */}
      <div className="h-20 bg-slate-950 relative overflow-hidden">
        {exercise.videoUrl ? (
          <VideoPlayer
            videoUrl={exercise.videoUrl}
            lazy={true}
          />
        ) : exercise.gifUrl ? (
          <img 
            src={exercise.gifUrl} 
            alt={exercise.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-900">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
              <Sparkles size={16} className="text-slate-600" />
            </div>
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none" />
      </div>

      {/* Content Section */}
      <div className="p-2.5">
        {/* Exercise Name */}
        <h4 className="text-xs font-bold text-white truncate mb-0.5">
          {exercise.nameZh || exercise.name}
        </h4>

        {/* Muscle Group */}
        <p className="text-[10px] text-emerald-400 mb-2">
          {exercise.muscleGroup}
        </p>

        {/* Stats Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {!isNewExercise && frequency > 0 ? (
              <div className="flex items-center gap-0.5 text-[9px] text-slate-400">
                <History size={8} className="text-emerald-500" />
                <span>{frequency} sessions</span>
              </div>
            ) : (
              <span className="text-[9px] text-violet-400">
                {reason}
              </span>
            )}
          </div>

          {/* Add Button - Disabled if already added */}
          <button
            onClick={handleAdd}
            disabled={isAdding || showAdded}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
              showAdded 
                ? 'bg-emerald-500/20 text-emerald-500 cursor-not-allowed' 
                : isAdding
                  ? 'bg-emerald-500/30 text-emerald-400 scale-95'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 active:scale-95'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            {isAdding ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.3 }}>
                <Plus size={12} />
              </motion.div>
            ) : showAdded ? (
              <Check size={12} />
            ) : (
              <Plus size={12} />
            )}
          </button>
        </div>
      </div>

      {/* Adding Animation Overlay */}
      {isAdding && (
        <div className="absolute inset-0 bg-emerald-500/10 z-30 pointer-events-none animate-pulse" />
      )}
    </motion.div>
  );
};

export default RecommendedExerciseCard;
