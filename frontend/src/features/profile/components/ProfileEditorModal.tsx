import React from 'react';
import { X, User, Save, ArrowRight } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import type { UserProfile } from '@/shared/types';
import { ExperienceLevel, TrainingGoal } from '@/shared/types';
import { healthKitService } from '@/services/HealthKitService';
import apiClient from '@/services/apiClient';

interface ProfileEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentProfile: UserProfile;
    onSave: (profile: UserProfile) => void;
}

const ProfileEditorModal: React.FC<ProfileEditorModalProps> = ({
    isOpen,
    onClose,
    currentProfile,
    onSave
}) => {
    const [profile, setProfile] = React.useState<UserProfile>(currentProfile);
    const [importingHealth, setImportingHealth] = React.useState(false);

    if (!isOpen) return null;

    const updateProfile = (updates: Partial<UserProfile>) => {
        setProfile(prev => ({ ...prev, ...updates }));
    };

    const handleSave = () => {
        onSave(profile);
        onClose();
    };

    const handleImportFromHealth = async () => {
        if (!Capacitor.isNativePlatform()) {
            alert('Apple Health 导入仅在 iOS App 中可用');
            return;
        }

        try {
            setImportingHealth(true);

            const available = await healthKitService.initialize();
            if (!available) {
                alert('HealthKit 当前不可用');
                return;
            }

            const granted = await healthKitService.requestAuthorization();
            if (!granted) {
                alert('需要授权访问 Apple Health 才能导入数据');
                return;
            }

            try {
                await apiClient.enableHealthSync();
            } catch (enableErr) {
                console.warn('[ProfileEditor] 启用后端健康同步失败:', enableErr);
            }

            const result = await healthKitService.syncAllHealthData();
            if (!result.success || !result.data) {
                alert(result.error || '从 Apple Health 读取数据失败');
                return;
            }

            const { body } = result.data;
            const updates: Partial<UserProfile> = {};
            if (body.weight !== undefined) updates.weight = Math.round(body.weight * 10) / 10;
            if (body.bodyFatPercent !== undefined) updates.bodyFatPercentage = Math.round(body.bodyFatPercent * 10) / 10;
            if (Object.keys(updates).length > 0) {
                updateProfile(updates);
            }
        } catch (err) {
            console.error('[ProfileEditor] 从 Apple Health 导入失败:', err);
            alert(err instanceof Error ? err.message : '从 Apple Health 导入失败');
        } finally {
            setImportingHealth(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-500/20 p-2 rounded-lg">
                            <User className="text-indigo-400" size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-white">Edit Profile</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                    {Capacitor.isNativePlatform() && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-bold text-emerald-300">从 Apple Health 导入</p>
                                    <p className="text-xs text-emerald-300/70">一键导入体重、体脂等基础数据</p>
                                </div>
                                <button
                                    onClick={handleImportFromHealth}
                                    disabled={importingHealth}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
                                >
                                    {importingHealth ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    )}
                                    {importingHealth ? '导入中...' : '导入'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="text-sm text-slate-400 font-medium block mb-2">Name</label>
                        <input
                            type="text"
                            value={profile.name || ''}
                            onChange={(e) => updateProfile({ name: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Age */}
                    <div>
                        <label className="text-sm text-slate-400 font-medium block mb-2">Age</label>
                        <input
                            type="number"
                            value={profile.age || ''}
                            onChange={(e) => updateProfile({ age: parseInt(e.target.value) })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
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

                    {/* Experience Level */}
                    <div>
                        <label className="text-sm text-slate-400 font-medium block mb-3">Experience Level</label>
                        <div className="space-y-2">
                            {[
                                { level: ExperienceLevel.BEGINNER, desc: 'New to strength training (0-1 years)' },
                                { level: ExperienceLevel.INTERMEDIATE, desc: 'Consistent training (1-3 years)' },
                                { level: ExperienceLevel.ADVANCED, desc: 'Experienced lifter (3+ years)' }
                            ].map(({ level, desc }) => (
                                <button
                                    key={level}
                                    onClick={() => updateProfile({ experienceLevel: level })}
                                    className={`w-full text-left p-3 rounded-xl border transition-all ${profile.experienceLevel === level
                                        ? 'bg-emerald-500/10 border-emerald-500'
                                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="font-bold text-white text-sm">{level}</div>
                                    <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Primary Goal */}
                    <div>
                        <label className="text-sm text-slate-400 font-medium block mb-3">Training Goal</label>
                        <div className="space-y-2">
                            {[
                                { goal: TrainingGoal.HYPERTROPHY, desc: 'Build muscle mass and size', icon: '💪' },
                                { goal: TrainingGoal.STRENGTH, desc: 'Increase maximum strength', icon: '🏋️' },
                                { goal: TrainingGoal.ENDURANCE, desc: 'Improve muscular endurance', icon: '🏃' },
                                { goal: TrainingGoal.GENERAL_FITNESS, desc: 'Overall health and fitness', icon: '🎯' }
                            ].map(({ goal, desc, icon }) => (
                                <button
                                    key={goal}
                                    onClick={() => updateProfile({ primaryGoal: goal })}
                                    className={`w-full text-left p-3 rounded-xl border transition-all ${profile.primaryGoal === goal
                                        ? 'bg-amber-500/10 border-amber-500'
                                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{icon}</span>
                                        <div>
                                            <div className="font-bold text-white text-sm">{goal}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Optional Fields */}
                    <div className="pt-4 border-t border-slate-800 space-y-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Optional Information</p>

                        {/* Body Fat % */}
                        <div>
                            <label className="text-sm text-slate-400 font-medium block mb-2">Body Fat %</label>
                            <input
                                type="number"
                                placeholder="e.g., 15"
                                min="5"
                                max="50"
                                value={profile.bodyFatPercentage || ''}
                                onChange={(e) => updateProfile({ bodyFatPercentage: parseFloat(e.target.value) || undefined })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                            />
                        </div>

                        {/* Weekly Training Days */}
                        <div>
                            <label className="text-sm text-slate-400 font-medium block mb-2">Weekly Training Days</label>
                            <input
                                type="number"
                                placeholder="e.g., 4"
                                min="1"
                                max="7"
                                value={profile.weeklyTrainingDays || ''}
                                onChange={(e) => updateProfile({ weeklyTrainingDays: parseInt(e.target.value) || undefined })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900">
                    <button
                        onClick={handleSave}
                        className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                    >
                        <Save size={20} />
                        Save Changes
                    </button>
                </div>
            </div>

        </div>
    );
};

export default ProfileEditorModal;
