
import React, { useEffect, useRef, useState } from 'react';
import type { ActiveExercise, WorkoutSet, TimerState, Exercise, UserProfile } from '@/shared/types';
import { Trash2, Check, Plus, Timer, Hourglass, Info, Zap, TrendingUp, Activity, X, Scale, Calculator } from 'lucide-react';
import { getExerciseTips, getExerciseRecommendation } from '../../ai/services/geminiService';
import SwipeableCard from './SwipeableCard';
import { VolumeCalculationService } from '../services/VolumeCalculationService';
import { ExerciseIdentificationService } from '../services/ExerciseIdentificationService';
import VideoPlayer from '@/features/exercise/components/VideoPlayer';
import { iOSStorage } from '@/services/iOSStorageService';

interface WorkoutLoggerProps {
  activeWorkout: ActiveExercise[];
  timers: TimerState;
  onToggleTimer: (exerciseId: string, duration: number, forceStart?: boolean, exerciseName?: string) => void;
  onUpdateSet: (exerciseIndex: number, setIndex: number, field: keyof WorkoutSet, value: number | boolean) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onFinishWorkout: () => void;
  onRemoveExercise: (exerciseIndex: number) => void;
  exerciseLibrary: Exercise[];
  userProfile: UserProfile;
  onAddExercise: (exercise: Exercise) => void;
}

