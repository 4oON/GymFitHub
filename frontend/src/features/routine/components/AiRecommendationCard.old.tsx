import React from 'react';
import { Info, RefreshCw, Trash2, Sparkles } from 'lucide-react';
import type { Exercise, AiRecommendation } from '@/shared/types';
import HeroExerciseCard from '@/features/exercise/components/HeroExerciseCard';

interface AiRecommendationCardProps {
    exercise: Exercise;
    recommendation: AiRecommendation;
    index: number;
    onSwap: (id: string, name: string, muscle: string) => void;
    onRemove: (index: number) => void;
}

const AiRecommendationCard: React.FC<AiRecommendationCardProps> = ({
    exercise,
    recommendation,
    index,
    onSwap,
    onRemove
}) => {
    return (
        <div className="relative transition-all duration-300 hover:z-50">
            <div className="rounded-2xl border border-slate-800 bg-slate-950">
                {/* Reuse Hero Card for Visuals - Top rounded corners */}
                <div className="pointer-events-none rounded-t-2xl overflow-hidden">
                    <HeroExerciseCard
                        exercise={exercise}
                        isSelected={false} // Managed externally
                        onToggle={() => { }}
                        onAddToWorkout={() => { }}
                    />
                </div>

                {/* AI Insight Badge - Stacked BELOW the card - Bottom rounded corners */}
                <div className="bg-slate-900/50 backdrop-blur-md border-t border-slate-800 p-3 rounded-b-2xl">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                            {/* Info Button with Tooltip */}
                            <div className="relative group/info">
                                <button
                                    className="bg-indigo-500/20 p-1.5 rounded-lg mt-0.5 flex-shrink-0 hover:bg-indigo-500/30 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    <Info className="text-indigo-400" size={16} />
                                </button>

                                {/* Tooltip - Positioned BELOW the icon now */}
                                <div className="absolute left-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible group-focus-within/info:opacity-100 group-focus-within/info:visible transition-all z-[100] pointer-events-none translate-y-[-10px] group-hover/info:translate-y-0">
                                    <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
                                        <Sparkles className="text-indigo-400" size={14} />
                                        <span className="text-xs font-bold text-white uppercase tracking-wider">AI Reasoning</span>
                                    </div>
                                    <p className="text-slate-300 text-xs leading-relaxed">{recommendation.reason}</p>
                                    {/* Arrow pointing up */}
                                    <div className="absolute left-3 -top-1 w-2 h-2 bg-slate-900 border-t border-l border-slate-700 rotate-45"></div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-white font-bold text-sm bg-slate-800 px-2 py-0.5 rounded-md">{recommendation.sets} Sets</span>
                                    <span className="text-white font-bold text-sm bg-slate-800 px-2 py-0.5 rounded-md">{recommendation.reps} Reps</span>
                                    <span className="text-emerald-400 font-bold text-sm bg-emerald-900/20 px-2 py-0.5 rounded-md border border-emerald-500/20">{recommendation.weight}</span>
                                    {recommendation.popularityRating && (
                                        <div className="flex items-center gap-0.5 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                            {[...Array(recommendation.popularityRating)].map((_, i) => (
                                                <span key={i} className="text-amber-400 text-xs">⭐</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Tip Display - Simplified */}
                                {recommendation.tip && (
                                    <div className="flex items-start gap-2 mt-2">
                                        <div className="mt-0.5">
                                            <Sparkles className="text-amber-400" size={12} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1.5">Tip</span>
                                            <span className="text-slate-300 text-xs font-medium leading-relaxed">
                                                {recommendation.tip}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            {/* Swap Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSwap(exercise.id, exercise.name, exercise.muscleGroup);
                                }}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors z-30"
                                title="Swap Exercise"
                            >
                                <RefreshCw size={16} />
                            </button>

                            {/* Delete Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(index);
                                }}
                                className="p-2 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 rounded-lg transition-colors z-30"
                                title="Remove Exercise"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiRecommendationCard;
