import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, RefreshCw, Info, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import type { EnhancedWorkoutRecommendation, SmartWeightRecommendation } from '../services/EnhancedAIRecommendationService';
import type { Exercise } from '@/shared/types';

interface EnhancedAIRecommendationPanelProps {
    recommendations: EnhancedWorkoutRecommendation[];
    onAcceptRecommendation: (recommendation: EnhancedWorkoutRecommendation) => void;
    onDismissRecommendation: (recommendationId: string) => void;
    onFeedback: (recommendationId: string, feedback: 'positive' | 'negative' | 'regenerate') => void;
    showDetails?: boolean;
}

const EnhancedAIRecommendationPanel: React.FC<EnhancedAIRecommendationPanelProps> = ({
    recommendations,
    onAcceptRecommendation,
    onDismissRecommendation,
    onFeedback,
    showDetails = true
}) => {
    const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(new Set());
    const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

    const toggleExpanded = (id: string) => {
        const newExpanded = new Set(expandedRecommendations);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRecommendations(newExpanded);
    };

    const handleFeedback = (recommendationId: string, feedback: 'positive' | 'negative' | 'regenerate') => {
        onFeedback(recommendationId, feedback);
        const newFeedbackGiven = new Set(feedbackGiven);
        newFeedbackGiven.add(recommendationId);
        setFeedbackGiven(newFeedbackGiven);
    };

    const getRecommendationIcon = (type: string) => {
        switch (type) {
            case 'weight_adjustment':
                return <TrendingUp size={16} className="text-blue-400" />;
            case 'exercise':
                return <Sparkles size={16} className="text-emerald-400" />;
            case 'rest':
                return <Minus size={16} className="text-amber-400" />;
            default:
                return <Info size={16} className="text-slate-400" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'border-rose-500/30 bg-rose-500/5';
            case 'medium':
                return 'border-amber-500/30 bg-amber-500/5';
            case 'low':
                return 'border-slate-500/30 bg-slate-500/5';
            default:
                return 'border-slate-500/30 bg-slate-500/5';
        }
    };

    const renderSmartWeightRecommendation = (smartWeight: SmartWeightRecommendation) => {
        const getConfidenceColor = (confidence: string) => {
            switch (confidence) {
                case 'high':
                    return 'text-emerald-400';
                case 'medium':
                    return 'text-amber-400';
                case 'low':
                    return 'text-slate-400';
                default:
                    return 'text-slate-400';
            }
        };

        const getTrendIcon = () => {
            if (smartWeight.adjustmentFactor > 1.0) {
                return <TrendingUp size={14} className="text-emerald-400" />;
            } else if (smartWeight.adjustmentFactor < 1.0) {
                return <TrendingDown size={14} className="text-rose-400" />;
            } else {
                return <Minus size={14} className="text-slate-400" />;
            }
        };

        return (
            <div className="mt-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {getTrendIcon()}
                        <span className="text-sm font-bold text-white">
                            {smartWeight.recommendedWeight}kg
                        </span>
                        <span className={`text-xs font-medium ${getConfidenceColor(smartWeight.confidence)}`}>
                            {smartWeight.confidence === 'high' ? '高置信度' :
                                smartWeight.confidence === 'medium' ? '中等置信度' : '低置信度'}
                        </span>
                    </div>
                    <div className="text-xs text-slate-400">
                        {smartWeight.basedOn === 'historical_data' ? '基于历史数据' :
                            smartWeight.basedOn === 'body_weight' ? '基于体重估算' : '初学者默认'}
                    </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                    {smartWeight.reasoning}
                </p>
            </div>
        );
    };

    if (recommendations.length === 0) {
        return (
            <div className="text-center py-8">
                <Sparkles size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">暂无AI推荐</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {recommendations.map((recommendation) => {
                const isExpanded = expandedRecommendations.has(recommendation.id);
                const hasFeedback = feedbackGiven.has(recommendation.id);

                return (
                    <div
                        key={recommendation.id}
                        className={`border rounded-xl p-4 transition-all duration-300 ${getPriorityColor(recommendation.priority)}`}
                    >
                        {/* AI标识 */}
                        {recommendation.aiGenerated && (
                            <div className="flex items-center gap-1 mb-2">
                                <Sparkles size={12} className="text-emerald-400" />
                                <span className="text-xs text-emerald-400 font-medium">AI推荐</span>
                            </div>
                        )}

                        {/* 推荐标题和图标 */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                                {getRecommendationIcon(recommendation.type)}
                                <h4 className="font-bold text-white text-sm">{recommendation.title}</h4>
                            </div>
                            <div className="flex items-center gap-1">
                                {recommendation.priority === 'high' && (
                                    <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded-full">
                                        高优先级
                                    </span>
                                )}
                                {showDetails && (
                                    <button
                                        onClick={() => toggleExpanded(recommendation.id)}
                                        className="p-1 text-slate-400 hover:text-white transition-colors"
                                    >
                                        <Info size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 推荐描述 */}
                        <p className="text-slate-300 text-sm mb-3 leading-relaxed">
                            {recommendation.description}
                        </p>

                        {/* 智能重量推荐 */}
                        {recommendation.smartWeightRecommendation && (
                            renderSmartWeightRecommendation(recommendation.smartWeightRecommendation)
                        )}

                        {/* 展开的详细信息 */}
                        {isExpanded && showDetails && (
                            <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                                <p className="text-xs text-slate-400 mb-2">推荐理由：</p>
                                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                                    {recommendation.reasoning}
                                </p>

                                {recommendation.suggestedExercises && recommendation.suggestedExercises.length > 0 && (
                                    <div>
                                        <p className="text-xs text-slate-400 mb-2">推荐动作：</p>
                                        <div className="space-y-1">
                                            {recommendation.suggestedExercises.map((exercise: Exercise) => (
                                                <div key={exercise.id} className="text-xs text-slate-300 flex items-center gap-2">
                                                    <span className="w-1 h-1 bg-emerald-400 rounded-full"></span>
                                                    {exercise.name} {exercise.nameZh && `(${exercise.nameZh})`}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(recommendation.suggestedSets || recommendation.suggestedReps) && (
                                    <div className="mt-2 flex gap-4 text-xs">
                                        {recommendation.suggestedSets && (
                                            <span className="text-slate-400">
                                                建议组数: <span className="text-white">{recommendation.suggestedSets}</span>
                                            </span>
                                        )}
                                        {recommendation.suggestedReps && (
                                            <span className="text-slate-400">
                                                建议次数: <span className="text-white">{recommendation.suggestedReps}</span>
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex gap-2">
                                {recommendation.type === 'exercise' && recommendation.suggestedExercises && (
                                    <button
                                        onClick={() => onAcceptRecommendation(recommendation)}
                                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-colors"
                                    >
                                        采用推荐
                                    </button>
                                )}
                                {recommendation.type === 'weight_adjustment' && (
                                    <button
                                        onClick={() => onAcceptRecommendation(recommendation)}
                                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-lg transition-colors"
                                    >
                                        应用重量
                                    </button>
                                )}
                                <button
                                    onClick={() => onDismissRecommendation(recommendation.id)}
                                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-lg transition-colors"
                                >
                                    忽略
                                </button>
                            </div>

                            {/* 反馈按钮 */}
                            {recommendation.feedbackEnabled && !hasFeedback && (
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-slate-500 mr-2">有用吗？</span>
                                    <button
                                        onClick={() => handleFeedback(recommendation.id, 'positive')}
                                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                                        title="有用"
                                    >
                                        <ThumbsUp size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleFeedback(recommendation.id, 'negative')}
                                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                        title="无用"
                                    >
                                        <ThumbsDown size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleFeedback(recommendation.id, 'regenerate')}
                                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                        title="重新生成"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                            )}

                            {/* 反馈已给出的提示 */}
                            {hasFeedback && (
                                <div className="flex items-center gap-1 text-xs text-emerald-400">
                                    <ThumbsUp size={12} />
                                    <span>感谢反馈</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default EnhancedAIRecommendationPanel;