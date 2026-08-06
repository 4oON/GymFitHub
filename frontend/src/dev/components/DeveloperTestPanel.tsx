import React, { useState } from 'react';
import { Settings, TestTube, Clock, Zap, X } from 'lucide-react';
import type { WorkoutSession, UserProfile } from '@/shared/types';

interface DeveloperTestPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onTestWorkout: (testDuration: number) => void;
    userProfile: UserProfile;
}

const DeveloperTestPanel: React.FC<DeveloperTestPanelProps> = ({
    isOpen,
    onClose,
    onTestWorkout,
    userProfile
}) => {
    const [testDuration, setTestDuration] = useState(30);
    const [testWeight, setTestWeight] = useState(userProfile.weight || 70);

    if (!isOpen) return null;

    // Calculate estimated calories for preview
    const estimateCalories = (duration: number, weight: number) => {
        const met = 6.0; // Average MET for strength training
        const hours = duration / 60;
        return Math.round(met * weight * hours);
    };

    const presetDurations = [
        { label: '15分钟 (轻度)', value: 15, met: 3.0 },
        { label: '30分钟 (中度)', value: 30, met: 6.0 },
        { label: '45分钟 (标准)', value: 45, met: 8.0 },
        { label: '60分钟 (高强度)', value: 60, met: 10.0 },
        { label: '90分钟 (专业)', value: 90, met: 12.0 }
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-500/10 p-2.5 rounded-xl border border-orange-500/20">
                            <TestTube className="text-orange-500" size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-white">开发者测试模式</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Current Settings */}
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                            <Settings size={16} />
                            当前设置
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-slate-400">体重:</span>
                                <span className="text-white ml-2 font-bold">{testWeight}kg</span>
                            </div>
                            <div>
                                <span className="text-slate-400">预估卡路里:</span>
                                <span className="text-emerald-400 ml-2 font-bold">
                                    {estimateCalories(testDuration, testWeight)} kcal
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Duration Slider */}
                    <div>
                        <label className="block text-white font-bold mb-3 flex items-center gap-2">
                            <Clock size={16} />
                            测试训练时长: {testDuration} 分钟
                        </label>
                        <input
                            type="range"
                            min="5"
                            max="120"
                            step="5"
                            value={testDuration}
                            onChange={(e) => setTestDuration(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>5min</span>
                            <span>60min</span>
                            <span>120min</span>
                        </div>
                    </div>

                    {/* Preset Buttons */}
                    <div>
                        <label className="block text-white font-bold mb-3">快速预设</label>
                        <div className="grid grid-cols-1 gap-2">
                            {presetDurations.map((preset) => (
                                <button
                                    key={preset.value}
                                    onClick={() => setTestDuration(preset.value)}
                                    className={`p-3 rounded-xl border transition-all text-left ${testDuration === preset.value
                                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold">{preset.label}</span>
                                        <div className="text-right">
                                            <div className="text-xs text-slate-400">MET {preset.met}</div>
                                            <div className="text-sm font-bold">
                                                ~{Math.round(preset.met * testWeight * (preset.value / 60))} kcal
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Weight Adjustment */}
                    <div>
                        <label className="block text-white font-bold mb-3">
                            测试体重: {testWeight}kg
                        </label>
                        <input
                            type="range"
                            min="40"
                            max="150"
                            step="1"
                            value={testWeight}
                            onChange={(e) => setTestWeight(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                    </div>

                    {/* Test Button */}
                    <button
                        onClick={() => {
                            onTestWorkout(testDuration);
                            onClose();
                        }}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-900/50 flex items-center justify-center gap-2"
                    >
                        <Zap size={20} />
                        开始测试 ({testDuration}分钟, ~{estimateCalories(testDuration, testWeight)}kcal)
                    </button>

                    <div className="text-xs text-slate-500 text-center">
                        ⚠️ 这是开发者测试模式，会覆盖实际训练时长
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeveloperTestPanel;