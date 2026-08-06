import React, { useMemo, useState } from 'react';
import { MuscleGroup } from '@/shared/types';
import type { RecoveryStatus } from '@/shared/types';
import { BODY_PATHS, MUSCLE_PATHS } from '@/features/anatomy/constants/musclePaths';
import { Clock } from 'lucide-react';

interface RecoveryHeatmapViewProps {
    recoveryState: RecoveryStatus[];
    now: number;
}

type BodyView = 'front' | 'back';

// 肌肉ID到MuscleGroup的映射
const VISUAL_MUSCLE_MAP: Record<string, MuscleGroup> = {
    // Front
    chest: MuscleGroup.CHEST,
    biceps: MuscleGroup.BICEPS,
    triceps: MuscleGroup.TRICEPS,
    forearms: MuscleGroup.FOREARMS,
    shoulders: MuscleGroup.SHOULDERS,
    abs: MuscleGroup.ABS,
    obliques: MuscleGroup.OBLIQUES,
    quads: MuscleGroup.QUADS,
    traps_front: MuscleGroup.TRAPS,
    calves_front: MuscleGroup.CALVES,
    // Back
    traps: MuscleGroup.TRAPS,
    obliques_back: MuscleGroup.OBLIQUES,
    back_shoulders: MuscleGroup.SHOULDERS,
    back_triceps: MuscleGroup.TRICEPS,
    back_forearms: MuscleGroup.FOREARMS,
    lats: MuscleGroup.LATS,
    lower_back: MuscleGroup.LOWER_BACK,
    glutes: MuscleGroup.GLUTES,
    hamstrings: MuscleGroup.HAMSTRINGS,
    calves: MuscleGroup.CALVES,
};

/**
 * 获取高饱和度实色填充（四级颜色映射）
 *
 * 颜色区间：
 * - CRITICAL (0-37%): 红色 rgb(239, 68, 68)
 * - RECOVERING_EARLY (38-56%): 橙色 rgb(255, 159, 10)
 * - RECOVERING_LATE (57-79%): 黄色 rgb(234, 179, 8)
 * - READY (80-100%): 绿色 #00F294
 */
const getSolidColor = (percentage: number): string => {
    const p = Math.max(0, Math.min(100, percentage));
    if (p >= 80) return '#00F294'; // READY (≥80%) - Signature Green
    else if (p >= 57) return 'rgb(234, 179, 8)'; // RECOVERING_LATE (57-79%) - 黄色
    else if (p >= 38) return 'rgb(255, 159, 10)'; // RECOVERING_EARLY (38-56%) - 橙色
    else return 'rgb(239, 68, 68)'; // CRITICAL (≤37%) - 红色
};

/**
 * 获取圆点颜色（用于右侧卡片 - 完全同步肌肉实色）
 */
const getDotColor = (percentage: number): string => {
    return getSolidColor(percentage); // 直接使用相同的实色
};

