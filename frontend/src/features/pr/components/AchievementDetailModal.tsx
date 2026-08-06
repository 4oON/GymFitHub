/**
 * Achievement Detail Modal
 * Shows achievement details with weight-specific AI comparison
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, RefreshCw } from 'lucide-react';
import { AIWeightComparisonService, type AIComparisonResult } from '../services/AIWeightComparisonService';
import type { Achievement } from '../services/AchievementService';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';

interface AchievementDetailModalProps {
    achievement: Achievement;
    onClose: () => void;
}

// Rarity config
const RARITY_CONFIG = {
    legendary: { label: 'LEGENDARY', color: 'text-rose-400' },
    epic: { label: 'EPIC', color: 'text-amber-400' },
    rare: { label: 'RARE', color: 'text-purple-400' },
    common: { label: 'COMMON', color: 'text-blue-400' }
};

const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({ 
    achievement, 
    onClose 
}) => {
    // Lock body scroll when modal is open (iOS fix)
    useBodyScrollLock(true);
    
    const modalRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const rarity = RARITY_CONFIG[achievement.rarity];
    
    // Modal has its own comparison state based on THIS achievement's weight
    const [modalComparison, setModalComparison] = useState<AIComparisonResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Generate comparison for this specific achievement
    const generateComparison = useCallback(async (forceRefresh = false) => {
        setIsLoading(true);
        try {
            const value = parseInt(achievement.value);
            let result: AIComparisonResult;

            if (achievement.unit === 'tons') {
                // Total volume milestone
                result = await AIWeightComparisonService.getAIComparison(value, forceRefresh);
            } else if (achievement.unit === 'kg' && value >= 20) {
                // Single PR weight (20kg+)
                result = await AIWeightComparisonService.getSingleWeightComparison(value, achievement.exerciseName, forceRefresh);
            } else {
                setIsLoading(false);
                return;
            }

            setModalComparison(result);
        } catch (e) {
            console.error('Failed to generate comparison:', e);
        } finally {
            setIsLoading(false);
        }
    }, [achievement.value, achievement.unit, achievement.exerciseName]);

    // Generate comparison when modal opens
    useEffect(() => {
        const value = parseInt(achievement.value);
        const shouldShowComparison = achievement.unit === 'tons' || 
            (achievement.unit === 'kg' && value >= 20);
        
        if (shouldShowComparison) {
            generateComparison();
        }
    }, [achievement, generateComparison]);

    const handleClose = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
    };

    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    // iOS: Prevent scroll events from bubbling to background
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const modal = modalRef.current;
        const content = contentRef.current;
        if (!modal || !content) return;

        // Allow scrolling within the modal content
        const isAtTop = content.scrollTop <= 0;
        const isAtBottom = content.scrollHeight - content.scrollTop <= content.clientHeight + 1;

        if ((isAtTop && e.touches[0].clientY > 0) || (isAtBottom && e.touches[0].clientY < 0)) {
            // At boundaries, prevent default to stop background scroll
            // But only if we're not in the middle of the content
        }
    }, []);

    // Handle scroll with momentum for iOS
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        // iOS needs this to prevent scroll chaining
        e.stopPropagation();
    }, []);

    const shouldShowComparison = achievement.unit === 'tons' || 
        (achievement.unit === 'kg' && parseInt(achievement.value) >= 20);

    const value = parseInt(achievement.value);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
        >
            <motion.div
                ref={modalRef}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-700 overflow-hidden flex flex-col"
                style={{ 
                    maxHeight: 'calc(100vh - env(safe-area-inset-top) - 20px)',
                    marginTop: 'env(safe-area-inset-top)',
                    WebkitOverflowScrolling: 'touch'
                }}
                onClick={handleContentClick}
                onTouchMove={handleTouchMove}
            >
                {/* iOS Safe Area Top Spacer */}
                <div className="h-safe-top" />
                {/* Header */}
                <div className={`relative h-40 bg-gradient-to-br ${achievement.color} p-6`}>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 transition-colors z-10"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-7xl">{achievement.icon}</span>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div 
                    ref={contentRef}
                    className="flex-1 overflow-y-auto p-6 pb-safe"
                    style={{ 
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehavior: 'contain'
                    }}
                    onScroll={handleScroll}
                >
                    <div className={`inline-block px-3 py-1 rounded-full bg-slate-800 ${rarity.color} text-xs font-bold mb-3`}>
                        {rarity.label} ACHIEVEMENT
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-1">{achievement.title}</h2>
                    <p className="text-slate-400 mb-4">{achievement.subtitle}</p>
                    
                    <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-5xl font-black text-white">{achievement.value}</span>
                        <span className="text-xl text-slate-500">{achievement.unit}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800 rounded-xl p-3">
                            <p className="text-slate-500 text-xs">Achieved</p>
                            <p className="text-white font-medium">
                                {achievement.daysAgo === 0 ? 'Today' : `${achievement.daysAgo} days ago`}
                            </p>
                        </div>
                        {achievement.exerciseName && (
                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-slate-500 text-xs">Exercise</p>
                                <p className="text-white font-medium truncate">{achievement.exerciseName}</p>
                            </div>
                        )}
                    </div>

                    {/* AI Weight Comparison - Specific to this achievement */}
                    {shouldShowComparison && (
                        <div className="mt-6">
                            {isLoading ? (
                                <div className="p-4 bg-slate-800 rounded-xl flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                                        <Sparkles className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <p className="text-slate-400 text-sm">
                                        {value >= 1000 
                                            ? "Generating giant object comparisons..." 
                                            : "Finding things that weigh the same..."}
                                    </p>
                                </div>
                            ) : modalComparison ? (
                                <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-emerald-400 text-xs font-bold flex items-center gap-2">
                                            <Sparkles className="w-3 h-3" /> 
                                            {value >= 1000 ? 'GIANT OBJECT COMPARISON' : 'REAL-WORLD COMPARISON'}
                                        </p>
                                        <button
                                            onClick={() => generateComparison(true)}
                                            className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 transition-colors"
                                            title="Regenerate"
                                            type="button"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {modalComparison.comparisons.map((comp, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <span className="text-2xl">{comp.icon}</span>
                                                <div className="flex-1">
                                                    <p className="text-white font-medium">
                                                        {comp.count} {comp.object}
                                                    </p>
                                                    <p className="text-slate-500 text-xs">
                                                        {comp.singleWeightKg >= 1000 
                                                            ? `${(comp.singleWeightKg / 1000).toFixed(1)}t` 
                                                            : `${comp.singleWeightKg}kg`}
                                                        {comp.description && ` · ${comp.description}`}
                                                    </p>
                                                    {comp.funFact && (
                                                        <p className="text-emerald-400/70 text-xs mt-1">
                                                            💡 {comp.funFact}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {modalComparison.motivationalQuote && (
                                        <p className="mt-4 pt-3 border-t border-emerald-500/20 text-emerald-400/80 text-sm italic">
                                            "{modalComparison.motivationalQuote}"
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-800 rounded-xl">
                                    <button
                                        onClick={() => generateComparison(true)}
                                        className="w-full py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                                    >
                                        Generate Weight Comparison
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Motivation message based on rarity */}
                    <div className="mt-6 p-4 bg-slate-800 rounded-xl">
                        <p className="text-slate-300 text-sm">
                            {achievement.rarity === 'legendary' && "🔥 INCREDIBLE! You're lifting legendary weight!"}
                            {achievement.rarity === 'epic' && "💪 Amazing strength! Keep pushing for legendary!"}
                            {achievement.rarity === 'rare' && "🎯 Solid work! You're getting stronger every day!"}
                            {achievement.rarity === 'common' && "👍 Good job! Consistency is key!"}
                        </p>
                    </div>
                    
                </div>

                {/* Fixed Bottom Close Button - Always Visible */}
                <div 
                    className="sticky bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800"
                    style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
                >
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AchievementDetailModal;
