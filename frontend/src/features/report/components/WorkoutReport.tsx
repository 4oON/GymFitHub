import React from 'react';
import { MuscleGroup } from '@/shared/types';
import type { WorkoutSession } from '@/shared/types';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface WorkoutReportProps {
    session: WorkoutSession;
    userWeight: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const WorkoutReport: React.FC<WorkoutReportProps> = ({ session, userWeight }) => {
    // Calculate Stats
    const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
    const totalReps = session.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).reduce((sAcc, s) => sAcc + s.reps, 0), 0);
    const totalVolume = session.volumeLoad;
    const avgRest = 0; // Placeholder if we want to calculate actual avg rest

    // Muscle Analysis
    const muscleStats: Record<string, { sets: number, volume: number, exercises: number, details: string[] }> = {};

    session.exercises.forEach(ex => {
        if (!muscleStats[ex.muscleGroup]) {
            muscleStats[ex.muscleGroup] = { sets: 0, volume: 0, exercises: 0, details: [] };
        }
        const completedSets = ex.sets.filter(s => s.completed);
        const vol = completedSets.reduce((acc, s) => acc + (s.weight * s.reps), 0);

        muscleStats[ex.muscleGroup].sets += completedSets.length;
        muscleStats[ex.muscleGroup].volume += vol;
        muscleStats[ex.muscleGroup].exercises += 1;

        // Format: "Bench Press (4 sets x 60kg)"
        const setSummary = completedSets.length > 0 ? `${completedSets.length} sets` : '0 sets';
        muscleStats[ex.muscleGroup].details.push(`${ex.exerciseName} (${setSummary})`);
    });

    const pieData = Object.entries(muscleStats).map(([name, stats]) => ({
        name,
        value: stats.volume
    })).sort((a, b) => b.value - a.value);

    return (
        <div id="workout-report" className="bg-white text-slate-900 p-8 w-[210mm] min-h-[297mm] mx-auto font-sans">
            {/* HEADER */}
            <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Training Report 训练报告</h1>
                    <p className="text-slate-500 mt-1">ZenFit Pro Analytics</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">Date: {new Date(session.date).toLocaleDateString()}</p>
                    <p className="text-sm font-medium text-slate-600">Bodyweight: {userWeight} kg</p>
                </div>
            </div>

            {/* EXERCISE DETAILS TABLE */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-3 border-l-4 border-blue-600 pl-3">Exercise Details 训练动作详情</h2>
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-slate-800 text-white">
                            <th className="p-2 text-left">Exercise 动作</th>
                            <th className="p-2 text-center">Sets 组数</th>
                            <th className="p-2 text-center">Reps 次数</th>
                            <th className="p-2 text-center">Best Weight 重量</th>
                        </tr>
                    </thead>
                    <tbody>
                        {session.exercises.map((ex, i) => {
                            const completedSets = ex.sets.filter(s => s.completed);
                            if (completedSets.length === 0) return null;
                            const bestWeight = Math.max(...completedSets.map(s => s.weight));
                            const repsStr = completedSets.map(s => s.reps).join(', ');

                            return (
                                <tr key={ex.id} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                                    <td className="p-2 border-b border-slate-200 font-medium">{ex.exerciseName}</td>
                                    <td className="p-2 border-b border-slate-200 text-center">{completedSets.length}</td>
                                    <td className="p-2 border-b border-slate-200 text-center text-slate-600">{repsStr}</td>
                                    <td className="p-2 border-b border-slate-200 text-center font-bold">{bestWeight} kg</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* MUSCLE GROUP ANALYSIS */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-3 border-l-4 border-blue-600 pl-3">Muscle Group Analysis 肌肉部位分析</h2>
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-slate-800 text-white">
                            <th className="p-2 text-left">Muscle 部位</th>
                            <th className="p-2 text-center">Total Sets 总组数</th>
                            <th className="p-2 text-center">Volume 总负荷</th>
                            <th className="p-2 text-left">Exercises 刺激动作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(muscleStats).map(([muscle, stats], i) => (
                            <tr key={muscle} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                                <td className="p-2 border-b border-slate-200 font-bold">{muscle}</td>
                                <td className="p-2 border-b border-slate-200 text-center">{stats.sets}</td>
                                <td className="p-2 border-b border-slate-200 text-center">{stats.volume} kg</td>
                                <td className="p-2 border-b border-slate-200 text-xs text-slate-500">{stats.details.join(', ')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* CHART & STATS */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-3 border-l-4 border-blue-600 pl-3">Volume Distribution 负荷分布</h2>
                    <div className="h-64 w-full border border-slate-200 rounded-xl p-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-3 border-l-4 border-blue-600 pl-3">Summary Statistics 统计汇总</h2>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Total Exercises:</span>
                            <span className="font-bold">{session.exercises.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Total Sets:</span>
                            <span className="font-bold">{totalSets}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Total Reps:</span>
                            <span className="font-bold">{totalReps}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Total Volume:</span>
                            <span className="font-bold text-emerald-600">{totalVolume} kg</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Duration:</span>
                            <span className="font-bold">{session.durationMinutes} min</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center text-xs text-slate-400 mt-auto pt-8 border-t border-slate-200">
                Generated by ZenFit Pro
            </div>
        </div>
    );
};

export default WorkoutReport;