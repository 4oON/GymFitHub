import React from 'react';
import { X, Edit2, User, Calendar, Target, TrendingUp, Dumbbell, Activity, Users, Heart } from 'lucide-react';
import type { UserProfile } from '@/shared/types';

interface ProfileViewProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
    onEdit: () => void;
    onHealthSettings?: () => void;
    healthTimestamps?: Record<string, string | undefined>;
    staleMetrics?: string[];
}

const formatSampleTime = (isoString?: string): string | null => {
    if (!isoString) return null;
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const ProfileView: React.FC<ProfileViewProps> = ({ isOpen, onClose, profile, onEdit, onHealthSettings, healthTimestamps, staleMetrics }) => {
    if (!isOpen) return null;

    // Helper to check if a value exists
    const hasValue = (val: any) => val !== undefined && val !== null && val !== '';
    const isStale = (metric: string) => staleMetrics?.includes(metric) ?? false;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-indigo-900/20 to-purple-900/20">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/20 p-2 rounded-xl">
                            <User className="text-indigo-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{profile.name || 'Profile'}</h2>
                            <p className="text-slate-400 text-xs">Your fitness profile</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onHealthSettings && (
                            <button
                                onClick={onHealthSettings}
                                className="px-3 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 transition-all active:scale-95 flex items-center gap-2 text-sm hover:scale-105"
                                title="健康数据设置"
                            >
                                <Heart size={14} />
                                健康
                            </button>
                        )}
                        <button
                            onClick={onEdit}
                            className="px-3 py-2 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-400 transition-all active:scale-95 flex items-center gap-2 text-sm hover:scale-105"
                        >
                            <Edit2 size={14} />
                            Edit
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors hover:scale-110 active:scale-95">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Bento Grid Content - 4 columns for varied layout */}
                <div className="p-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-4 gap-3 auto-rows-auto">

                        {/* Weight Card - Prominent, 2x2 */}
                        <div
                            className="col-span-2 row-span-2 bg-gradient-to-br from-emerald-900/30 to-slate-900 p-4 rounded-2xl border border-emerald-700/50 hover:border-emerald-500 transition-all flex flex-col justify-between animate-slide-up hover:scale-105 hover:shadow-2xl hover:shadow-emerald-900/20 active:scale-100 cursor-pointer"
                            style={{ animationDelay: '0ms' }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Dumbbell className="text-emerald-400" size={16} />
                                <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wide">Weight</span>
                                {isStale('体重') && (
                                    <span className="text-[9px] text-rose-400 font-medium ml-auto">48h 未更新</span>
                                )}
                            </div>
                            <div>
                                <div className="flex items-end gap-2">
                                    <div className="text-4xl font-black text-white">{profile.weight}</div>
                                    <div className="text-xl font-bold text-emerald-400 mb-1">{profile.unit}</div>
                                </div>
                                {formatSampleTime(healthTimestamps?.weight) && (
                                    <div className="text-[10px] text-slate-500 mt-1">
                                        更新于 {formatSampleTime(healthTimestamps?.weight)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Age Card - Small, 1x1 */}
                        {hasValue(profile.age) && (
                            <div
                                className="col-span-1 bg-gradient-to-br from-indigo-900/30 to-slate-900 p-3 rounded-xl border border-indigo-700/50 hover:border-indigo-500 transition-all animate-slide-up hover:scale-110 hover:shadow-xl hover:shadow-indigo-900/20 active:scale-105 cursor-pointer"
                                style={{ animationDelay: '50ms' }}
                            >
                                <div className="flex items-center gap-1 mb-1">
                                    <Calendar className="text-indigo-400" size={12} />
                                    <span className="text-slate-400 text-[9px] font-medium uppercase tracking-wide">Age</span>
                                </div>
                                <div className="text-2xl font-black text-white">{profile.age}</div>
                            </div>
                        )}

                        {/* Gender Card - Small, 1x1 */}
                        {hasValue(profile.gender) && (
                            <div
                                className="col-span-1 bg-gradient-to-br from-purple-900/30 to-slate-900 p-3 rounded-xl border border-purple-700/50 hover:border-purple-500 transition-all animate-slide-up hover:scale-110 hover:shadow-xl hover:shadow-purple-900/20 active:scale-105 cursor-pointer"
                                style={{ animationDelay: '100ms' }}
                            >
                                <div className="flex items-center gap-1 mb-1">
                                    <Users className="text-purple-400" size={12} />
                                    <span className="text-slate-400 text-[9px] font-medium uppercase tracking-wide">Gender</span>
                                </div>
                                <div className="text-xl font-black text-white">{profile.gender}</div>
                            </div>
                        )}

                        {/* Body Fat % Card - Medium horizontal, 2x1 */}
                        {hasValue(profile.bodyFatPercentage) && (
                            <div
                                className="col-span-2 bg-gradient-to-br from-amber-900/30 to-slate-900 p-3 rounded-xl border border-amber-700/50 hover:border-amber-500 transition-all animate-slide-up hover:scale-105 hover:shadow-xl hover:shadow-amber-900/20 active:scale-100 cursor-pointer"
                                style={{ animationDelay: '150ms' }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="text-amber-400" size={14} />
                                    <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wide">Body Fat</span>
                                    {isStale('体脂') && (
                                        <span className="text-[9px] text-rose-400 font-medium ml-auto">48h 未更新</span>
                                    )}
                                </div>
                                <div className="flex items-end gap-1">
                                    <div className="text-3xl font-black text-white">{profile.bodyFatPercentage}</div>
                                    <div className="text-lg font-bold text-amber-400 mb-1">%</div>
                                </div>
                                {formatSampleTime(healthTimestamps?.fat_percentage) && (
                                    <div className="text-[10px] text-slate-500 mt-1">
                                        更新于 {formatSampleTime(healthTimestamps?.fat_percentage)}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Weekly Training - Small vertical, 1x1 */}
                        {hasValue(profile.weeklyTrainingDays) && (
                            <div
                                className="col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 p-3 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-all animate-slide-up hover:scale-110 hover:shadow-xl hover:shadow-emerald-900/10 active:scale-105 cursor-pointer"
                                style={{ animationDelay: '200ms' }}
                            >
                                <div className="flex items-center gap-1 mb-1">
                                    <Calendar className="text-emerald-400" size={12} />
                                    <span className="text-slate-400 text-[9px] font-medium uppercase tracking-wide">Weekly</span>
                                </div>
                                <div className="text-2xl font-black text-white">{profile.weeklyTrainingDays}</div>
                                <div className="text-[9px] text-slate-500">days</div>
                            </div>
                        )}

                        {/* Experience Level - Wide, 3x1 or 4x1 */}
                        {hasValue(profile.experienceLevel) && (
                            <div
                                className={`${hasValue(profile.weeklyTrainingDays) ? 'col-span-3' : 'col-span-4'} bg-gradient-to-br from-blue-900/30 to-slate-900 p-3 rounded-xl border border-blue-700/50 hover:border-blue-500 transition-all animate-slide-up hover:scale-105 hover:shadow-xl hover:shadow-blue-900/20 active:scale-100 cursor-pointer`}
                                style={{ animationDelay: '250ms' }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="text-blue-400" size={14} />
                                    <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wide">Experience Level</span>
                                </div>
                                <div className="text-xl font-black text-white">{profile.experienceLevel}</div>
                            </div>
                        )}

                        {/* Training Goal - Full width, 4x1 */}
                        {hasValue(profile.primaryGoal) && (
                            <div
                                className="col-span-4 bg-gradient-to-br from-rose-900/30 to-slate-900 p-4 rounded-xl border border-rose-700/50 hover:border-rose-500 transition-all animate-slide-up hover:scale-105 hover:shadow-xl hover:shadow-rose-900/20 active:scale-100 cursor-pointer"
                                style={{ animationDelay: '300ms' }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="text-rose-400" size={16} />
                                    <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wide">Primary Goal</span>
                                </div>
                                <div className="text-2xl font-black text-white">{profile.primaryGoal}</div>
                                <div className="text-xs text-slate-500 mt-1">Your main training focus</div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
