import React, { useState, useMemo } from 'react';
import { Brain, Target, Clock, Zap, TrendingUp, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import type { WorkoutRecommendation } from '../services/AIRecommendationService';
import HeroExerciseCard from '../../exercise/components/HeroExerciseCard';
import CollapsibleSection from '@/shared/components/layout/CollapsibleSection';

interface AIRecommendationPanelProps {
    /** Array of AI recommendations */
    recommendations: WorkoutRecommendation[];
    /** Callback when user accepts a recommendation */
    onAcceptRecommendation: (recommendation: WorkoutRecommendation) => void;
    /** Callback when user dismisses a recommendation */
    onDismissRecommendation: (recommendationId: string) => void;
    /** Whether to show detailed view */
    showDetails?: boolean;
    /** Custom class name */
    className?: string;
}

/**
 * AI-powered recommendation panel component
 * Displays intelligent workout suggestions with interactive actions
 */
const AIRecommendationPanel: React.FC<AIRecommendationPanelProps> = ({
    recommendations,
    onAcceptRecommendation,
    onDismissRecommendation,
    showDetails = true,
    className = '',
}) => {
    const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(new Set());

    // Group recommendations by priority
    const groupedRecommendations = useMemo(() => {
        const groups = {
            high: recommendations.filter(r => r.priority === 'high'),
            medium: recommendations.filter(r => r.priority === 'medium'),
            low: recommendations.filter(r => r.priority === 'low'),
        };
        return groups;
    }, [recommendations]);

    // Get icon for recommendation type
    const getRecommendationIcon = (type: WorkoutRecommendation['type']) => {
        switch (type) {
            case 'exercise':
                return Target;
            case 'rest':
                return Clock;
            case 'intensity':
                return Zap;
            case 'volume':
                return TrendingUp;
            default:
                return Brain;
        }
    };

    // Get color scheme for priority
    const getPriorityColors = (priority: WorkoutRecommendation['priority']) => {
        switch (priority) {
            case 'high':
                return {
                    bg: 'bg-rose-500/10',
                    border: 'border-rose-500/20',
                    text: 'text-rose-400',
                    icon: 'text-rose-500',
                };
            case 'medium':
                return {
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/20',
                    text: 'text-amber-400',
                    icon: 'text-amber-500',
                };
            case 'low':
                return {
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/20',
                    text: 'text-blue-400',
                    icon: 'text-blue-500',
                };
        }
    };

    const toggleExpanded = (recommendationId: string) => {
        const newExpanded = new Set(expandedRecommendations);
        if (newExpanded.has(recommendationId)) {
            newExpanded.delete(recommendationId);
        } else {
            newExpanded.add(recommendationId);
        }
        setExpandedRecommendations(newExpanded);
    };

    const renderRecommendation = (recommendation: WorkoutRecommendation) => {
        const Icon = getRecommendationIcon(recommendation.type);
        const colors = getPriorityColors(recommendation.priority);
        const isExpanded = expandedRecommendations.has(recommendation.id);

        return (
            <div
                key={recommendation.id}
                className={`${colors.bg} ${colors.border} border rounded-xl p-4 transition-all hover:scale-[1.02]`}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                        <div className={`${colors.bg} p-2 rounded-lg border ${colors.border}`}>
                            <Icon size={20} className={colors.icon} />
                        </div>
                        <div className="flex-1">
                            <h4 className={`font-bold ${colors.text} mb-1`}>{recommendation.title}</h4>
                            <p className="text-slate-300 text-sm leading-relaxed">{recommendation.description}</p>
                        </div>
                    </div>

                    {/* Priority Badge */}
                    <div className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {recommendation.priority}
                    </div>
                </div>

                {/* Quick Info */}
                <div className="flex items-center gap-4 mb-3 text-sm text-slate-400">
                    {recommendation.suggestedSets && (
                        <span>Sets: {recommendation.suggestedSets}</span>
                    )}
                    {recommendation.suggestedReps && (
                        <span>Reps: {recommendation.suggestedReps}</span>
                    )}
                    {recommendation.suggestedWeight && (
                        <span>Weight: {recommendation.suggestedWeight}</span>
                    )}
                    {recommendation.restDays && (
                        <span>Rest: {recommendation.restDays} days</span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => onAcceptRecommendation(recommendation)}
                            className={`px-4 py-2 ${colors.bg} ${colors.text} border ${colors.border} rounded-lg font-medium hover:bg-opacity-80 transition-colors flex items-center gap-2`}
                        >
                            <CheckCircle size={16} />
                            Accept
                        </button>

                        {showDetails && recommendation.reasoning && (
                            <button
                                onClick={() => toggleExpanded(recommendation.id)}
                                className="px-3 py-2 text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors flex items-center gap-1"
                            >
                                Details
                                <ChevronRight
                                    size={16}
                                    className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => onDismissRecommendation(recommendation.id)}
                        className="text-slate-500 hover:text-slate-300 p-1 transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && showDetails && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="mb-3">
                            <h5 className="font-medium text-slate-300 mb-2">Reasoning</h5>
                            <p className="text-slate-400 text-sm leading-relaxed">{recommendation.reasoning}</p>
                        </div>

                        {/* Suggested Exercises */}
                        {recommendation.suggestedExercises && recommendation.suggestedExercises.length > 0 && (
                            <div>
                                <h5 className="font-medium text-slate-300 mb-3">Suggested Exercises</h5>
                                <div className="space-y-2">
                                    {recommendation.suggestedExercises.slice(0, 2).map((exercise) => (
                                        <div key={exercise.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h6 className="font-medium text-white">{exercise.name}</h6>
                                                    <p className="text-xs text-slate-400">{exercise.muscleGroup} • {exercise.equipment}</p>
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {exercise.difficulty}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Target Muscles */}
                        {recommendation.targetMuscles && recommendation.targetMuscles.length > 0 && (
                            <div className="mt-3">
                                <h5 className="font-medium text-slate-300 mb-2">Target Muscles</h5>
                                <div className="flex flex-wrap gap-2">
                                    {recommendation.targetMuscles.map((muscle) => (
                                        <span
                                            key={muscle}
                                            className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700"
                                        >
                                            {muscle}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (recommendations.length === 0) {
        return (
            <div className={`text-center py-8 ${className}`}>
                <Brain size={48} className="text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-400 mb-2">No Recommendations</h3>
                <p className="text-slate-500">Start a workout to get AI-powered suggestions!</p>
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-3 rounded-xl border border-purple-500/20">
                    <Brain size={24} className="text-purple-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">AI Recommendations</h2>
                    <p className="text-slate-400 text-sm">Personalized suggestions for your workout</p>
                </div>
            </div>

            {/* High Priority Recommendations */}
            {groupedRecommendations.high.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-rose-500" />
                        <h3 className="font-bold text-rose-400">High Priority</h3>
                    </div>
                    {groupedRecommendations.high.map(renderRecommendation)}
                </div>
            )}

            {/* Medium Priority Recommendations */}
            {groupedRecommendations.medium.length > 0 && (
                <CollapsibleSection
                    title="Medium Priority Suggestions"
                    defaultExpanded={groupedRecommendations.high.length === 0}
                    headerClassName="text-amber-400"
                >
                    <div className="space-y-3">
                        {groupedRecommendations.medium.map(renderRecommendation)}
                    </div>
                </CollapsibleSection>
            )}

            {/* Low Priority Recommendations */}
            {groupedRecommendations.low.length > 0 && (
                <CollapsibleSection
                    title="Additional Suggestions"
                    defaultExpanded={false}
                    headerClassName="text-blue-400"
                >
                    <div className="space-y-3">
                        {groupedRecommendations.low.map(renderRecommendation)}
                    </div>
                </CollapsibleSection>
            )}
        </div>
    );
};

export default AIRecommendationPanel;

/**
 * @example
 * // Basic usage
 * <AIRecommendationPanel
 *   recommendations={aiRecommendations}
 *   onAcceptRecommendation={(rec) => handleAccept(rec)}
 *   onDismissRecommendation={(id) => handleDismiss(id)}
 * />
 *
 * @example
 * // Compact view without details
 * <AIRecommendationPanel
 *   recommendations={aiRecommendations}
 *   onAcceptRecommendation={handleAccept}
 *   onDismissRecommendation={handleDismiss}
 *   showDetails={false}
 *   className="max-h-96 overflow-y-auto"
 * />
 */