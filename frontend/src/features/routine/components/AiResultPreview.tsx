import React, { useState } from 'react';
import { X, CheckCircle2, PlusCircle, Loader2, RefreshCw } from 'lucide-react';
import type { Exercise, AiRecommendation, UserProfile } from '@/shared/types';
import AiRecommendationCard from '@/features/ai/components/AiRecommendationCard';
import { getAiExerciseAlternative } from '@/features/ai/services/perplexityService';

interface AiResultPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    recommendations: { exercise: Exercise, recommendation: AiRecommendation }[];
    onConfirm: (selectedExercises: Exercise[]) => void;
    onUpdateRecommendation: (index: number, newRec: { exercise: Exercise, recommendation: AiRecommendation }) => void;
    onRemoveRecommendation: (index: number) => void;
    onAddMore: () => void;
    userProfile: UserProfile;
    availableExercises: Exercise[];
}

const EQUIPMENT_OPTIONS = [
    { id: 'dumbbell', name: 'Dumbbells' },
    { id: 'barbell', name: 'Barbell' },
    { id: 'machine', name: 'Machines' },
    { id: 'cable', name: 'Cables' },
    { id: 'bodyweight', name: 'Bodyweight' },
];

const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

const AiResultPreview: React.FC<AiResultPreviewProps> = ({
    isOpen,
    onClose,
    recommendations,
    onConfirm,
    onUpdateRecommendation,
    onRemoveRecommendation,
    onAddMore,
    userProfile,
    availableExercises
}) => {
    // Swap State
    const [swapModalOpen, setSwapModalOpen] = useState(false);
    const [swapTarget, setSwapTarget] = useState<{ id: string, name: string, muscle: string } | null>(null);
    const [swapEquipment, setSwapEquipment] = useState<string[]>([]);
    const [swapDifficulty, setSwapDifficulty] = useState<string>('');
    const [isSwapping, setIsSwapping] = useState(false);
    
    // Error State (iOS-safe: replace alert)
    const [swapError, setSwapError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleOpenSwap = (id: string, name: string, muscle: string) => {
        setSwapTarget({ id, name, muscle });
        setSwapEquipment([]);
        setSwapDifficulty('');
        setSwapError(null);
        setSwapModalOpen(true);
    };

    const handleSwap = async () => {
        if (!swapTarget) return;

        setIsSwapping(true);
        try {
            const result = await getAiExerciseAlternative(
                swapTarget.name,
                swapTarget.muscle,
                userProfile,
                {
                    equipment: swapEquipment.length > 0 ? swapEquipment : undefined,
                    difficulty: swapDifficulty || undefined
                },
                availableExercises
            );

            if (result) {
                // Find index of old exercise
                const index = recommendations.findIndex(r => r.exercise.id === swapTarget.id);
                if (index !== -1) {
                    onUpdateRecommendation(index, result);
                }
                setSwapModalOpen(false);
            } else {
                // ❌ Removed alert() - iOS WebView blocks this
                setSwapError("Could not find a suitable alternative. Try different criteria.");
            }
        } catch (error) {
            console.error(error);
            // ❌ Removed alert() - iOS WebView blocks this
            setSwapError("Failed to swap exercise. Please try again.");
        } finally {
            setIsSwapping(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] flex flex-col animate-fade-in">

            {/* Header */}
            <div className="w-full max-w-md mx-auto p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 z-10">
                <div>
                    <h2 className="text-xl font-bold text-white">AI Recommendation</h2>
                    <p className="text-slate-400 text-xs">Review your personalized plan</p>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950 w-full max-w-md mx-auto">
                {recommendations.map(({ exercise, recommendation }, index) => (
                    <AiRecommendationCard
                        key={`${exercise.id}-${index}`}
                        exercise={exercise}
                        recommendation={recommendation}
                        index={index}
                        onSwap={handleOpenSwap}
                        onRemove={onRemoveRecommendation}
                    />
                ))}

                {/* Add More Button */}
                <button
                    onClick={onAddMore}
                    className="w-full py-3 border-2 border-dashed border-slate-800 rounded-xl text-slate-400 font-bold hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-2"
                >
                    <PlusCircle size={20} />
                    Add More Muscles / Exercises
                </button>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 z-10 w-full max-w-md mx-auto">
                <button
                    onClick={() => onConfirm(recommendations.map(r => r.exercise))}
                    disabled={recommendations.length === 0}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${recommendations.length === 0
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-900/20'
                        }`}
                >
                    <CheckCircle2 size={20} />
                    Add All to Routine
                </button>
            </div>

            {/* Swap Modal */}
            {swapModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 p-6 shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Swap Exercise</h3>
                            <button onClick={() => { setSwapError(null); setSwapModalOpen(false); }} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-sm text-slate-400 mb-4">
                            Find an alternative for <span className="text-white font-bold">{swapTarget?.name}</span>
                        </p>

                        <div className="space-y-4 mb-6">
                            {/* Equipment Filter */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Equipment (Optional)</label>
                                <div className="flex flex-wrap gap-2">
                                    {EQUIPMENT_OPTIONS.map(eq => (
                                        <button
                                            key={eq.id}
                                            onClick={() => setSwapEquipment(prev => prev.includes(eq.id) ? prev.filter(x => x !== eq.id) : [...prev, eq.id])}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${swapEquipment.includes(eq.id)
                                                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                                }`}
                                        >
                                            {eq.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Difficulty Filter */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Difficulty (Optional)</label>
                                <div className="flex gap-2">
                                    {DIFFICULTY_OPTIONS.map(diff => (
                                        <button
                                            key={diff}
                                            onClick={() => setSwapDifficulty(diff === swapDifficulty ? '' : diff)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${swapDifficulty === diff
                                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                                }`}
                                        >
                                            {diff}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Error Message (iOS-safe) */}
                        {swapError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-400 text-sm text-center">{swapError}</p>
                            </div>
                        )}

                        <button
                            onClick={() => { setSwapError(null); handleSwap(); }}
                            disabled={isSwapping}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isSwapping ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                            Find Alternative
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AiResultPreview;
