import React, { useState } from 'react';
import { X, BrainCircuit, Dumbbell, User, Target, TrendingUp, ChevronRight, Check } from 'lucide-react';
import { MuscleGroup } from '@/shared/types';
import type { UserProfile } from '@/shared/types';
import MuscleAnatomyViewer from '@/features/anatomy/components/MuscleAnatomyViewer';

interface AiConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (targetMuscles: string[], userWeight: number, equipment: string[], count: number) => void;
    userProfile: UserProfile;
}

const EQUIPMENT_OPTIONS = [
    { id: 'dumbbell', name: 'Dumbbells', icon: '🏋️' },
    { id: 'barbell', name: 'Barbell', icon: '🥖' },
    { id: 'machine', name: 'Machines', icon: '⚙️' },
    { id: 'cable', name: 'Cables', icon: '⛓️' },
    { id: 'bodyweight', name: 'Bodyweight', icon: '🧘' },
    { id: 'kettlebell', name: 'Kettlebells', icon: '🔔' },
    { id: 'smith_machine', name: 'Smith Machine', icon: '🏗️' },
    { id: 'resistance_band', name: 'Bands', icon: '🎗️' },
];

const AiConfigModal: React.FC<AiConfigModalProps> = ({
    isOpen,
    onClose,
    onGenerate,
    userProfile
}) => {
    const [step, setStep] = useState<'muscle' | 'equipment'>('muscle');
    const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
    const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
    const [bodyFacing, setBodyFacing] = useState<'front' | 'back'>('front');
    const [exerciseCount, setExerciseCount] = useState(4);

    if (!isOpen) return null;

    const toggleMuscle = (muscle: MuscleGroup) => {
        setSelectedMuscles(prev =>
            prev.includes(muscle)
                ? prev.filter(m => m !== muscle)
                : [...prev, muscle]
        );
    };

    const toggleEquipment = (eqId: string) => {
        setSelectedEquipment(prev =>
            prev.includes(eqId)
                ? prev.filter(id => id !== eqId)
                : [...prev, eqId]
        );
    };

    const handleNext = () => {
        setStep('equipment');
    };

    const handleGenerate = () => {
        // Use weight from profile, default to 70 if missing
        onGenerate(selectedMuscles, userProfile.weight || 70, selectedEquipment, exerciseCount);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 w-full max-w-md max-h-[85vh] rounded-3xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl transition-all">

                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md z-10">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-500/20 p-2 rounded-lg">
                            <BrainCircuit className="text-indigo-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">AI Coach Setup</h2>
                            <p className="text-xs text-slate-400">
                                {step === 'muscle' ? 'Step 1: Select Muscles' : 'Step 2: Equipment & Count'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content based on Step */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">

                    {step === 'muscle' ? (
                        <div className="flex flex-col h-full">
                            {/* Profile Summary Section - Fixed at top with higher z-index */}
                            <div className="p-6 pb-0 relative z-20 bg-slate-900">
                                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 mb-6">
                                    <div className="flex items-center gap-3 mb-3 border-b border-slate-700/50 pb-3">
                                        <div className="bg-slate-700 p-2 rounded-full">
                                            <User size={16} className="text-slate-300" />
                                        </div>
                                        <div>
                                            <div className="text-white font-bold">{userProfile.name || 'User'}</div>
                                            <div className="text-xs text-slate-400">Profile Loaded</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                                            <Dumbbell size={14} className="text-emerald-400 mb-1" />
                                            <div className="text-white font-bold text-sm">{userProfile.weight}<span className="text-[10px] text-slate-500 ml-0.5">{userProfile.unit}</span></div>
                                            <div className="text-[9px] text-slate-500 uppercase">Weight</div>
                                        </div>
                                        <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                                            <Target size={14} className="text-rose-400 mb-1" />
                                            <div className="text-white font-bold text-xs truncate w-full px-1">{userProfile.primaryGoal || 'General'}</div>
                                            <div className="text-[9px] text-slate-500 uppercase">Goal</div>
                                        </div>
                                        <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                                            <TrendingUp size={14} className="text-blue-400 mb-1" />
                                            <div className="text-white font-bold text-xs truncate w-full px-1">{userProfile.experienceLevel || 'Beginner'}</div>
                                            <div className="text-[9px] text-slate-500 uppercase">Level</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <label className="text-sm text-slate-400 font-medium block mb-1">Target Muscles</label>
                                    <p className="text-xs text-slate-500">Tap on the body map to select areas.</p>
                                </div>
                            </div>

                            {/* Interactive Muscle Viewer - Positioned below text */}
                            <div className="flex-1 min-h-[400px] bg-slate-950/50">
                                <MuscleAnatomyViewer
                                    onMuscleSelect={toggleMuscle}
                                    bodyFacing={bodyFacing}
                                    onBodyFacingChange={setBodyFacing}
                                    selectedMuscles={selectedMuscles}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 animate-slide-up">

                            {/* Exercise Count Selector */}
                            <div className="mb-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-white font-bold">Number of Exercises</label>
                                    <span className="text-indigo-400 font-bold text-lg">{exerciseCount}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setExerciseCount(Math.max(1, exerciseCount - 1))}
                                        className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="range"
                                        min="1"
                                        max="8"
                                        value={exerciseCount}
                                        onChange={(e) => setExerciseCount(parseInt(e.target.value))}
                                        className="flex-1 accent-indigo-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <button
                                        onClick={() => setExerciseCount(Math.min(8, exerciseCount + 1))}
                                        className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-white font-bold text-lg mb-2">Available Equipment</h3>
                                <p className="text-slate-400 text-sm">Select what you have access to. Leave empty for AI to recommend the best options.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {EQUIPMENT_OPTIONS.map((eq) => {
                                    const isSelected = selectedEquipment.includes(eq.id);
                                    return (
                                        <button
                                            key={eq.id}
                                            onClick={() => toggleEquipment(eq.id)}
                                            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${isSelected
                                                ? 'bg-indigo-600/20 border-indigo-500'
                                                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-2xl">{eq.icon}</span>
                                                {isSelected && (
                                                    <div className="bg-indigo-500 rounded-full p-1">
                                                        <Check size={12} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`font-bold ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                                {eq.name}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {selectedEquipment.length === 0 && (
                                <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3">
                                    <div className="bg-emerald-500/20 p-2 rounded-lg">
                                        <BrainCircuit className="text-emerald-400" size={18} />
                                    </div>
                                    <div>
                                        <div className="text-emerald-400 font-bold text-sm mb-1">AI Recommendation Mode</div>
                                        <div className="text-emerald-200/70 text-xs">
                                            Since no equipment is selected, I'll search for the most effective and popular exercises for your target muscles.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900 z-10">
                    {step === 'muscle' ? (
                        <button
                            onClick={handleNext}
                            disabled={selectedMuscles.length === 0}
                            className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${selectedMuscles.length === 0
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 active:scale-[0.98]'
                                }`}
                        >
                            Next: Equipment
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep('muscle')}
                                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleGenerate}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <BrainCircuit size={20} />
                                Generate Workout
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AiConfigModal;
