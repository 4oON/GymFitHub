import React, { useState, useEffect } from 'react';
import { User, Dumbbell, Target, TrendingUp, ArrowRight, ArrowLeft } from 'lucide-react';
import type { UserProfile } from '@/shared/types';
import { ExperienceLevel, TrainingGoal } from '@/shared/types';

interface ProfileSetupProps {
    onComplete: (profile: UserProfile) => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState<Partial<UserProfile>>({
        weight: 70,
        unit: 'kg'
    });

    const totalSteps = 3;

    // Hide body overflow to prevent double scrollbar
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const updateProfile = (updates: Partial<UserProfile>) => {
        setProfile(prev => ({ ...prev, ...updates }));
    };

    const handleComplete = () => {
        if (profile.name && profile.age && profile.gender && profile.experienceLevel && profile.primaryGoal) {
            onComplete(profile as UserProfile);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                return profile.name && profile.age && profile.gender && profile.weight;
            case 2:
                return profile.experienceLevel;
            case 3:
                return profile.primaryGoal;
            default:
                return false;
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4 py-8">
                <div className="w-full max-w-md">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-block bg-indigo-500/20 p-4 rounded-2xl mb-4">
                            <Dumbbell className="text-indigo-400" size={40} />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2">Welcome to ZenFit</h1>
                        <p className="text-slate-400 text-sm">Let's personalize your training experience</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-8">
                        {[1, 2, 3].map(s => (
                            <div
                                key={s}
                                className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-indigo-500' : 'bg-slate-800'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Content Card */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 mb-6">

                        {/* Step 1: Basic Info */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-indigo-500/20 p-2 rounded-lg">
                                        <User className="text-indigo-400" size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Basic Information</h2>
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="text-sm text-slate-400 font-medium block mb-2">Your Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Alex"
                                        value={profile.name || ''}
                                        onChange={(e) => updateProfile({ name: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                                    />
                                </div>

                                {/* Age */}
                                <div>
                                    <label className="text-sm text-slate-400 font-medium block mb-2">Age</label>
                                    <input
                                        type="number"
                                        placeholder="25"
                                        value={profile.age || ''}
                                        onChange={(e) => updateProfile({ age: parseInt(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                                    />
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className="text-sm text-slate-400 font-medium block mb-3">Gender</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Male', 'Female', 'Other'].map(g => (
                                            <button
                                                key={g}
                                                onClick={() => updateProfile({ gender: g as any })}
                                                className={`py-3 rounded-xl text-sm font-bold border transition-all ${profile.gender === g
                                                    ? 'bg-indigo-500 border-indigo-500 text-white'
                                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                                    }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Weight */}
                                <div>
                                    <label className="text-sm text-slate-400 font-medium block mb-2">Body Weight</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="number"
                                            value={profile.weight || ''}
                                            onChange={(e) => updateProfile({ weight: parseFloat(e.target.value) })}
                                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
                                        />
                                        <button
                                            onClick={() => updateProfile({ unit: profile.unit === 'kg' ? 'lbs' : 'kg' })}
                                            className="px-6 py-3 bg-slate-800 border border-slate-700 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors"
                                        >
                                            {profile.unit}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Experience */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-emerald-500/20 p-2 rounded-lg">
                                        <TrendingUp className="text-emerald-400" size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Training Experience</h2>
                                </div>

                                <p className="text-slate-400 text-sm mb-4">This helps us recommend the right training intensity</p>

                                <div className="space-y-3">
                                    {[
                                        { level: ExperienceLevel.BEGINNER, desc: 'New to strength training (0-1 years)' },
                                        { level: ExperienceLevel.INTERMEDIATE, desc: 'Consistent training (1-3 years)' },
                                        { level: ExperienceLevel.ADVANCED, desc: 'Experienced lifter (3+ years)' }
                                    ].map(({ level, desc }) => (
                                        <button
                                            key={level}
                                            onClick={() => updateProfile({ experienceLevel: level })}
                                            className={`w-full text-left p-4 rounded-xl border transition-all ${profile.experienceLevel === level
                                                ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-900/20'
                                                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="font-bold text-white mb-1">{level}</div>
                                            <div className="text-xs text-slate-400">{desc}</div>
                                        </button>
                                    ))}
                                </div>

                                {/* Optional: Weekly Training */}
                                <div className="pt-4 border-t border-slate-800">
                                    <label className="text-sm text-slate-400 font-medium block mb-2">Weekly Training Days (Optional)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g., 4"
                                        min="1"
                                        max="7"
                                        value={profile.weeklyTrainingDays || ''}
                                        onChange={(e) => updateProfile({ weeklyTrainingDays: parseInt(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Goals */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-amber-500/20 p-2 rounded-lg">
                                        <Target className="text-amber-400" size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Training Goal</h2>
                                </div>

                                <p className="text-slate-400 text-sm mb-4">What's your primary fitness goal?</p>

                                <div className="space-y-3">
                                    {[
                                        { goal: TrainingGoal.HYPERTROPHY, desc: 'Build muscle mass and size', icon: '💪' },
                                        { goal: TrainingGoal.STRENGTH, desc: 'Increase maximum strength', icon: '🏋️' },
                                        { goal: TrainingGoal.ENDURANCE, desc: 'Improve muscular endurance', icon: '🏃' },
                                        { goal: TrainingGoal.GENERAL_FITNESS, desc: 'Overall health and fitness', icon: '🎯' }
                                    ].map(({ goal, desc, icon }) => (
                                        <button
                                            key={goal}
                                            onClick={() => updateProfile({ primaryGoal: goal })}
                                            className={`w-full text-left p-4 rounded-xl border transition-all ${profile.primaryGoal === goal
                                                ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-900/20'
                                                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{icon}</span>
                                                <div>
                                                    <div className="font-bold text-white mb-1">{goal}</div>
                                                    <div className="text-xs text-slate-400">{desc}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Optional: Body Fat % */}
                                <div className="pt-4 border-t border-slate-800">
                                    <label className="text-sm text-slate-400 font-medium block mb-2">Body Fat % (Optional)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g., 15"
                                        min="5"
                                        max="50"
                                        value={profile.bodyFatPercentage || ''}
                                        onChange={(e) => updateProfile({ bodyFatPercentage: parseFloat(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-3">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={20} />
                                Back
                            </button>
                        )}

                        {step < totalSteps ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                disabled={!canProceed()}
                                className={`flex-1 py-4 font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${canProceed()
                                    ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                Next
                                <ArrowRight size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={handleComplete}
                                disabled={!canProceed()}
                                className={`flex-1 py-4 font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${canProceed()
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-900/20'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                Complete Setup
                                <ArrowRight size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSetup;
