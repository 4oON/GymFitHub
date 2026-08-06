import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Battery, Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import { AppScreen } from '@/shared/types';
import type { Exercise, RecoveryStatus, AiRecommendation, UserProfile, Routine } from '@/shared/types';
import { getAiWorkoutRecommendation } from '@/features/ai/services/perplexityService';
import AiConfigModal from './AiConfigModal';
import AiResultPreview from '@/features/ai/components/AiResultPreview';

interface RoutineCreatorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, exercises: Exercise[]) => void;
    exercises: Exercise[];
    onUpdateExercises: (exercises: Exercise[]) => void;
    onManualAdd: () => void;
    recoveryState: RecoveryStatus[];
    exerciseLibrary: Exercise[];
    onViewHistory: () => void;
    userProfile: UserProfile;
    editingRoutine?: Routine | null;
}

const RoutineCreator: React.FC<RoutineCreatorProps> = ({
    isOpen,
    onClose,
    onSave,
    exercises,
    onUpdateExercises,
    onManualAdd,
    recoveryState,
    exerciseLibrary,
    onViewHistory,
    userProfile,
    editingRoutine
}) => {
    const [routineName, setRoutineName] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    // Flow State
    const [showAiConfig, setShowAiConfig] = useState(false);
    const [showAiResults, setShowAiResults] = useState(false);
    const [aiRecommendations, setAiRecommendations] = useState<{ exercise: Exercise, recommendation: AiRecommendation }[]>([]);
    const [isAppending, setIsAppending] = useState(false);

    // Pre-populate form when editing
    useEffect(() => {
        if (editingRoutine) {
            setRoutineName(editingRoutine.name);
            onUpdateExercises(editingRoutine.exercises);
        } else if (!isOpen) {
            // Only clear when modal is closing, not when opening for new routine
            setRoutineName('');
            onUpdateExercises([]);
        }
    }, [editingRoutine, isOpen]);

    if (!isOpen) return null;

    const handleAiClick = () => {
        setIsAppending(false);
        setShowAiConfig(true);
    };

    const handleAddMore = () => {
        setIsAppending(true);
        setShowAiConfig(true);
        setShowAiResults(false);
    };

    const handleGenerate = async (targetMuscles: string[], userWeight: number, equipment: string[], count: number) => {
        setShowAiConfig(false);
        setIsAiLoading(true);
        setAiError(null);

        // 添加 60 秒超时（AI 生成可能需要较长时间）
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout after 60 seconds')), 60000);
        });

        try {
            console.log('Generating AI workout with:', { targetMuscles, userWeight, equipment, count });
            
            // 使用 Promise.race 实现超时
            const results = await Promise.race([
                getAiWorkoutRecommendation(
                    recoveryState,
                    exerciseLibrary,
                    targetMuscles,
                    userWeight,
                    equipment,
                    count
                ),
                timeoutPromise
            ]) as any;

            if (results.length > 0) {
                if (isAppending) {
                    setAiRecommendations(prev => [...prev, ...results]);
                } else {
                    setAiRecommendations(results);
                }
                setShowAiResults(true);
            } else {
                setAiError("AI couldn't find a suitable routine. Please try again.");
            }
        } catch (err: any) {
            console.error('AI generation error:', err);
            
            // 直接显示错误，不使用本地 fallback
            if (err.message?.includes('timeout')) {
                setAiError('AI service timeout (60s). The AI is taking too long. Try a faster model like gpt-4o-mini or claude-3-haiku.');
            } else if (err.message?.includes('No AI configuration found')) {
                setAiError('Please configure an AI provider in Profile > AI Configuration first.');
            } else if (err.response?.data?.error) {
                setAiError(err.response.data.error);
            } else {
                setAiError(err.message || 'Failed to generate routine. Please try again.');
            }
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleConfirmAi = (selectedExercises: Exercise[]) => {
        onUpdateExercises([...exercises, ...selectedExercises]);
        setShowAiResults(false);
    };

    const handleRemoveExercise = (exerciseId: string) => {
        onUpdateExercises(exercises.filter(e => e.id !== exerciseId));
    };

    const handleUpdateRecommendation = (index: number, newRec: { exercise: Exercise, recommendation: AiRecommendation }) => {
        setAiRecommendations(prev => {
            const updated = [...prev];
            updated[index] = newRec;
            return updated;
        });
    };

    const handleRemoveRecommendation = (index: number) => {
        setAiRecommendations(prev => prev.filter((_, i) => i !== index));
    };

    // Debug click handler
    const handleAddExerciseClick = () => {
        console.log('Add Exercise button clicked');
        console.log('onManualAdd:', onManualAdd);
        onManualAdd();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[50] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 overflow-hidden flex flex-col h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md z-10">
                    <h2 className="text-xl font-bold text-white">{editingRoutine ? 'Edit Routine' : 'Create Routine'}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">

                    {/* AI Coach Button */}
                    <div className="mb-6">
                        <button
                            onClick={handleAiClick}
                            disabled={isAiLoading}
                            className="w-full relative overflow-hidden group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white p-4 rounded-2xl shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98]"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative flex items-center justify-center gap-3">
                                {isAiLoading ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <BrainCircuit className="text-indigo-200" size={24} />
                                )}
                                <div className="text-left">
                                    <div className="font-bold text-lg leading-tight">Ask AI Coach</div>
                                    <div className="text-xs text-indigo-200 font-medium">Generate a personalized workout based on recovery</div>
                                </div>
                            </div>
                        </button>
                        {aiError && (
                            <div className="mt-2 text-rose-400 text-xs text-center bg-rose-900/20 p-2 rounded-lg border border-rose-900/50">
                                {aiError}
                            </div>
                        )}
                    </div>

                    <div className="mb-6">
                        <label className="text-sm text-slate-400 block mb-2 font-medium">Routine Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Chest & Triceps"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600"
                            value={routineName}
                            onChange={(e) => setRoutineName(e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm text-slate-400 font-medium">Exercises ({exercises.length})</label>
                            <button
                                onClick={handleAddExerciseClick}
                                className="text-emerald-400 text-xs font-bold flex items-center gap-1 hover:text-emerald-300 transition-colors px-2 py-1 rounded hover:bg-emerald-500/10"
                            >
                                <Plus size={14} /> Add Manual
                            </button>
                        </div>

                        <div className="space-y-2 min-h-[100px]">
                            {exercises.length === 0 ? (
                                <div
                                    onClick={handleAddExerciseClick}
                                    className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group active:scale-[0.98]"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            handleAddExerciseClick();
                                        }
                                    }}
                                >
                                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
                                        <Plus size={24} className="text-slate-500 group-hover:text-emerald-400" />
                                    </div>
                                    <span className="text-slate-500 text-sm font-medium group-hover:text-emerald-400">Add Exercise</span>
                                    <span className="text-slate-600 text-xs mt-1">Click to browse exercises</span>
                                </div>
                            ) : (
                                exercises.map((ex, i) => (
                                    <div key={`${ex.id}-${i}`} className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex justify-between items-center group hover:border-slate-600 transition-colors">
                                        <div>
                                            <span className="text-white font-medium block">{ex.name}</span>
                                            <span className="text-xs text-slate-500">{ex.muscleGroup} ◆ {ex.mechanic}</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveExercise(ex.id)}
                                            className="text-slate-500 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {/* Add More Button (when exercises exist) */}
                        {exercises.length > 0 && (
                            <button
                                onClick={handleAddExerciseClick}
                                className="w-full mt-2 p-3 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all active:scale-[0.98]"
                            >
                                <Plus size={18} />
                                <span className="text-sm font-medium">Add Another Exercise</span>
                            </button>
                        )}
                    </div>

                    {/* Recovery Status - Compact Grid View */}
                    <section className="mb-4 pt-3 border-t border-slate-800/50">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                                <Battery size={14} className="text-emerald-500" />
                                Recovery Status
                            </h3>
                            <button onClick={onViewHistory} className="text-[10px] text-slate-500 hover:text-emerald-400 transition-colors">
                                View All
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {recoveryState.slice(0, 6).map((muscle) => {
                                const recoveryPercent = Math.min(100, Math.round(((Date.now() - muscle.lastWorked) / ((muscle.recoveryDurationHours || 72) * 3600000)) * 100));
                                const isRecovered = recoveryPercent >= 100;

                                return (
                                    <div
                                        key={muscle.muscle}
                                        className={`p-2 rounded-lg border transition-all ${
                                            isRecovered
                                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                                : 'bg-slate-800/30 border-slate-700/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <div className={`w-2 h-2 rounded-full ${isRecovered ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            <span className={`text-[11px] font-medium capitalize truncate ${isRecovered ? 'text-slate-300' : 'text-slate-400'}`}>
                                                {muscle.muscle}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-base font-bold ${isRecovered ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {recoveryPercent}%
                                            </span>
                                        </div>
                                        <div className={`h-1 w-full rounded-full mt-1 ${isRecovered ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                                            <div
                                                className={`h-full rounded-full transition-all ${isRecovered ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                style={{ width: `${Math.min(100, recoveryPercent)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900">
                    <button
                        onClick={() => onSave(routineName, exercises)}
                        disabled={!routineName.trim() || exercises.length === 0}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${!routineName.trim() || exercises.length === 0
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-900/20'
                            }`}
                    >
                        <Save size={20} />
                        Save Routine
                    </button>
                </div>

                {/* AI Modals */}
                <AiConfigModal
                    isOpen={showAiConfig}
                    onClose={() => setShowAiConfig(false)}
                    onGenerate={handleGenerate}
                    userProfile={userProfile}
                />

                <AiResultPreview
                    isOpen={showAiResults}
                    onClose={() => setShowAiResults(false)}
                    recommendations={aiRecommendations}
                    onConfirm={handleConfirmAi}
                    onUpdateRecommendation={handleUpdateRecommendation}
                    onRemoveRecommendation={handleRemoveRecommendation}
                    onAddMore={handleAddMore}
                    userProfile={userProfile}
                    availableExercises={exerciseLibrary}
                />
            </div>
        </div>
    );
};

export default RoutineCreator;
