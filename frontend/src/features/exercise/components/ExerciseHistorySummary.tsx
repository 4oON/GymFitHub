import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Dumbbell } from 'lucide-react';
import { iOSStorage } from '@/services/iOSStorageService';
import type { WorkoutSession } from '@/shared/types';

interface ExerciseHistorySummaryProps {
    exerciseId: string;
    exerciseName: string;
    exerciseNameZh?: string;
}

interface SessionPoint {
    date: number;
    label: string; // e.g. "8/15"
    maxWeight: number;
    totalSets: number;
    totalReps: number;
}

/**
 * 从 zenfit_history 提取该动作的逐次训练数据
 * Load per-session stats for this exercise from local workout history
 */
function useExerciseSessions(exerciseId: string, exerciseName: string, exerciseNameZh?: string): SessionPoint[] {
    return useMemo(() => {
        try {
            const raw = iOSStorage.getItem('zenfit_history');
            if (!raw) return [];
            const sessions: WorkoutSession[] = JSON.parse(raw);

            const points: SessionPoint[] = [];
            sessions.forEach((session) => {
                if (!session.exercises || !session.date) return;
                session.exercises.forEach((ex) => {
                    const match =
                        ex.exerciseId === exerciseId ||
                        ex.exerciseName === exerciseName ||
                        (exerciseNameZh && ex.exerciseNameZh === exerciseNameZh);
                    if (!match) return;

                    const completed = ex.sets.filter((s) => s.completed);
                    if (completed.length === 0) return;

                    const maxWeight = Math.max(...completed.map((s) => s.weight), 0);
                    const totalReps = completed.reduce((sum, s) => sum + s.reps, 0);
                    const d = new Date(session.date);

                    points.push({
                        date: session.date,
                        label: `${d.getMonth() + 1}/${d.getDate()}`,
                        maxWeight,
                        totalSets: completed.length,
                        totalReps,
                    });
                });
            });

            // 按时间升序（旧 → 新），图表从左到右读
            return points.sort((a, b) => a.date - b.date);
        } catch {
            return [];
        }
    }, [exerciseId, exerciseName, exerciseNameZh]);
}

/** 迷你柱状图 — slate/emerald 主题 */
const MiniBarChart: React.FC<{ points: SessionPoint[] }> = ({ points }) => {
    const W = 320;
    const H = 96;
    const PAD_X = 6;
    const PAD_TOP = 18;
    const PAD_BOTTOM = 18;
    const chartH = H - PAD_TOP - PAD_BOTTOM;

    const maxVal = Math.max(...points.map((p) => p.maxWeight), 1);
    const barGap = 6;
    const barW = Math.max(8, Math.min(28, (W - PAD_X * 2 - barGap * (points.length - 1)) / points.length));
    const totalW = points.length * barW + (points.length - 1) * barGap;
    const startX = (W - totalW) / 2;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="历史重量柱状图">
            {/* baseline */}
            <line
                x1={PAD_X}
                y1={H - PAD_BOTTOM}
                x2={W - PAD_X}
                y2={H - PAD_BOTTOM}
                stroke="#1e293b"
                strokeWidth="1"
            />
            {points.map((p, i) => {
                const h = Math.max(3, (p.maxWeight / maxVal) * chartH);
                const x = startX + i * (barW + barGap);
                const y = H - PAD_BOTTOM - h;
                const isLatest = i === points.length - 1;
                return (
                    <g key={p.date}>
                        <rect
                            x={x}
                            y={y}
                            width={barW}
                            height={h}
                            rx={3}
                            fill={isLatest ? '#10b981' : 'rgba(16, 185, 129, 0.35)'}
                        />
                        {/* weight label on top */}
                        <text
                            x={x + barW / 2}
                            y={y - 4}
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="700"
                            fill={isLatest ? '#34d399' : '#64748b'}
                        >
                            {p.maxWeight > 0 ? p.maxWeight : '–'}
                        </text>
                        {/* date label below */}
                        <text
                            x={x + barW / 2}
                            y={H - 5}
                            textAnchor="middle"
                            fontSize="8"
                            fill="#475569"
                        >
                            {p.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

/**
 * 个人训练历史总结卡片
 * - 顶部统计行：做过几次 / 历史最大重量 / 上次表现 / 趋势
 * - 下方：逐次最大重量柱状图（最新一次高亮 emerald）
 */
const ExerciseHistorySummary: React.FC<ExerciseHistorySummaryProps> = ({
    exerciseId,
    exerciseName,
    exerciseNameZh,
}) => {
    const points = useExerciseSessions(exerciseId, exerciseName, exerciseNameZh);

    if (points.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
                    <Dumbbell size={16} className="text-emerald-400" />
                    我的训练记录 / My History
                </h3>
                <p className="text-sm text-slate-500">还没有做过这个动作，今天是第一次 💪</p>
            </div>
        );
    }

    const totalSessions = points.length;
    const maxEver = Math.max(...points.map((p) => p.maxWeight));
    const latest = points[points.length - 1];

    // 趋势：最近3次 vs 之前3次的平均最大重量
    let trend: 'up' | 'down' | 'flat' = 'flat';
    if (points.length >= 4) {
        const recent = points.slice(-3);
        const prior = points.slice(-6, -3);
        if (prior.length > 0) {
            const avgRecent = recent.reduce((s, p) => s + p.maxWeight, 0) / recent.length;
            const avgPrior = prior.reduce((s, p) => s + p.maxWeight, 0) / prior.length;
            if (avgRecent > avgPrior * 1.03) trend = 'up';
            else if (avgRecent < avgPrior * 0.97) trend = 'down';
        }
    }

    const trendMeta = {
        up: { icon: TrendingUp, color: 'text-emerald-400', label: '进步中' },
        down: { icon: TrendingDown, color: 'text-rose-400', label: '回落' },
        flat: { icon: Minus, color: 'text-slate-400', label: '持平' },
    }[trend];
    const TrendIcon = trendMeta.icon;

    // 图表最多展示最近 8 次
    const chartPoints = points.slice(-8);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                <Dumbbell size={16} className="text-emerald-400" />
                我的训练记录 / My History
            </h3>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-slate-800/60 rounded-xl px-2 py-2 text-center">
                    <div className="text-lg font-black text-white leading-none">{totalSessions}</div>
                    <div className="text-[10px] text-slate-500 mt-1">做过(次)</div>
                </div>
                <div className="bg-slate-800/60 rounded-xl px-2 py-2 text-center">
                    <div className="text-lg font-black text-emerald-400 leading-none">{maxEver}</div>
                    <div className="text-[10px] text-slate-500 mt-1">最大(kg)</div>
                </div>
                <div className="bg-slate-800/60 rounded-xl px-2 py-2 text-center">
                    <div className="text-lg font-black text-white leading-none">
                        {latest.maxWeight}
                        <span className="text-[10px] font-bold text-slate-500">×{latest.totalReps}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">上次</div>
                </div>
                <div className="bg-slate-800/60 rounded-xl px-2 py-2 text-center flex flex-col items-center justify-center">
                    <TrendIcon size={18} className={trendMeta.color} />
                    <div className={`text-[10px] mt-1 ${trendMeta.color}`}>{trendMeta.label}</div>
                </div>
            </div>

            {/* Bar chart of per-session max weight */}
            <MiniBarChart points={chartPoints} />
            <p className="text-[10px] text-slate-600 text-center mt-1">
                每次训练的最大重量（最近 {chartPoints.length} 次）
            </p>
        </div>
    );
};

export default ExerciseHistorySummary;