export const RecoveryHeatmapView: React.FC<RecoveryHeatmapViewProps> = ({ recoveryState, now }) => {
    // 视图切换状态
    const [bodyView, setBodyView] = useState<BodyView>('front');

    // 🆕 防御性检查：确保 recoveryState 是有效数组
    const safeRecoveryState = useMemo(() => {
        if (!Array.isArray(recoveryState) || recoveryState.length === 0) {
            console.warn('⚠️ RecoveryHeatmapView: recoveryState 为空或无效');
            return [];
        }
        return recoveryState;
    }, [recoveryState]);

    // 计算恢复数据
    const recoveryData = useMemo(() => {
        if (safeRecoveryState.length === 0) {
            return [];
        }

        return safeRecoveryState.map(status => {
            // 🆕 验证 status 对象
            if (!status || typeof status !== 'object') {
                console.warn('⚠️ RecoveryHeatmapView: 无效的 status 对象');
                return null;
            }

            const elapsedMs = now - (status.lastWorked || 0);
            const durationMs = (status.recoveryDurationHours || 72) * 60 * 60 * 1000;

            if (!status.lastWorked || status.lastWorked === 0) {
                return {
                    ...status,
                    percentage: 100,
                    hoursLeft: 0
                };
            }

            let percentage = (elapsedMs / durationMs) * 100;
            percentage = Math.min(100, Math.max(0, percentage));

            const remainingMs = Math.max(0, durationMs - elapsedMs);
            const hoursLeft = Math.ceil(remainingMs / (1000 * 60 * 60));

            return {
                ...status,
                percentage: Math.round(percentage),
                hoursLeft
            };
        }).filter(Boolean) as (RecoveryStatus & { percentage: number; hoursLeft: number })[];
    }, [safeRecoveryState, now]);

    // 创建肌肉恢复映射
    const muscleRecoveryMap = useMemo(() => {
        const map = new Map<MuscleGroup, { percentage: number; hoursLeft: number }>();
        recoveryData.forEach(data => {
            map.set(data.muscle, {
                percentage: data.percentage,
                hoursLeft: data.hoursLeft
            });
        });
        return map;
    }, [recoveryData]);

    // 获取肌肉样式（精致白色轮廓 + 高饱和度实色填充）
    const getMuscleStyle = (muscleId: string) => {
        const group = VISUAL_MUSCLE_MAP[muscleId];
        if (!group) {
            return {
                fill: 'rgba(30, 41, 59, 0.5)',
                fillOpacity: 1,
                stroke: 'rgba(226, 232, 240, 0.7)', // 精致白色系轮廓
                strokeWidth: '0.6', // 缩小后更精致的线宽
                filter: 'none'
            };
        }

        const recovery = muscleRecoveryMap.get(group);
        // 如果没有恢复数据，默认为 100% 恢复（绿色）
        const percentage = recovery ? recovery.percentage : 100;
        const solidColor = getSolidColor(percentage);

        return {
            fill: solidColor, // 高饱和度实色填充 - 保持色彩冲击力
            fillOpacity: 1,
            stroke: 'rgba(226, 232, 240, 0.7)', // 精致白色系轮廓 - 冰白色
            strokeWidth: '0.6', // 缩小后更精致的线宽
            filter: 'none' // 移除发光效果，依靠物理间隙体现细节
        };
    };

    // 获取恢复最低的前5个肌群
    // 如果有未完全恢复的肌群（< 100%），显示恢复最低的 5 个
    // 如果全部恢复完成（都是 100%），显示最后恢复完成的 3 个（lastWorked 最近的）
    const topFiveLowRecovery = useMemo(() => {
        const recovering = recoveryData.filter(d => d.percentage < 100);

        if (recovering.length > 0) {
            // 有未完全恢复的肌群，按恢复百分比从低到高排序，取前 5 个
            return recovering
                .sort((a, b) => a.percentage - b.percentage)
                .slice(0, 5);
        } else {
            // 全部恢复完成，显示最后恢复完成的 3 个（lastWorked 最近的）
            return [...recoveryData]
                .filter(d => d.lastWorked > 0) // 筛选有训练记录的肌群
                .sort((a, b) => b.lastWorked - a.lastWorked) // 按 lastWorked 从新到旧排序
                .slice(0, 3); // 取前 3 个
        }
    }, [recoveryData]);

    // 获取当前视图的肌肉列表
    const currentViewMuscles = useMemo(() => {
        return bodyView === 'front'
            ? ['chest', 'biceps', 'forearms', 'shoulders', 'abs', 'obliques', 'quads', 'traps_front', 'calves_front']
            : ['traps', 'lats', 'glutes', 'hamstrings', 'calves', 'lower_back', 'back_shoulders', 'back_triceps', 'back_forearms', 'obliques_back'];
    }, [bodyView]);

    // 🆕 如果没有恢复数据，显示空状态
    if (recoveryData.length === 0) {
        return (
            <div className="backdrop-blur-2xl rounded-xl border border-slate-600/30 py-6 px-4 bg-gradient-to-b from-slate-900 to-[#020617] relative overflow-hidden min-h-[520px] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400 text-sm mb-2">恢复状态数据未加载</p>
                    <p className="text-slate-500 text-xs">请刷新页面或检查数据</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="backdrop-blur-2xl rounded-xl border border-slate-600/30 py-4 px-3 bg-gradient-to-b from-slate-900 to-[#020617] relative overflow-hidden min-h-[500px] flex flex-col"
        >
            {/* 背景全息光晕 - 改进版本，适配移动设备 */}
            <div
                className="absolute inset-0 opacity-25 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at center, rgba(0, 242, 148, 0.25) 0%, transparent 65%)'
                }}
            />

            {/* 响应式布局：移动端垂直堆叠，桌面端水平排列 */}
            <div className="flex flex-col lg:grid lg:grid-cols-[5.5fr_4.5fr] gap-4 flex-1 relative z-10 w-full">
                {/* 左侧：人体图区域 */}
                <div className="flex flex-col relative h-full">
                    {/* 切换按钮 - 移动端居中，桌面端左对齐 */}
                    <div className="flex justify-center lg:justify-start mb-4 relative z-20 lg:pl-4">
                        <div className="inline-flex bg-slate-900/80 backdrop-blur-md p-1 rounded-full border border-slate-700/50">
                            <button
                                onClick={() => setBodyView('front')}
                                className={`px-3 py-1.5 rounded-full font-bold text-[10px] tracking-wider transition-all ${bodyView === 'front'
                                    ? 'bg-[#00F294] text-slate-900 shadow-lg'
                                    : 'text-slate-400'
                                    }`}
                            >
                                ANTERIOR
                            </button>
                            <button
                                onClick={() => setBodyView('back')}
                                className={`px-3 py-1.5 rounded-full font-bold text-[10px] tracking-wider transition-all ${bodyView === 'back'
                                    ? 'bg-[#00F294] text-slate-900 shadow-lg'
                                    : 'text-slate-400'
                                    }`}
                            >
                                POSTERIOR
                            </button>
                        </div>
                    </div>

                    {/* 人体 SVG 容器 - 优化移动端显示 */}
                    <div className="flex-1 relative overflow-visible min-h-[300px] sm:min-h-[340px] lg:min-h-0">
                        <svg
                            viewBox="-30 0 400 700"
                            className="absolute top-0 left-1/2 -translate-x-1/2 lg:left-[-10%] lg:translate-x-0 h-full w-auto scale-[1.05] sm:scale-[1.1] origin-top"
                            style={{ maxHeight: '100%' }}
                        >
                            <g transform="translate(0, 10)">
                                {/* Base Silhouette - 精致白色外边界 */}
                                <path
                                    d={bodyView === 'front' ? BODY_PATHS.front.baseSilhouette : BODY_PATHS.back.baseSilhouette}
                                    fill="rgba(15, 23, 42, 0.6)"
                                    stroke="rgba(226, 232, 240, 0.8)"
                                    strokeWidth="0.8"
                                />

                                {/* Detail Layer - 内部细节层 (仅正面) - 与轮廓同色 */}
                                {bodyView === 'front' && BODY_PATHS.front.detail1 && (
                                    <path
                                        d={BODY_PATHS.front.detail1}
                                        fill="none"
                                        stroke="rgba(226, 232, 240, 0.7)"
                                        strokeWidth="0.6"
                                    />
                                )}

                                {/* Muscle Groups - 当前视图 */}
                                {currentViewMuscles.map(muscleId => {
                                    const style = getMuscleStyle(muscleId);
                                    return MUSCLE_PATHS[muscleId as keyof typeof MUSCLE_PATHS] && (
                                        <path
                                            key={muscleId}
                                            d={MUSCLE_PATHS[muscleId as keyof typeof MUSCLE_PATHS]}
                                            {...style}
                                        />
                                    );
                                })}
                            </g>
                        </svg>
                    </div>
                </div>

                {/* 右侧：标签列表 - 移动端紧凑布局，两列显示 */}
                <div className="flex flex-col justify-center px-1 lg:pl-6 lg:pr-2 mt-4 lg:mt-0">
                    {/* 移动端：两列网格布局，桌面端：单列 */}
                    <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {topFiveLowRecovery.map((item) => (
                            <div
                                key={item.muscle}
                                className="w-full bg-slate-800/30 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: getDotColor(item.percentage) }}
                                    />
                                    <span className="text-sm font-bold text-slate-100 truncate">
                                        {item.muscle}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs pl-5">
                                    <span className="text-slate-200 font-mono">{item.percentage}%</span>
                                    <span className="text-slate-600">·</span>
                                    <div className="flex items-center gap-1 text-slate-500">
                                        <Clock size={10} />
                                        <span>{item.hoursLeft}h</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};