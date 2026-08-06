/**
 * PR Badge Card
 * 
 * Showcase user's most impressive Personal Records
 * Display max weight, max volume, etc. like achievement badges
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronRight, Calendar, TrendingUp, Award, X } from 'lucide-react';
import type { WorkoutSession } from '@/shared/types';
import PersonalRecordService, { type PersonalRecord, type PRSummary } from '../services/PersonalRecordService';

interface PRBadgeCardProps {
    workouts: WorkoutSession[];
    className?: string;
    onViewAllPRs?: () => void;
    maxDisplay?: number;
    variant?: 'compact' | 'full' | 'banner';
}

const PRBadgeCard: React.FC<PRBadgeCardProps> = ({
    workouts,
    className = '',
    onViewAllPRs,
    maxDisplay = 3,
    variant = 'compact'
}) => {
    const [prSummary, setPrSummary] = useState<PRSummary | null>(null);
    const [selectedPR, setSelectedPR] = useState<PersonalRecord | null>(null);
    const [showAllPRs, setShowAllPRs] = useState(false);

    useEffect(() => {
        const summary = PersonalRecordService.analyzePersonalRecords(workouts);
        setPrSummary(summary);
    }, [workouts]);

    // Calculate PRs to display (prioritize recent 30 days, then overall)
    const displayPRs = useMemo(() => {
        if (!prSummary) return [];
        
        // Prioritize recent PRs (within 30 days)
        const recent = prSummary.recentPRs.slice(0, maxDisplay);
        
        // If not enough recent PRs, supplement with overall
        if (recent.length < maxDisplay) {
            const existingIds = new Set(recent.map(r => r.id));
            const additional = prSummary.records
                .filter(r => !existingIds.has(r.id))
                .slice(0, maxDisplay - recent.length);
            return [...recent, ...additional];
        }
        
        return recent;
    }, [prSummary, maxDisplay]);

    // Handle click on banner - show the top PR detail
    const handleBannerClick = () => {
        if (prSummary && prSummary.records.length > 0) {
            setSelectedPR(prSummary.records[0]);
        }
    };

    // Handle view all - show full PR list modal
    const handleViewAll = () => {
        if (onViewAllPRs) {
            onViewAllPRs();
        } else {
            setShowAllPRs(true);
        }
    };

    // Format days ago text
    const formatDaysAgo = (days: number): string => {
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        return `${days} days ago`;
    };

    // If no PR data
    if (!prSummary || prSummary.records.length === 0) {
        return (
            <div className={`bg-slate-900/50 rounded-2xl border border-slate-800/50 p-4 ${className}`}>
                <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h3 className="text-white font-bold text-sm">Personal Records</h3>
                </div>
                <p className="text-slate-500 text-xs">Keep training to create your first record!</p>
            </div>
        );
    }

    // Banner variant - horizontal bar showing best PR
    if (variant === 'banner') {
        const topPR = prSummary.records[0];
        return (
            <>
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative overflow-hidden rounded-xl bg-slate-800 border border-slate-700 ${className}`}
                >
                    <div className="px-4 py-3 flex items-center justify-between">
                        <div 
                            className="flex items-center gap-3 flex-1 cursor-pointer active:scale-[0.98] transition-transform"
                            onClick={handleBannerClick}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                                <span className="text-xl">{topPR.icon}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-slate-400">Personal Best</span>
                                    {topPR.daysAgo <= 30 && (
                                        <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded flex-shrink-0">
                                            New
                                        </span>
                                    )}
                                </div>
                                <p className="text-white font-bold leading-tight">
                                    {topPR.value}
                                </p>
                                <p className="text-xs text-slate-500 line-clamp-1">
                                    {topPR.exerciseName || topPR.description}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleViewAll();
                            }}
                            className="ml-2 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors flex-shrink-0"
                            type="button"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </motion.div>

                {/* Detail Modal */}
                <AnimatePresence>
                    {selectedPR && (
                        <PRDetailModal pr={selectedPR} onClose={() => setSelectedPR(null)} />
                    )}
                </AnimatePresence>

                {/* Full PR List Modal */}
                <AnimatePresence>
                    {showAllPRs && (
                        <PRListModal 
                            prSummary={prSummary} 
                            onClose={() => setShowAllPRs(false)}
                            onSelectPR={(pr) => {
                                setSelectedPR(pr);
                            }}
                        />
                    )}
                </AnimatePresence>
            </>
        );
    }

    // Full variant - complete PR hall of fame
    if (variant === 'full') {
        return (
            <div className={`bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden ${className}`}>
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/20">
                            <Trophy className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">Hall of Fame</h3>
                            <p className="text-xs text-slate-500">{prSummary.totalWorkouts} workouts · {prSummary.records.length} records</p>
                        </div>
                    </div>
                </div>

                {/* PR Grid */}
                <div className="p-4 space-y-3">
                    {prSummary.records.map((pr, index) => (
                        <motion.div
                            key={pr.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative overflow-hidden rounded-xl bg-slate-950/50 border border-slate-800 p-3 cursor-pointer active:scale-[0.98] transition-transform"
                            onClick={() => setSelectedPR(pr)}
                        >
                            {/* Gradient bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${pr.color}`} />
                            
                            <div className="flex items-center gap-3 pl-2">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pr.color} flex items-center justify-center flex-shrink-0`}>
                                    <span className="text-2xl">{pr.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold">{pr.title}</span>
                                        {pr.daysAgo <= 30 && (
                                            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded">
                                                New
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-lg font-bold text-white truncate">{pr.value}</p>
                                    <p className="text-xs text-slate-500 truncate">{pr.description}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">{pr.dateFormatted}</p>
                                    <p className="text-[10px] text-slate-600">
                                        {formatDaysAgo(pr.daysAgo)}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Stats Summary */}
                <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-800/50">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-lg font-bold text-white">{prSummary.totalWorkouts}</p>
                            <p className="text-[10px] text-slate-500">Total Workouts</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-emerald-400">
                                {prSummary.totalWeightLifted >= 1000000 
                                    ? `${(prSummary.totalWeightLifted / 1000000).toFixed(1)}M`
                                    : prSummary.totalWeightLifted >= 1000
                                        ? `${(prSummary.totalWeightLifted / 1000).toFixed(0)}k`
                                        : prSummary.totalWeightLifted
                                }
                            </p>
                            <p className="text-[10px] text-slate-500">Total Volume (kg)</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-amber-400">{prSummary.heaviestLift}</p>
                            <p className="text-[10px] text-slate-500">Max Weight (kg)</p>
                        </div>
                    </div>
                </div>

                {/* Detail Modal */}
                <AnimatePresence>
                    {selectedPR && (
                        <PRDetailModal pr={selectedPR} onClose={() => setSelectedPR(null)} />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Compact variant - compact display (default)
    return (
        <div className={`bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/20">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <h3 className="text-white font-bold text-sm">Personal Records</h3>
                </div>
                {prSummary.records.length > maxDisplay && (
                    <button
                        onClick={handleViewAll}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                        View All
                        <ChevronRight className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* PR List */}
            <div className="p-3 space-y-2">
                {displayPRs.map((pr, index) => (
                    <motion.div
                        key={pr.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/50 hover:border-slate-700/50 transition-colors cursor-pointer active:scale-[0.98]"
                        onClick={() => setSelectedPR(pr)}
                    >
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${pr.color} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-lg">{pr.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-white font-medium text-sm">{pr.value}</span>
                                {pr.daysAgo <= 7 && (
                                    <span className="px-1 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] rounded">
                                        NEW
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{pr.description}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400">
                                {formatDaysAgo(pr.daysAgo)}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedPR && (
                    <PRDetailModal pr={selectedPR} onClose={() => setSelectedPR(null)} />
                )}
            </AnimatePresence>

            {/* Full PR List Modal */}
            <AnimatePresence>
                {showAllPRs && (
                    <PRListModal 
                        prSummary={prSummary} 
                        onClose={() => setShowAllPRs(false)}
                        onSelectPR={(pr) => {
                            setSelectedPR(pr);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// PR Detail Modal
interface PRDetailModalProps {
    pr: PersonalRecord;
    onClose: () => void;
}

const PRDetailModal: React.FC<PRDetailModalProps> = ({ pr, onClose }) => {
    const formatDaysAgo = (days: number): string => {
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        return `${days} days ago`;
    };

    // Get explanation text based on PR type
    const getExplanation = (type: string): string => {
        switch (type) {
            case 'max_volume':
                return 'Total weight × reps across all sets and exercises';
            case 'max_weight':
                return 'Heaviest single lift recorded';
            case 'max_reps':
                return 'Most reps in a single set with weight';
            case 'longest_workout':
                return 'Longest training session duration';
            case 'most_sets':
                return 'Most completed sets in one workout';
            default:
                return '';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header - Clean design without large color block */}
                <div className="relative p-6 pb-4">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }}
                        className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors z-10"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                    
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pr.color} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-3xl">{pr.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-slate-400 text-sm">{pr.title}</p>
                            <p className="text-white text-3xl font-bold truncate">{pr.value}</p>
                        </div>
                    </div>
                    
                    {/* Explanation badge */}
                    {getExplanation(pr.type) && (
                        <p className="mt-3 text-xs text-slate-500 bg-slate-800/50 px-3 py-2 rounded-lg">
                            {getExplanation(pr.type)}
                        </p>
                    )}
                </div>

                {/* Content */}
                <div className="px-6 pb-6 space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-white text-sm">{pr.dateFormatted}</p>
                            <p className="text-xs text-slate-500">
                                {pr.daysAgo === 0 ? 'Set today!' : `Achieved ${formatDaysAgo(pr.daysAgo)}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                        <TrendingUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-white text-sm truncate">{pr.description}</p>
                            <p className="text-xs text-slate-500">Exercise</p>
                        </div>
                    </div>

                    {pr.muscleGroup && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                            <Award className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-white text-sm">{pr.muscleGroup}</p>
                                <p className="text-xs text-slate-500">Muscle Group</p>
                            </div>
                        </div>
                    )}

                    {/* Footer Button */}
                    <button
                        onClick={onClose}
                        className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 font-medium hover:bg-emerald-500/30 transition-colors"
                    >
                        Great Job!
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Full PR List Modal
interface PRListModalProps {
    prSummary: PRSummary;
    onClose: () => void;
    onSelectPR: (pr: PersonalRecord) => void;
}

const PRListModal: React.FC<PRListModalProps> = ({ prSummary, onClose, onSelectPR }) => {
    const formatDaysAgo = (days: number): string => {
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        return `${days} days ago`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md max-h-[80vh] bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-700 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/20">
                            <Trophy className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Hall of Fame</h3>
                            <p className="text-xs text-slate-500">{prSummary.records.length} personal records</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }}
                        className="p-2 rounded-full hover:bg-slate-800 transition-colors z-10"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* PR List */}
                <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
                    {prSummary.records.map((pr, index) => (
                        <motion.div
                            key={pr.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative overflow-hidden rounded-xl bg-slate-950/50 border border-slate-800 p-3 cursor-pointer active:scale-[0.98] transition-transform"
                            onClick={() => onSelectPR(pr)}
                        >
                            {/* Gradient bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${pr.color}`} />
                            
                            <div className="flex items-center gap-3 pl-2">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pr.color} flex items-center justify-center flex-shrink-0`}>
                                    <span className="text-2xl">{pr.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold text-sm">{pr.title}</span>
                                        {pr.daysAgo <= 30 && (
                                            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded">
                                                New
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-lg font-bold text-white truncate">{pr.value}</p>
                                    <p className="text-xs text-slate-500 truncate">{pr.description}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">{pr.dateFormatted}</p>
                                    <p className="text-[10px] text-slate-600">
                                        {formatDaysAgo(pr.daysAgo)}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer Stats */}
                <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-800">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xl font-bold text-white">{prSummary.totalWorkouts}</p>
                            <p className="text-[10px] text-slate-500">Workouts</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-emerald-400">
                                {prSummary.totalWeightLifted >= 1000
                                    ? `${(prSummary.totalWeightLifted / 1000).toFixed(1)}k`
                                    : prSummary.totalWeightLifted
                                }
                            </p>
                            <p className="text-[10px] text-slate-500">Total kg</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-amber-400">{prSummary.heaviestLift}</p>
                            <p className="text-[10px] text-slate-500">Max kg</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PRBadgeCard;