const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({
  activeWorkout,
  timers,
  onToggleTimer,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onFinishWorkout,
  onRemoveExercise,
  exerciseLibrary,
  userProfile
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(Date.now());
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [dragDistance, setDragDistance] = useState<Record<string, number>>({});
  const [exerciseTips, setExerciseTips] = useState<Record<string, { english: string; chinese: string }>>({});
  const [recommendations, setRecommendations] = useState<Record<string, {
    sets: number;
    reps: string;
    weight: number;
    reason: string;
  }>>({});
  const [exerciseHistory] = useState<Record<string, {
    lastPerformed: number;
    sets: Array<{ weight: number; reps: number }>;
  }>>(() => {
    try {
      return JSON.parse(iOSStorage.getItem('zenfit_exercise_history') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bottomRef.current && activeWorkout.length > 0) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeWorkout.length]);

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return null;
    const diffSec = Math.floor((now - timestamp) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return '>1h ago';
  };

  const getExerciseDetails = (exerciseId: string) => exerciseLibrary.find(ex => ex.id === exerciseId);

  const handleQuickStart = (exerciseIndex: number, rec: { sets: number; reps: string; weight: number }) => {
    const reps = parseInt(rec.reps.split('-')[0]);
    const exercise = activeWorkout[exerciseIndex];

    // Check if there are empty sets
    const hasEmptySets = exercise.sets.some(s => !s.weight || !s.reps || s.weight === 0 || s.reps === 0);

    if (hasEmptySets) {
      const emptyIndices: number[] = [];
      exercise.sets.forEach((s, i) => {
        if (!s.weight || !s.reps || s.weight === 0 || s.reps === 0) emptyIndices.push(i);
      });

      const setsToUpdate = Math.min(rec.sets, emptyIndices.length);
      for (let i = 0; i < setsToUpdate; i++) {
        onUpdateSet(exerciseIndex, emptyIndices[i], 'weight', rec.weight);
        onUpdateSet(exerciseIndex, emptyIndices[i], 'reps', reps);
      }

      const remainingSets = rec.sets - setsToUpdate;
      if (remainingSets > 0) {
        for (let i = 0; i < remainingSets; i++) onAddSet(exerciseIndex);
        setTimeout(() => {
          const start = exercise.sets.length;
          for (let i = 0; i < remainingSets; i++) {
            onUpdateSet(exerciseIndex, start + i, 'weight', rec.weight);
            onUpdateSet(exerciseIndex, start + i, 'reps', reps);
          }
        }, 50);
      }
    } else {
      for (let i = 0; i < rec.sets; i++) onAddSet(exerciseIndex);
      setTimeout(() => {
        const start = exercise.sets.length - rec.sets;
        for (let i = 0; i < rec.sets; i++) {
          onUpdateSet(exerciseIndex, start + i, 'weight', rec.weight);
          onUpdateSet(exerciseIndex, start + i, 'reps', reps);
        }
      }, 50);
    }

    setExpandedExerciseId(null);
  };

  const toggleInfo = async (exerciseId: string) => {
    if (expandedExerciseId === exerciseId) {
      setExpandedExerciseId(null);
      return;
    }
    setExpandedExerciseId(exerciseId);
    const ex = activeWorkout.find(e => e.id === exerciseId);
    if (!ex) return;

    if (!exerciseTips[exerciseId]) {
      getExerciseTips(ex.exerciseName).then(tips => {
        setExerciseTips(prev => ({ ...prev, [exerciseId]: tips }));
      });
    }

    if (!recommendations[exerciseId]) {
      const hist = exerciseHistory[ex.exerciseId];
      const lastWorkout = hist ? {
        sets: hist.sets,
        daysAgo: Math.floor((Date.now() - hist.lastPerformed) / (1000 * 60 * 60 * 24))
      } : undefined;

      getExerciseRecommendation(
        ex.exerciseName,
        userProfile.weight,
        userProfile.experienceLevel || 'Intermediate',
        ex.mechanic || 'Compound',
        lastWorkout
      ).then(rec => {
        setRecommendations(prev => ({ ...prev, [exerciseId]: rec }));
      });
    }
  };

  const handleDragUpdate = (exerciseId: string) => (dx: number, isActive: boolean) => {
    if (isActive && dx > 0) {
      // Only track right swipe (opening gesture)
      setDragDistance(prev => ({ ...prev, [exerciseId]: dx }));
    } else {
      // Reset when drag ends or going left
      setDragDistance(prev => ({ ...prev, [exerciseId]: 0 }));
    }
  };

  if (activeWorkout.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-slate-600 mb-4">
          <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Exercises Yet</h3>
        <p className="text-slate-400">Add exercises to start your workout</p>
      </div>
    );
  }

  const activeTimers = activeWorkout.filter(ex => timers[ex.id]?.targetTime > 0);

  return (
    <div className="flex flex-col animate-fade-in max-w-md mx-auto w-full bg-slate-950 px-4 pb-20">
      {/* Active Timers */}
      {activeTimers.length > 0 && (
        <div className="sticky top-0 z-30 mb-4">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-3 shadow-2xl flex flex-nowrap overflow-x-auto no-scrollbar gap-3">
            {activeTimers.map(ex => {
              const timer = timers[ex.id];
              const timeLeft = Math.max(0, Math.ceil((timer.targetTime! - now) / 1000));
              const progress = 1 - (timeLeft / (timer.duration || 90));
              const hue = 240 - progress * 90;
              return (
                <div key={ex.id} className="flex items-center gap-2 bg-slate-950/50 rounded-xl px-3 py-2 border border-slate-700 min-w-fit">
                  <Hourglass size={16} className="text-emerald-400" />
                  <div className="text-xs">
                    <div className="font-semibold text-white truncate max-w-[120px]">{ex.exerciseName}</div>
                    <div className="font-mono font-bold" style={{ color: `hsl(${hue}, 80%, 60%)` }}>
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exercise Cards */}
      <div className="space-y-4 px-4">
        {activeWorkout.map((exercise, exIndex) => {
          const timer = timers[exercise.id];
          const isTimerRunning = timer?.targetTime ? timer.targetTime > now : false;
          const isRestFinished = timer?.targetTime ? timer.targetTime <= now : false;
          const timeLeft = timer?.targetTime ? Math.max(0, Math.ceil((timer.targetTime - now) / 1000)) : 0;
          const progress = timer?.duration ? 1 - (timeLeft / timer.duration) : 0;
          const hue = 240 - progress * 90;
          const isExpanded = expandedExerciseId === exercise.id;
          const exerciseDetails = getExerciseDetails(exercise.exerciseId);
          const tips = exerciseTips[exercise.id];
          const rec = recommendations[exercise.id];
          const hist = exerciseHistory[exercise.exerciseId];

          return (
            <SwipeableCard
              key={exercise.id}
              onSwipeRight={() => toggleInfo(exercise.id)}
              onSwipeLeft={() => isExpanded && setExpandedExerciseId(null)}
              onDragUpdate={handleDragUpdate(exercise.id)}
              className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden animate-slide-up transition-all duration-700"
            >
              {/* Header */}
              <div className="p-4 bg-slate-850 flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleInfo(exercise.id)}
                    className="p-2 text-slate-500 hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-800 flex-shrink-0"
                  >
                    <Info size={18} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-white leading-tight break-words ${exercise.exerciseName.length > 25 ? 'text-sm' : 'text-lg'
                      }`}>{exercise.exerciseName}</h3>
                    {exercise.exerciseNameZh && (
                      <p className="text-xs text-slate-400">{exercise.exerciseNameZh}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onToggleTimer(exercise.id, exercise.recommendedRestSeconds || 90, false, exercise.exerciseName)}
                    className={`relative overflow-hidden flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all min-w-[85px] justify-center ${isTimerRunning ? 'bg-slate-900 border-slate-600' :
                      isRestFinished ? 'bg-emerald-900/20 border-emerald-500/50' :
                        'bg-slate-800 border-slate-700 hover:border-emerald-500/50'
                      }`}
                  >
                    {isTimerRunning && (
                      <div className="absolute inset-0 duration-1000" style={{
                        width: `${progress * 100}%`,
                        backgroundColor: `hsl(${hue}, 80%, 45%)`
                      }} />
                    )}
                    {isTimerRunning ? (
                      <>
                        <Hourglass size={14} className="relative z-10 text-white" />
                        <span className="relative z-10 font-mono font-bold text-white">
                          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </span>
                      </>
                    ) : (
                      <>
                        <Timer size={14} className={isRestFinished ? "text-emerald-400" : "text-slate-400"} />
                        <span className={`text-xs font-bold ${isRestFinished ? "text-emerald-400" : "text-slate-300"}`}>
                          {isRestFinished ? "Done" : "Rest"}
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onRemoveExercise(exIndex)}
                    className="text-slate-500 hover:text-red-400 p-2 hover:bg-slate-800 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Expanded Info */}
              <div
                className="border-b border-slate-800 bg-slate-950 overflow-hidden ease-in-out"
                style={{
                  maxHeight: (() => {
                    const drag = dragDistance[exercise.id] || 0;
                    if (isExpanded) {
                      // Fully expanded
                      return '2000px';
                    } else if (drag > 0) {
                      // Following drag - scale from 0 to 800px based on drag distance (0-200px)
                      const heightScale = Math.min(drag / 200, 1); // 200px drag = 100%
                      return `${heightScale * 800}px`;
                    } else {
                      // Collapsed
                      return '0px';
                    }
                  })(),
                  opacity: (() => {
                    const drag = dragDistance[exercise.id] || 0;
                    if (isExpanded) return 1;
                    if (drag > 0) return Math.min(drag / 100, 1); // Fade in over 100px
                    return 0;
                  })(),
                  transition: isExpanded ? 'all 2000ms ease-in-out' : 'none'
                }}
              >
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white leading-tight">{exercise.exerciseName}</h3>
                    {exercise.exerciseNameZh && (
                      <p className="text-sm text-slate-400 mt-1">{exercise.exerciseNameZh}</p>
                    )}
                  </div>

                  {exerciseDetails?.videoUrl && (
                    <div className="relative h-40 bg-slate-900 rounded-xl overflow-hidden">
                      <VideoPlayer
                        videoUrl={exerciseDetails.videoUrl}
                        className="w-full h-full object-cover"
                        lazy={false}
                        autoPlay={false}
                        controls={true}
                        preload="metadata"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {exercise.mechanic && (
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${exercise.mechanic === 'Compound' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>{exercise.mechanic}</span>
                    )}
                    {exerciseDetails?.difficulty && (
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${exerciseDetails.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        exerciseDetails.difficulty === 'Intermediate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>{exerciseDetails.difficulty}</span>
                    )}
                    {exerciseDetails?.equipment && (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {exerciseDetails.equipment}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-2 text-sm">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <Activity size={14} /> {exercise.muscleGroup}
                    </span>
                    {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">{exercise.secondaryMuscles.join(', ')}</span>
                      </>
                    )}
                  </div>

                  {tips && (
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 space-y-2">
                      <div className="text-xs text-emerald-400 font-bold uppercase flex items-center gap-1">
                        <Info size={12} /> Form Tips
                      </div>
                      <div className="text-xs text-slate-300 space-y-1">
                        {tips.english.split('|').map((tip, i) => <div key={i}>• {tip.trim()}</div>)}
                      </div>
                      <div className="text-xs text-slate-400 border-t border-slate-700 pt-2 space-y-1">
                        {tips.chinese.split('|').map((tip, i) => <div key={i}>• {tip.trim()}</div>)}
                      </div>
                    </div>
                  )}

                  {rec && (
                    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg p-3 space-y-2">
                      <div className="text-xs text-indigo-400 font-bold uppercase flex items-center gap-1">
                        <Zap size={12} /> AI Recommendation
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {(() => {
                          const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exerciseDetails);
                          const isDuration = typeInfo.trackingMode === 'duration';
                          const isAssisted = typeInfo.weightInputMode === 'assisted_subtraction';
                          const userWeight = userProfile?.weight || 70;
                          const actualResistance = isAssisted ? Math.max(0, userWeight - rec.weight) : rec.weight;
                          
                          return (
                            <>
                              <span className="text-lg font-bold text-white">{rec.sets} × {rec.reps}{isDuration ? 's' : ''}</span>
                              <span className="text-emerald-400 font-bold">@</span>
                              {isAssisted ? (
                                <div className="flex flex-col">
                                  <span className="text-2xl font-black text-emerald-400">{rec.weight}kg <span className="text-sm font-normal text-slate-400">assist</span></span>
                                  <span className="text-xs text-blue-400">Actual: {actualResistance}kg ({userWeight} - {rec.weight})</span>
                                </div>
                              ) : typeInfo.weightInputMode === 'dumbbell_per_side' ? (
                                <div className="flex flex-col">
                                  <span className="text-2xl font-black text-emerald-400">{rec.weight}kg <span className="text-sm font-normal text-slate-400">per dumbbell</span></span>
                                  <span className="text-xs text-amber-400">Total: {rec.weight * 2}kg (each side)</span>
                                </div>
                              ) : (
                                <span className="text-2xl font-black text-emerald-400">{rec.weight}kg</span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-slate-400 italic">💡 {rec.reason}</p>
                      <button
                        onClick={() => handleQuickStart(exIndex, rec)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Zap size={16} /> Quick Start
                      </button>
                    </div>
                  )}

                  {hist && (
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 space-y-2">
                      <div className="text-xs text-amber-400 font-bold uppercase flex items-center gap-1">
                        <TrendingUp size={12} /> Last Workout
                      </div>
                      <div className="text-xs text-slate-400">
                        {Math.floor((Date.now() - hist.lastPerformed) / 86400000)} days ago
                      </div>
                      {(() => {
                        const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exerciseDetails);
                        const isDuration = typeInfo.trackingMode === 'duration';
                        return hist.sets.slice(0, 3).map((set, i) => (
                          <div key={i} className="text-xs text-slate-300">
                            Set {i + 1}: {set.weight}kg × {set.reps}{isDuration ? 's' : ' reps'}
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Sets */}
              <div className="p-2">
                {/* Exercise Input Mode Hints */}
                {exerciseDetails && (
                  <div className="mb-3 px-2">
                    {(() => {
                      const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exerciseDetails);
                      return (
                        <>
                          {typeInfo.weightInputMode === 'dumbbell_per_side' && (
                            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                              <Scale size={14} />
                              <span>Enter weight of ONE dumbbell (total = x2)</span>
                            </div>
                          )}
                          {typeInfo.weightInputMode === 'assisted_subtraction' && (
                            <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                              <Calculator size={14} />
                              <span>Assistance weight: Actual = Bodyweight - Assistance</span>
                            </div>
                          )}
                          {typeInfo.trackingMode === 'duration' && (
                            <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                              <Timer size={14} />
                              <span>Time-based: Enter duration in seconds</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
                <div className="grid grid-cols-10 gap-2 mb-2 px-2 text-xs font-medium text-slate-500 uppercase text-center">
                  <div className="col-span-2">Set</div>
                  <div className="col-span-3">kg</div>
                  <div className="col-span-3">
                    {(() => {
                      const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exerciseDetails);
                      return typeInfo.trackingMode === 'duration' ? 'Sec' : 'Reps';
                    })()}
                  </div>
                  <div className="col-span-2">✓</div>
                </div>

                {exercise.sets.map((set, setIndex) => (
                  <div key={set.id} className="relative mb-3">
                    <div className={`grid grid-cols-10 gap-2 items-center px-2 py-3 rounded-lg transition-colors ${set.completed ? 'bg-emerald-900/10 border border-emerald-900/30' : 'bg-slate-800/50'
                      }`}>
                      <div className="col-span-2 text-center font-mono text-slate-400 text-sm flex items-center justify-center gap-1">
                        {setIndex + 1}
                        <button
                          onClick={() => onRemoveSet(exIndex, setIndex)}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                          title="Delete set"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={set.weight || ''}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded-md text-center py-1.5 text-white focus:border-emerald-500 focus:outline-none text-sm font-bold"
                          onChange={e => onUpdateSet(exIndex, setIndex, 'weight', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={set.reps || ''}
                          placeholder={(() => {
                            const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exerciseDetails);
                            return typeInfo.trackingMode === 'duration' ? 'Sec' : '0';
                          })()}
                          className="w-full bg-slate-900 border border-slate-700 rounded-md text-center py-1.5 text-white focus:border-emerald-500 focus:outline-none text-sm font-bold"
                          onChange={e => onUpdateSet(exIndex, setIndex, 'reps', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <button
                          onClick={() => onUpdateSet(exIndex, setIndex, 'completed', !set.completed)}
                          className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${set.completed ? 'bg-emerald-500 text-white scale-105' : 'bg-slate-700 text-slate-400'
                            }`}
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    </div>
                    {set.completed && set.restCompletedAt && (
                      <div className="absolute -bottom-2 right-3 text-[10px] font-medium text-emerald-300 bg-slate-950/90 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <Hourglass size={10} className="inline" /> {formatTimeAgo(set.restCompletedAt)}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => onAddSet(exIndex)}
                  className="w-full py-2 mt-3 flex items-center justify-center gap-2 text-sm font-medium text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 border-dashed hover:border-emerald-500/50"
                >
                  <Plus size={14} /> Add Set
                </button>
              </div>
            </SwipeableCard>
          );
        })}
      </div>

      <div className="p-6 flex justify-center">
        <button
          onClick={onFinishWorkout}
          className="w-full max-w-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Check size={20} /> Finish Workout
        </button>
      </div>

      <div ref={bottomRef} />
    </div>
  );
};

export default WorkoutLogger;
