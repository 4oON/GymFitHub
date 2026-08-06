/**
 * Achievement Hall - 成就殿堂
 * 
 * 全新设计的成就墙，强调视觉冲击力和激励性
 * 展示复合动作大重量PR、力量等级、里程碑
 * 
 * 🆕 新增功能:
 * - 展开/收起状态: 收起时只显示近期成就
 * - AI重量类比: 实时AI生成有趣的重量对比
 * - 修复Modal关闭问题
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Target, ChevronRight, Crown, Star, Zap, ChevronDown, ChevronUp, RefreshCw, Sparkles } from 'lucide-react';
import type { WorkoutSession } from '@/shared/types';
import AchievementService, { type Achievement, type AchievementSummary } from '../services/AchievementService';
import { AIWeightComparisonService, type AIComparisonResult } from '../services/AIWeightComparisonService';
import AchievementDetailModal from './AchievementDetailModal';

interface AchievementHallProps {
    workouts: WorkoutSession[];
    className?: string;
    defaultExpanded?: boolean;
}

// 稀有度配置
const RARITY_CONFIG = {
    legendary: { 
        label: 'LEGENDARY', 
        color: 'text-rose-400', 
        bg: 'from-rose-500/20 to-red-500/10',
        border: 'border-rose-500/30',
        glow: 'shadow-rose-500/20'
    },
    epic: { 
        label: 'EPIC', 
        color: 'text-amber-400', 
        bg: 'from-amber-500/20 to-orange-500/10',
        border: 'border-amber-500/30',
        glow: 'shadow-amber-500/20'
    },
    rare: { 
        label: 'RARE', 
        color: 'text-purple-400', 
        bg: 'from-purple-500/20 to-violet-500/10',
        border: 'border-purple-500/30',
        glow: 'shadow-purple-500/20'
    },
    common: { 
        label: 'COMMON', 
        color: 'text-blue-400', 
        bg: 'from-blue-500/20 to-cyan-500/10',
        border: 'border-blue-500/30',
        glow: 'shadow-blue-500/20'
    }
};

const AchievementHall: React.FC<AchievementHallProps> = ({ 
    workouts, 
    className = '',
    defaultExpanded = false 
}) => {
    const [summary, setSummary] = useState<AchievementSummary | null>(null);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [activeTab, setActiveTab] = useState<'featured' | 'all' | 'prs'>('featured');
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    
    // 🆕 AI类比相关状态
    const [aiComparison, setAiComparison] = useState<AIComparisonResult | null>(null);
    const [isAILoading, setIsAILoading] = useState(false);

    useEffect(() => {
        const data = AchievementService.analyzeAchievements(workouts);
        setSummary(data);
    }, [workouts]);

    // 🆕 获取AI类比
    useEffect(() => {
        if (summary && summary.stats.totalTons >= 1) {
            loadAIComparison(summary.stats.totalTons);
        }
    }, [summary?.stats.totalTons]);

    const loadAIComparison = useCallback(async (tons: number, forceRefresh = false) => {
        setIsAILoading(true);
        try {
            const result = await AIWeightComparisonService.getAIComparison(tons, forceRefresh);
            setAiComparison(result);
        } catch (e) {
            console.error('Failed to load AI comparison:', e);
        } finally {
            setIsAILoading(false);
        }
    }, []);

    // 所有 hooks 必须在条件 return 之前调用
    const featuredAchievements = useMemo(() => {
        if (!summary) return [];
        const recent = summary.recentAchievements.slice(0, 3);
        if (recent.length >= 3) return recent;
        
        const existingIds = new Set(recent.map(a => a.id));
        const topTier = summary.achievements
            .filter(a => !existingIds.has(a.id))
            .slice(0, 3 - recent.length);
        return [...recent, ...topTier];
    }, [summary]);

    const recentOnlyAchievements = useMemo(() => {
        if (!summary) return [];
        return summary.recentAchievements.slice(0, 4);
    }, [summary]);

    // 条件 return 放在所有 hooks 之后
    if (!summary || summary.achievements.length === 0) {
        return (
            <div className={`bg-slate-900/50 rounded-2xl border border-slate-800/50 p-6 ${className}`}>
                <div className="text-center">
                    <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-white font-bold text-lg mb-1">Achievement Hall</h3>
                    <p className="text-slate-500 text-sm">Start training to unlock your first achievements!</p>
                </div>
            </div>
        );
    }

    const stats = summary.stats;
    const hasRecentPRs = recentOnlyAchievements.length > 0;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* 🏆 头部 - 显示总体统计 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h3 className="text-white font-bold">Achievement Hall</h3>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
                    type="button"
                >
                    {isExpanded ? (
                        <><ChevronUp className="w-4 h-4" /> Collapse</>
                    ) : (
                        <><ChevronDown className="w-4 h-4" /> View All</>
                    )}
                </button>
            </div>

            {/* 📊 STATS BAR - 始终显示 */}
            <StatsBar stats={stats} aiComparison={aiComparison} />

            <AnimatePresence mode="wait">
                {isExpanded ? (
                    // 🌟 展开状态: 完整成就墙
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 overflow-hidden"
                    >
                        {/* HERO SECTION */}
                        <HeroSection 
                            topAchievement={summary.achievements[0]} 
                            stats={stats}
                            aiQuote={aiComparison?.motivationalQuote}
                            onClick={() => setSelectedAchievement(summary.achievements[0])}
                        />

                        {/* TABS */}
                        <div className="flex gap-2 px-1">
                            {(['featured', 'all', 'prs'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                                        activeTab === tab 
                                            ? 'bg-slate-800 text-white' 
                                            : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                    type="button"
                                >
                                    {tab === 'featured' ? 'Recent' : tab === 'all' ? 'All' : 'PRs'}
                                </button>
                            ))}
                        </div>

                        {/* ACHIEVEMENT GRID */}
                        <div className="grid grid-cols-2 gap-3">
                            {activeTab === 'featured' && featuredAchievements.map((achievement, index) => (
                                <AchievementCard 
                                    key={achievement.id}
                                    achievement={achievement}
                                    index={index}
                                    onClick={() => setSelectedAchievement(achievement)}
                                />
                            ))}
                            
                            {activeTab === 'all' && summary.achievements.slice(0, 8).map((achievement, index) => (
                                <AchievementCard 
                                    key={achievement.id}
                                    achievement={achievement}
                                    index={index}
                                    onClick={() => setSelectedAchievement(achievement)}
                                />
                            ))}
                            
                            {activeTab === 'prs' && summary.exercisePRs.slice(0, 8).map((achievement, index) => (
                                <AchievementCard 
                                    key={achievement.id}
                                    achievement={achievement}
                                    index={index}
                                    onClick={() => setSelectedAchievement(achievement)}
                                />
                            ))}
                        </div>

                        {/* COMPOUND LIFT FOCUS */}
                        <CompoundLiftSection achievements={summary.exercisePRs} />

                        {/* 🆕 AI MOTIVATION CARD */}
                        <AIMotivationCard 
                            stats={stats}
                            aiComparison={aiComparison}
                            isLoading={isAILoading}
                            onRefresh={() => loadAIComparison(stats.totalTons, true)}
                        />
                    </motion.div>
                ) : (
                    // 📱 收起状态: 只显示近期成就
                    <motion.div
                        key="collapsed"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3 overflow-hidden"
                    >
                        {hasRecentPRs ? (
                            <>
                                <p className="text-slate-400 text-sm">Recent Achievements</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {recentOnlyAchievements.map((achievement, index) => (
                                        <AchievementCard 
                                            key={achievement.id}
                                            achievement={achievement}
                                            index={index}
                                            onClick={() => setSelectedAchievement(achievement)}
                                            compact
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                                <p className="text-slate-500 text-sm">No recent achievements</p>
                                <p className="text-slate-600 text-xs mt-1">Complete a workout to earn new badges!</p>
                            </div>
                        )}

                        {/* AI 简洁版激励 */}
                        {aiComparison && (
                            <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-3">
                                <p className="text-emerald-400 text-xs font-bold mb-1 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> AI INSIGHT
                                </p>
                                <p className="text-white text-sm">{aiComparison.summary}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedAchievement && (
                    <AchievementDetailModal 
                        achievement={selectedAchievement}
                        onClose={() => setSelectedAchievement(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// Hero Section - 最突出的成就展示
const HeroSection: React.FC<{ 
    topAchievement: Achievement; 
    stats: AchievementSummary['stats'];
    aiQuote?: string;
    onClick: () => void;
}> = ({ topAchievement, stats, aiQuote, onClick }) => {
    const rarity = RARITY_CONFIG[topAchievement.rarity];
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${rarity.bg} border ${rarity.border} p-5 cursor-pointer active:scale-[0.98] transition-transform`}
            onClick={onClick}
        >
            {/* Background glow */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${topAchievement.color} opacity-20 blur-3xl`} />
            
            <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className={`px-2 py-1 rounded-lg bg-slate-950/50 ${rarity.color} text-xs font-bold tracking-wider`}>
                        {rarity.label}
                    </div>
                    {topAchievement.isNew && (
                        <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                            NEW!
                        </span>
                    )}
                </div>

                {/* Main content */}
                <div className="flex items-end gap-4">
                    <div className="text-5xl">{topAchievement.icon}</div>
                    <div className="flex-1">
                        <h2 className="text-white text-2xl font-bold leading-tight">
                            {topAchievement.title}
                        </h2>
                        <p className="text-white/60 text-sm mt-1">{topAchievement.subtitle}</p>
                    </div>
                </div>

                {/* Value */}
                <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">{topAchievement.value}</span>
                    <span className="text-xl text-white/60">{topAchievement.unit}</span>
                </div>

                {/* 🆕 AI Quote */}
                {aiQuote && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-white/80 text-sm italic">"{aiQuote}"</p>
                    </div>
                )}

                {/* Bottom row */}
                <div className="mt-4 flex items-center justify-between">
                    <p className="text-white/40 text-xs">
                        {topAchievement.daysAgo === 0 ? 'Today' : `${topAchievement.daysAgo} days ago`}
                    </p>
                    <ChevronRight className="w-5 h-5 text-white/40" />
                </div>
            </div>
        </motion.div>
    );
};

// Stats Bar - 快速统计
const StatsBar: React.FC<{ 
    stats: AchievementSummary['stats'];
    aiComparison: AIComparisonResult | null;
}> = ({ stats, aiComparison }) => {
    // 使用AI生成的最佳类比显示在StatsBar
    const bestComparison = aiComparison?.comparisons[0];
    
    return (
        <div className="grid grid-cols-4 gap-2">
            <StatItem icon={Flame} value={stats.currentStreak} label="Streak" color="text-orange-400" />
            <StatItem icon={Trophy} value={stats.totalWorkouts} label="Workouts" color="text-amber-400" />
            <StatItem 
                icon={Target} 
                value={stats.totalTons} 
                label={bestComparison 
                    ? `${bestComparison.icon} ${bestComparison.count}` 
                    : "Tons"
                } 
                color="text-emerald-400" 
            />
            <StatItem icon={Zap} value={stats.heaviestLift} label="Max kg" color="text-purple-400" />
        </div>
    );
};

const StatItem: React.FC<{ 
    icon: React.ElementType; 
    value: number; 
    label: string; 
    color: string 
}> = ({ icon: Icon, value, label, color }) => (
    <div className="bg-slate-900 rounded-xl p-3 text-center border border-slate-800">
        <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
        <p className="text-white font-bold text-lg">{value || 0}</p>
        <p className="text-slate-500 text-[10px] leading-tight truncate px-1">{label}</p>
    </div>
);

// Achievement Card - 网格中的成就卡片
const AchievementCard: React.FC<{ 
    achievement: Achievement; 
    index: number;
    onClick: () => void;
    compact?: boolean;
}> = ({ achievement, index, onClick, compact }) => {
    const rarity = RARITY_CONFIG[achievement.rarity];
    
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`relative overflow-hidden rounded-xl bg-slate-900 border ${rarity.border} cursor-pointer active:scale-95 transition-all hover:border-opacity-60 ${compact ? 'p-2.5' : 'p-3'}`}
            onClick={onClick}
        >
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-full bg-gradient-to-br ${achievement.color} opacity-10 blur-2xl`} />
            
            <div className="flex items-start justify-between">
                <span className={compact ? 'text-xl' : 'text-2xl'}>{achievement.icon}</span>
                {achievement.isNew && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
            </div>
            
            <div className="mt-2">
                <p className={`font-bold tracking-wider ${rarity.color} uppercase ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                    {rarity.label}
                </p>
                <p className={`text-white font-bold truncate ${compact ? 'text-xs' : 'text-sm'}`}>{achievement.title}</p>
                <p className={`text-white/60 ${compact ? 'text-[10px]' : 'text-xs'}`}>{achievement.value} {achievement.unit}</p>
            </div>
        </motion.div>
    );
};

// Compound Lift Section - 复合动作重点展示
const CompoundLiftSection: React.FC<{ achievements: Achievement[] }> = ({ achievements }) => {
    // 只展示大重量的复合动作
    const bigLifts = achievements
        .filter(a => parseInt(a.value) >= 100)
        .slice(0, 3);

    if (bigLifts.length === 0) return null;

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="text-white font-bold text-sm">Big Lifts</h3>
            </div>
            
            <div className="space-y-2">
                {bigLifts.map((lift) => (
                    <div key={lift.id} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${lift.color} flex items-center justify-center text-sm`}>
                            {lift.icon}
                        </div>
                        <div className="flex-1">
                            <p className="text-white text-sm font-medium">{lift.title}</p>
                        </div>
                        <p className="text-white font-bold">{lift.value}<span className="text-slate-500 text-xs ml-0.5">kg</span></p>
                    </div>
                ))}
            </div>
            
            {bigLifts.length < 3 && (
                <p className="mt-3 text-xs text-slate-500 text-center">
                    Keep pushing for 100kg+ on more exercises!
                </p>
            )}
        </div>
    );
};

// 🆕 AI Motivation Card - AI生成的激励卡片
const AIMotivationCard: React.FC<{ 
    stats: AchievementSummary['stats'];
    aiComparison: AIComparisonResult | null;
    isLoading: boolean;
    onRefresh: () => void;
}> = ({ stats, aiComparison, isLoading, onRefresh }) => {
    if (isLoading) {
        return (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-emerald-400 text-xs font-bold mb-0.5">AI THINKING...</p>
                        <p className="text-white/60 text-sm">正在生成有趣的重量类比...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!aiComparison) return null;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 p-4">
            {/* 刷新按钮 */}
            <button
                onClick={onRefresh}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 transition-colors"
                title="重新生成"
                type="button"
            >
                <RefreshCw className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                    <p className="text-emerald-400 text-xs font-bold mb-1 flex items-center gap-1">
                        <span>✨</span> AI INSIGHT
                    </p>
                    <p className="text-white text-sm mb-3">{aiComparison.summary}</p>
                    
                    {/* 类比列表 */}
                    <div className="space-y-2">
                        {aiComparison.comparisons.slice(0, 3).map((comp, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <span className="text-lg">{comp.icon}</span>
                                <span className="text-white/80">
                                    {comp.count} {comp.object}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* 激励语 */}
                    {aiComparison.motivationalQuote && (
                        <p className="mt-3 text-emerald-400/80 text-xs italic">
                            "{aiComparison.motivationalQuote}"
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AchievementHall;
