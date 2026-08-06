import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Minus,
    Calendar,
    BarChart3,
    Target,
    Zap
} from 'lucide-react';
import { MuscleGroup } from '@/shared/types';
import type { WeeklyReport } from '@/shared/types';
import { reportStorage } from '../services/ReportStorageService';

interface WeeklyReportComparisonProps {
    isOpen: boolean;
    onClose: () => void;
    initialReport?: WeeklyReport;
}

interface ComparisonData {
    current: WeeklyReport;
    previous: WeeklyReport;
    changes: {
        volume: number;
        sets: number;
        reps: number;
        exercises: number;
        duration: number;
        workoutDays: number;
    };
    muscleChanges: Array<{
        muscle: MuscleGroup;
        currentWeight: number;
        previousWeight: number;
        change: number;
        changePercent: number;
    }>;
}

const WeeklyReportComparison: React.FC<WeeklyReportComparisonProps> = ({
    isOpen,
    onClose,
    initialReport
}) => {
    const [reports, setReports] = useState<WeeklyReport[]>([]);
    const [currentReportIndex, setCurrentReportIndex] = useState(0);
    const [previousReportIndex, setPreviousReportIndex] = useState(1);
    const [loading, setLoading] = useState(true);
    const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadReports();
        }
    }, [isOpen]);

    useEffect(() => {
        if (reports.length >= 2) {
            generateComparison();
        }
    }, [reports, currentReportIndex, previousReportIndex]);

    const loadReports = async () => {
        try {
            setLoading(true);
            const allReports = await reportStorage.getAllReports();
            setReports(allReports);

            if (initialReport) {
                const initialIndex = allReports.findIndex(r => r.id === initialReport.id);
                if (initialIndex !== -1) {
                    setCurrentReportIndex(initialIndex);
                    setPreviousReportIndex(Math.min(initialIndex + 1, allReports.length - 1));
                }
            }
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateComparison = () => {
        if (reports.length < 2 || currentReportIndex >= reports.length || previousReportIndex >= reports.length) {
            return;
        }

        const current = reports[currentReportIndex];
        const previous = reports[previousReportIndex];

        const changes = {
            volume: ((current.stats.totalVolume - previous.stats.totalVolume) / previous.stats.totalVolume) * 100,
            sets: ((current.stats.totalSets - previous.stats.totalSets) / previous.stats.totalSets) * 100,
            reps: ((current.stats.totalReps - previous.stats.totalReps) / previous.stats.totalReps) * 100,
            exercises: ((current.stats.totalExercises - previous.stats.totalExercises) / previous.stats.totalExercises) * 100,
            duration: ((current.stats.totalDuration - previous.stats.totalDuration) / previous.stats.totalDuration) * 100,
            workoutDays: ((current.stats.workoutDays - previous.stats.workoutDays) / previous.stats.workoutDays) * 100
        };

        // Calculate muscle group changes
        const muscleChanges: ComparisonData['muscleChanges'] = [];
        const allMuscles = new Set([
            ...current.muscleDistribution.map(m => m.muscle),
            ...previous.muscleDistribution.map(m => m.muscle)
        ]);

        allMuscles.forEach(muscle => {
            const currentMuscle = current.muscleDistribution.find(m => m.muscle === muscle);
            const previousMuscle = previous.muscleDistribution.find(m => m.muscle === muscle);

            const currentWeight = currentMuscle?.totalWeight || 0;
            const previousWeight = previousMuscle?.totalWeight || 0;

            if (previousWeight > 0) {
                const change = currentWeight - previousWeight;
                const changePercent = (change / previousWeight) * 100;

                muscleChanges.push({
                    muscle,
                    currentWeight,
                    previousWeight,
                    change,
                    changePercent
                });
            }
        });

        // Sort by absolute change percentage
        muscleChanges.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

        setComparisonData({
            current,
            previous,
            changes,
            muscleChanges
        });
    };

    const formatChange = (value: number, suffix: string = '%') => {
        if (isNaN(value) || !isFinite(value)) return '0%';

        const formatted = Math.abs(value).toFixed(1);
        if (value > 0) {
            return (
                <span className="flex items-center gap-1 text-emerald-400">
                    <TrendingUp size={16} />
                    +{formatted}{suffix}
                </span>
            );
        } else if (value < 0) {
            return (
                <span className="flex items-center gap-1 text-rose-400">
                    <TrendingDown size={16} />
                    -{formatted}{suffix}
                </span>
            );
        } else {
            return (
                <span className="flex items-center gap-1 text-slate-400">
                    <Minus size={16} />
                    0{suffix}
                </span>
            );
        }
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-white">Loading comparison...</p>
                </div>
            </div>
        );
    }

    if (reports.length < 2) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center max-w-md">
                    <Calendar size={48} className="text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Not Enough Data</h3>
                    <p className="text-slate-400 mb-6">You need at least 2 weekly reports to compare progress.</p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold transition-colors"
                    >
                        Got it
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-6xl h-full max-h-[90vh] rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Weekly Comparison</h2>
                            <p className="text-slate-400">Compare your training progress</p>
                        </div>
                    </div>
                </div>

                {/* Report Selectors */}
                <div className="p-6 border-b border-slate-800 bg-slate-800/50">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">Current Week</label>
                            <select
                                value={currentReportIndex}
                                onChange={(e) => setCurrentReportIndex(parseInt(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                            >
                                {reports.map((report, index) => (
                                    <option key={report.id} value={index}>
                                        Week {report.weekNumber}, {report.year} ({report.dateRange.start} to {report.dateRange.end})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">Compare With</label>
                            <select
                                value={previousReportIndex}
                                onChange={(e) => setPreviousReportIndex(parseInt(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                            >
                                {reports.map((report, index) => (
                                    <option key={report.id} value={index}>
                                        Week {report.weekNumber}, {report.year} ({report.dateRange.start} to {report.dateRange.end})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Comparison Content */}
                {comparisonData && (
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Overall Stats Comparison */}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <BarChart3 size={24} className="text-emerald-400" />
                                Overall Progress
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                                    <div className="text-slate-400 text-sm mb-1">Total Volume</div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-white">
                                                {comparisonData.current.stats.totalVolume}kg
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                vs {comparisonData.previous.stats.totalVolume}kg
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {formatChange(comparisonData.changes.volume)}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                                    <div className="text-slate-400 text-sm mb-1">Total Sets</div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-white">
                                                {comparisonData.current.stats.totalSets}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                vs {comparisonData.previous.stats.totalSets}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {formatChange(comparisonData.changes.sets)}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                                    <div className="text-slate-400 text-sm mb-1">Workout Days</div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-white">
                                                {comparisonData.current.stats.workoutDays}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                vs {comparisonData.previous.stats.workoutDays}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {formatChange(comparisonData.changes.workoutDays)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Muscle Group Comparison */}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Target size={24} className="text-emerald-400" />
                                Muscle Group Changes
                            </h3>
                            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                                <div className="p-4 border-b border-slate-700 bg-slate-700/50">
                                    <div className="grid grid-cols-4 gap-4 text-sm font-bold text-slate-300">
                                        <div>Muscle Group</div>
                                        <div className="text-center">Current Week</div>
                                        <div className="text-center">Previous Week</div>
                                        <div className="text-center">Change</div>
                                    </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {comparisonData.muscleChanges.map((muscle, index) => (
                                        <div key={muscle.muscle} className={`p-4 border-b border-slate-700 ${index % 2 === 0 ? 'bg-slate-800/50' : ''}`}>
                                            <div className="grid grid-cols-4 gap-4 items-center">
                                                <div className="font-medium text-white">{muscle.muscle}</div>
                                                <div className="text-center text-emerald-400 font-bold">
                                                    {Math.round(muscle.currentWeight)}kg
                                                </div>
                                                <div className="text-center text-slate-400">
                                                    {Math.round(muscle.previousWeight)}kg
                                                </div>
                                                <div className="text-center">
                                                    {formatChange(muscle.changePercent)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Key Insights */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Zap size={24} className="text-emerald-400" />
                                Key Insights
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4">
                                    <h4 className="font-bold text-emerald-400 mb-2">Biggest Improvement</h4>
                                    {comparisonData.muscleChanges.length > 0 && comparisonData.muscleChanges[0].changePercent > 0 ? (
                                        <p className="text-white">
                                            <span className="font-bold">{comparisonData.muscleChanges[0].muscle}</span> training
                                            increased by <span className="text-emerald-400 font-bold">
                                                {comparisonData.muscleChanges[0].changePercent.toFixed(1)}%
                                            </span>
                                        </p>
                                    ) : (
                                        <p className="text-slate-400">No significant improvements this week</p>
                                    )}
                                </div>

                                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
                                    <h4 className="font-bold text-blue-400 mb-2">Volume Progress</h4>
                                    <p className="text-white">
                                        Total training volume {comparisonData.changes.volume > 0 ? 'increased' : 'decreased'} by{' '}
                                        <span className={`font-bold ${comparisonData.changes.volume > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {Math.abs(comparisonData.changes.volume).toFixed(1)}%
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeeklyReportComparison;