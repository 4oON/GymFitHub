/**
 * History-Based AI Recommendation Panel
 *
 * Smart workout recommendations based on historical training data
 * Uses AI when AI Coach is enabled, otherwise falls back to local algorithm
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronDown,
    ChevronUp,
    ThumbsUp,
    ThumbsDown,
    RefreshCw,
    Info,
    Dumbbell,
    TrendingUp,
    Clock,
    Zap,
    Plus,
    Trophy
} from 'lucide-react';
import { AIThinkingLoader } from '@/shared/components/ui/AIThinkingLoader';
import EnhancedAIRecommendationServiceV2, {
    type HistoryBasedRecommendation,
    type EnhancedRecommendationContext
} from '../services/EnhancedAIRecommendationServiceV2';
import HistoricalDataQueryService, { type LastSetData } from '../services/HistoricalDataQueryService';
import { MuscleGroup } from '@/shared/types';
import { aiConfigBackendService, type AIProviderConfig } from '../services/AIConfigBackendService';
import {
    generateAIWorkoutRecommendations,
    isAICoachAvailable,
    calculateTokenCost,
    type AIWorkoutRecommendation,
    type TokenUsage
} from '../services/AIWorkoutRecommendationService';
import { TokenUsageBadge } from './TokenUsageBadge';
import { iOSStorage } from '@/services/iOSStorageService';

interface HistoryBasedAIRecommendationPanelProps {
    context: EnhancedRecommendationContext;
    targetMuscleGroup?: MuscleGroup;
    onAcceptRecommendation: (recommendation: HistoryBasedRecommendation) => void;
    isExpanded?: boolean;
    onToggleExpanded?: (expanded: boolean) => void;
}

export const HistoryBasedAIRecommendationPanel: React.FC<HistoryBasedAIRecommendationPanelProps> = ({
    context,
    targetMuscleGroup,
    onAcceptRecommendation,
    isExpanded = false,
    onToggleExpanded
}) => {
    const [recommendations, setRecommendations] = useState<HistoryBasedRecommendation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastSetDataMap, setLastSetDataMap] = useState<Map<string, LastSetData>>(new Map());
    const [showDetails, setShowDetails] = useState<Set<string>>(new Set());
    const [defaultConfig, setDefaultConfig] = useState<AIProviderConfig | null>(null);
    const [aiCoachEnabled, setAiCoachEnabled] = useState(true);
    const [useAI, setUseAI] = useState(false);
    const [aiRecommendations, setAiRecommendations] = useState<AIWorkoutRecommendation[]>([]);
    const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
    const [tokenCost, setTokenCost] = useState<{ totalCost: number; currency: string } | null>(null);

    // Use ref to track previous AI status to detect changes
    const prevAIStatusRef = useRef<boolean | null>(null);

    // Token tracker for cumulative tracking (if needed in future)
    // const tokenTracker = useTokenTracker();

    // Generate recommendations - uses AI if available, otherwise local algorithm
    const generateRecommendations = async (forceRegenerate = false) => {
        if (isLoading && !forceRegenerate) return;

        setIsLoading(true);

        try {
            // Check current AI status
            const aiAvailable = await isAICoachAvailable();
            setUseAI(aiAvailable);

            if (aiAvailable) {
                console.log('🤖 [Recommendations] Using AI to generate recommendations...');

                // Use AI service
                const aiResult = await generateAIWorkoutRecommendations({
                    userProfile: context.userProfile,
                    currentWorkout: context.currentWorkout,
                    recoveryState: context.recoveryState,
                    workoutHistory: context.workoutHistory,
                    exerciseLibrary: context.exerciseLibrary,
                    targetMuscleGroup
                });

                setAiRecommendations(aiResult.recommendations);
                setTokenUsage(aiResult.usage);
                
                console.log('[Recommendations] AI result:', {
                    usage: aiResult.usage,
                    provider: aiResult.provider,
                    model: aiResult.model
                });
                
                // Calculate cost (now always have usage, either from API or estimated)
                const cost = calculateTokenCost(
                    aiResult.usage,
                    aiResult.provider,
                    aiResult.model
                );
                console.log('[Recommendations] Token cost:', cost);
                setTokenCost({ totalCost: cost.totalCost, currency: cost.currency });

                // Convert AI recommendations to local format for display
                const convertedRecs: HistoryBasedRecommendation[] = aiResult.recommendations.map(aiRec => ({
                    exerciseName: aiRec.exerciseName,
                    sets: aiRec.sets,
                    reps: aiRec.reps,
                    smartWeight: {
                        weight: aiRec.weight,
                        confidence: aiRec.confidence,
                        reasoning: aiRec.reason,
                        basedOnHistory: false
                    },
                    reason: aiRec.reason,
                    tip: aiRec.tip,
                    confidenceLevel: aiRec.confidence,
                    popularityRating: 2
                }));

                setRecommendations(convertedRecs);

                // Get last set data for AI recommended exercises
                const lastSetMap = new Map<string, LastSetData>();
                for (const rec of convertedRecs) {
                    const lastSetData = HistoricalDataQueryService.getLastSetData(undefined, rec.exerciseName);
                    if (lastSetData) {
                        lastSetMap.set(rec.exerciseName, lastSetData);
                    }
                }
                setLastSetDataMap(lastSetMap);

                console.log('✅ [Recommendations] AI generated', aiResult.recommendations.length, 'recommendations');

            } else {
                console.log('📊 [Recommendations] Using local algorithm...');

                // Use local algorithm
                const newRecommendations = EnhancedAIRecommendationServiceV2.generateHistoryBasedRecommendations(
                    context,
                    targetMuscleGroup,
                    3
                );

                setAiRecommendations([]);

                // Get last set data for each recommendation
                const lastSetMap = new Map<string, LastSetData>();
                for (const rec of newRecommendations) {
                    const lastSetData = HistoricalDataQueryService.getLastSetData(undefined, rec.exerciseName);
                    if (lastSetData) {
                        lastSetMap.set(rec.exerciseName, lastSetData);
                    }
                }

                setRecommendations(newRecommendations);
                setLastSetDataMap(lastSetMap);
                setTokenUsage(null);
                setTokenCost(null);
            }

            // Update ref after successful generation
            prevAIStatusRef.current = aiAvailable;

        } catch (error) {
            console.error('❌ [Recommendations] Failed to generate, falling back to local:', error);

            // Fallback to local algorithm on error
            const newRecommendations = EnhancedAIRecommendationServiceV2.generateHistoryBasedRecommendations(
                context,
                targetMuscleGroup,
                3
            );
            setRecommendations(newRecommendations);
            setUseAI(false);
            setTokenUsage(null);
            setTokenCost(null);

            // Get last set data
            const lastSetMap = new Map<string, LastSetData>();
            for (const rec of newRecommendations) {
                const lastSetData = HistoricalDataQueryService.getLastSetData(undefined, rec.exerciseName);
                if (lastSetData) {
                    lastSetMap.set(rec.exerciseName, lastSetData);
                }
            }
            setLastSetDataMap(lastSetMap);
        } finally {
            setIsLoading(false);
        }
    };

    // Load AI status and check for changes
    useEffect(() => {
        const loadAIStatus = async () => {
            // Check AI Coach toggle state
            let enabled = true;
            try {
                enabled = iOSStorage.getItem('zenfit_ai_enabled') !== 'false';
            } catch {
                enabled = true;
            }
            setAiCoachEnabled(enabled);

            // Load default config from new backend service
            let config: AIProviderConfig | null = null;
            try {
                config = await aiConfigBackendService.getDefaultConfig();
            } catch (error) {
                console.log('Failed to load AI config:', error);
            }
            setDefaultConfig(config);

            const isNowEnabled = enabled && config !== null;

            // If AI status changed from previous state, regenerate
            if (prevAIStatusRef.current !== null && prevAIStatusRef.current !== isNowEnabled) {
                console.log(`🔄 [Recommendations] AI status changed: ${prevAIStatusRef.current} -> ${isNowEnabled}, regenerating...`);
                generateRecommendations(true);
            }

            prevAIStatusRef.current = isNowEnabled;
        };

        loadAIStatus();

        // Listen for storage changes (when AI toggle is changed in AIControlBar)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'zenfit_ai_enabled') {
                console.log('[Recommendations] AI toggle changed, reloading status...');
                loadAIStatus();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []); // Only run on mount

    // Initial load of recommendations
    useEffect(() => {
        generateRecommendations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetMuscleGroup]); // Only regenerate when target muscle changes

    // Handle feedback
    const handleFeedback = async (
        recommendation: HistoryBasedRecommendation,
        feedback: 'helpful' | 'too_heavy' | 'too_light' | 'regenerate'
    ) => {
        await EnhancedAIRecommendationServiceV2.recordRecommendationFeedback(
            recommendation.exerciseName,
            recommendation.smartWeight.weight,
            0,
            feedback
        );

        if (feedback === 'regenerate') {
            generateRecommendations(true);
        }
    };

    // Toggle details
    const toggleDetails = (exerciseName: string) => {
        const newShowDetails = new Set(showDetails);
        if (newShowDetails.has(exerciseName)) {
            newShowDetails.delete(exerciseName);
        } else {
            newShowDetails.add(exerciseName);
        }
        setShowDetails(newShowDetails);
    };

    // Format date
    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Get AI provider display info
    const getAIStatusInfo = () => {
        // AI Coach is disabled or no config
        if (!aiCoachEnabled || !defaultConfig) {
            return {
                dotClass: 'bg-slate-500',
                pulseClass: '',
                label: 'LOCAL',
                badgeClass: 'bg-slate-800/80 text-slate-400 border-slate-700'
            };
        }

        const provider = defaultConfig.provider;

        const providerColors: Record<string, { color: string; label: string; badgeClass: string }> = {
            'kimi': { color: 'bg-indigo-500', label: 'Kimi', badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
            'openai': { color: 'bg-emerald-500', label: 'OpenAI', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
            'perplexity': { color: 'bg-teal-500', label: 'Perplexity', badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
            'anthropic': { color: 'bg-orange-500', label: 'Claude', badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
            'custom': { color: 'bg-violet-500', label: 'AI', badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/30' }
        };

        const info = providerColors[provider] || providerColors['custom'];

        return {
            dotClass: info.color,
            pulseClass: info.color.replace('bg-', 'shadow-'),
            label: info.label,
            badgeClass: info.badgeClass
        };
    };

    const aiStatus = getAIStatusInfo();

    // Get confidence badge
    const getConfidenceBadge = (confidence: number) => {
        if (confidence >= 0.8) return { text: 'High', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
        if (confidence >= 0.6) return { text: 'Medium', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
        return { text: 'Low', class: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    };

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            {/* Header - 移动端优化 */}
            <button
                onClick={() => onToggleExpanded?.(!isExpanded)}
                className="w-full px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                        <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${aiStatus.dotClass} ${aiCoachEnabled && defaultConfig ? 'animate-pulse' : ''}`} />
                        {aiCoachEnabled && defaultConfig && (
                            <div className={`absolute inset-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${aiStatus.dotClass} animate-ping opacity-60`} />
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <h3 className="font-bold text-white text-sm sm:text-base whitespace-nowrap">Smart Recommendations</h3>
                        <span className={`text-[9px] sm:text-[10px] uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded border whitespace-nowrap ${aiStatus.badgeClass}`}>
                            {aiStatus.label}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    {recommendations.length > 0 && (
                        <span className="text-sm text-slate-500 font-medium min-w-[1.25rem] text-center bg-slate-800 rounded-md px-1">
                            {recommendations.length}
                        </span>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-500" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                    )}
                </div>
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="border-t border-slate-800">
                    {isLoading ? (
                        <div className="p-8">
                            <AIThinkingLoader 
                                language="en" 
                                size="md"
                                showCard={false}
                            />
                        </div>
                    ) : recommendations.length > 0 ? (
                        <div className="divide-y divide-slate-800/50">
                            {recommendations.map((rec, index) => {
                                const lastSetData = lastSetDataMap.get(rec.exerciseName);
                                const isDetailsVisible = showDetails.has(rec.exerciseName);
                                const confidenceBadge = getConfidenceBadge(rec.confidenceLevel);

                                return (
                                    <div
                                        key={index}
                                        className="p-4 hover:bg-slate-800/30 transition-colors"
                                    >
                                        {/* Exercise Name & Rating */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-white text-base">
                                                        {rec.exerciseName}
                                                    </h4>
                                                    <div className="flex">
                                                        {Array.from({ length: rec.popularityRating || 1 }).map((_, i) => (
                                                            <Zap key={i} className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Stats Row */}
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Dumbbell className="w-3.5 h-3.5" />
                                                        <span>{rec.sets} sets × {rec.reps}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                                                        <TrendingUp className="w-3.5 h-3.5" />
                                                        <span>{rec.smartWeight.weight}kg</span>
                                                    </div>
                                                    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${confidenceBadge.class}`}>
                                                        {confidenceBadge.text}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Add Button */}
                                            <button
                                                onClick={() => onAcceptRecommendation(rec)}
                                                className="ml-3 p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Last Workout Info & Max Weight Record */}
                                        {(lastSetData || rec.smartWeight.maxWeightRecord) && (
                                            <div className="mb-3 space-y-2">
                                                {/* 🆕 历史最大重量记录 */}
                                                {rec.smartWeight.maxWeightRecord && (
                                                    <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/5 rounded-xl border border-amber-500/20">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                                            <span className="text-xs font-medium text-amber-400">历史最佳重量</span>
                                                            <span className="text-xs text-slate-500">
                                                                • {rec.smartWeight.maxWeightRecord.daysAgo === 0 ? '今天' : 
                                                                    rec.smartWeight.maxWeightRecord.daysAgo === 1 ? '昨天' : 
                                                                    `${rec.smartWeight.maxWeightRecord.daysAgo} 天前`}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm">
                                                            <span className="font-bold text-amber-400">{rec.smartWeight.maxWeightRecord.weight}kg</span>
                                                            <span className="text-slate-500 mx-1.5">×</span>
                                                            <span className="font-semibold text-slate-300">{rec.smartWeight.maxWeightRecord.reps} 次</span>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* 上次训练数据 */}
                                                {lastSetData && (
                                                    <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                                            <span className="text-xs font-medium text-emerald-400">上次训练</span>
                                                            <span className="text-xs text-slate-500">• {formatDate(lastSetData.sessionDate)}</span>
                                                        </div>
                                                        <div className="text-sm text-slate-300">
                                                            <span className="font-semibold text-white">{lastSetData.weight}kg</span>
                                                            <span className="text-slate-500 mx-1.5">×</span>
                                                            <span className="font-semibold text-white">{lastSetData.reps} reps</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Reason & Tip */}
                                        <div className="mb-3">
                                            <p className="text-sm text-slate-400 leading-relaxed">{rec.reason}</p>
                                            {rec.tip && (
                                                <p className="mt-2 text-xs text-slate-500 flex items-start gap-1.5">
                                                    <span className="text-emerald-400">💡</span>
                                                    <span>{rec.tip}</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* Details Panel */}
                                        {isDetailsVisible && (
                                            <div className="mb-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                                <p className="text-xs text-slate-500 mb-1">Weight Basis</p>
                                                <p className="text-sm text-slate-300">{rec.smartWeight.reasoning}</p>
                                                {rec.smartWeight.similarExercises && rec.smartWeight.similarExercises.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-xs text-slate-500 mb-1">Similar Exercises</p>
                                                        <p className="text-sm text-slate-300">{rec.smartWeight.similarExercises.join(', ')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleFeedback(rec, 'helpful')}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                            >
                                                <ThumbsUp className="w-3.5 h-3.5" />
                                                <span>Helpful</span>
                                            </button>
                                            <button
                                                onClick={() => handleFeedback(rec, 'too_heavy')}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                            >
                                                <ThumbsDown className="w-3.5 h-3.5" />
                                                <span>Heavy</span>
                                            </button>
                                            <button
                                                onClick={() => handleFeedback(rec, 'too_light')}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                            >
                                                <ThumbsDown className="w-3.5 h-3.5" />
                                                <span>Light</span>
                                            </button>
                                            <button
                                                onClick={() => toggleDetails(rec.exerciseName)}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors ml-auto"
                                            >
                                                <Info className="w-3.5 h-3.5" />
                                                <span>{isDetailsVisible ? 'Less' : 'More'}</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Regenerate Button */}
                            <div className="p-4 border-t border-slate-800/50">
                                <button
                                    onClick={() => generateRecommendations(true)}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-400 disabled:opacity-50 transition-colors"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                    <span>Generate New Recommendations</span>
                                </button>
                            </div>

                            {/* Token Usage - Using reusable component with premium style */}
                            <div className="px-4 pb-4">
                                <TokenUsageBadge
                                    usage={tokenUsage}
                                    cost={tokenCost}
                                    variant="premium"
                                    showLabel={true}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Dumbbell className="w-5 h-5 text-slate-500" />
                            </div>
                            <p className="text-sm text-slate-500 mb-1">No recommendations yet</p>
                            <p className="text-xs text-slate-600">Start training to get personalized suggestions</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HistoryBasedAIRecommendationPanel;
