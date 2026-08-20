import React, { useMemo } from 'react';
import { MuscleGroup } from '@/shared/types';
import { BODY_PATHS, MUSCLE_PATHS, MUSCLE_VIEW_MAPPING } from '@/features/anatomy/constants/musclePaths';
import { MUSCLE_VIEW_MAPPING_ENHANCED } from '@/features/anatomy/services/MuscleHighlightService';
import { getMuscleColorRGBA } from '@/features/anatomy/constants/muscleColors';

/** 肌肉 path key → MuscleGroup 枚举（双向映射的反向，由 MUSCLE_VIEW_MAPPING_ENHANCED 推导） */
const PATH_KEY_TO_GROUP: Record<string, MuscleGroup> = (() => {
    const map: Record<string, MuscleGroup> = {};
    (Object.entries(MUSCLE_VIEW_MAPPING_ENHANCED.front) as [MuscleGroup, string][]).forEach(([g, key]) => {
        map[key] = g;
    });
    (Object.entries(MUSCLE_VIEW_MAPPING_ENHANCED.back) as [MuscleGroup, string][]).forEach(([g, key]) => {
        map[key] = g;
    });
    return map;
})();

/** muscle_ids（小写 key）→ MuscleGroup 枚举 */
const MUSCLE_ID_TO_GROUP: Record<string, MuscleGroup> = {
    chest: MuscleGroup.CHEST,
    biceps: MuscleGroup.BICEPS,
    triceps: MuscleGroup.TRICEPS,
    forearms: MuscleGroup.FOREARMS,
    shoulders: MuscleGroup.SHOULDERS,
    abs: MuscleGroup.ABS,
    obliques: MuscleGroup.OBLIQUES,
    quads: MuscleGroup.QUADS,
    lats: MuscleGroup.LATS,
    traps: MuscleGroup.TRAPS,
    lower_back: MuscleGroup.LOWER_BACK,
    glutes: MuscleGroup.GLUTES,
    hamstrings: MuscleGroup.HAMSTRINGS,
    calves: MuscleGroup.CALVES,
    cardio: MuscleGroup.CARDIO,
};

interface ExerciseMuscleMapProps {
    /** 主目标肌群（高亮不透明度高） */
    primaryMuscle: MuscleGroup;
    /** 次级/辅助肌群（高亮不透明度低） */
    secondaryMuscles?: MuscleGroup[];
    /** 详细的 muscle_ids（小写 key，如 'lats' / 'rear-shoulders'） */
    muscleIds?: string[];
    /** 单个视图的 CSS 高度 */
    height?: number;
}

const VIEW_BOX = '-30 0 400 700';

// 与 MuscleAnatomyViewer 一致的底色（深色调剪影）
const BASE_FILL = '#1e293b';
const BASE_STROKE = '#334155';
const MUSCLE_DEFAULT_FILL = '#020617';
const MUSCLE_DEFAULT_STROKE = '#1f2937';

/**
 * 单侧人体解剖 SVG（正面或背面）
 * 按 MUSCLE_THEME 全局配色高亮目标肌群，与 report 颜色体系一致
 */
const AnatomyView: React.FC<{
    view: 'front' | 'back';
    primaryMuscle: MuscleGroup;
    secondarySet: Set<MuscleGroup>;
}> = ({ view, primaryMuscle, secondarySet }) => {
    const muscleKeys = MUSCLE_VIEW_MAPPING[view] as string[];
    const paths = BODY_PATHS[view];

    const getStyle = (pathKey: string): React.CSSProperties => {
        const group = PATH_KEY_TO_GROUP[pathKey];
        if (group === primaryMuscle) {
            return {
                fill: getMuscleColorRGBA(group, 0.85),
                stroke: getMuscleColorRGBA(group, 1),
                strokeWidth: 2,
            };
        }
        if (group && secondarySet.has(group)) {
            return {
                fill: getMuscleColorRGBA(group, 0.45),
                stroke: getMuscleColorRGBA(group, 0.7),
                strokeWidth: 1.5,
            };
        }
        return {
            fill: MUSCLE_DEFAULT_FILL,
            fillOpacity: 0.95,
            stroke: MUSCLE_DEFAULT_STROKE,
            strokeWidth: 1,
        };
    };

    return (
        <svg
            viewBox={VIEW_BOX}
            className="h-full w-auto mx-auto"
            style={{ maxWidth: '100%' }}
            role="img"
            aria-label={view === 'front' ? 'Anterior view' : 'Posterior view'}
        >
            {/* Base silhouette */}
            <path d={paths.baseSilhouette} fill={BASE_FILL} stroke={BASE_STROKE} strokeWidth="1.5" />

            {/* Front view detail layer */}
            {view === 'front' && BODY_PATHS.front.detail1 && (
                <path
                    d={BODY_PATHS.front.detail1}
                    fill={MUSCLE_DEFAULT_FILL}
                    fillOpacity="0.95"
                    stroke={MUSCLE_DEFAULT_STROKE}
                    strokeWidth="1"
                />
            )}

            {/* Muscle paths with highlight */}
            {muscleKeys.map((key) => {
                const d = MUSCLE_PATHS[key as keyof typeof MUSCLE_PATHS];
                if (!d) return null;
                return <path key={key} d={d} style={getStyle(key)} />;
            })}
        </svg>
    );
};

/**
 * 动作肌肉解剖图：正面 + 背面并排
 * - 自动解析 muscleIds（含 "rear shoulders" 等细分）为 MuscleGroup
 * - 颜色取自 MUSCLE_THEME，与周报 / PDF report 完全一致
 */
const ExerciseMuscleMap: React.FC<ExerciseMuscleMapProps> = ({
    primaryMuscle,
    secondaryMuscles = [],
    muscleIds = [],
    height = 220,
}) => {
    // 汇总所有被刺激的肌群（主 + 辅 + muscle_ids 推导）
    const { secondarySet, hasBackMuscles } = useMemo(() => {
        const stimulated = new Set<MuscleGroup>([primaryMuscle, ...secondaryMuscles]);

        muscleIds.forEach((rawId) => {
            const id = rawId.toLowerCase().replace(/-/g, ' ').trim();
            // 直接匹配
            const direct = MUSCLE_ID_TO_GROUP[id.replace(/ /g, '_')];
            if (direct) {
                stimulated.add(direct);
                return;
            }
            // 模糊匹配（如 "rear shoulders" → shoulders）
            for (const [key, group] of Object.entries(MUSCLE_ID_TO_GROUP)) {
                if (id.includes(key.replace(/_/g, ' '))) {
                    stimulated.add(group);
                    return;
                }
            }
        });

        stimulated.delete(primaryMuscle);

        const backSet = new Set<MuscleGroup>(
            (MUSCLE_VIEW_MAPPING.back as string[])
                .map((k) => PATH_KEY_TO_GROUP[k])
                .filter(Boolean) as MuscleGroup[]
        );

        const all = new Set<MuscleGroup>([primaryMuscle, ...stimulated]);
        const hasBack = Array.from(all).some((g) => backSet.has(g));

        return { secondarySet: stimulated, hasBackMuscles: hasBack };
    }, [primaryMuscle, secondaryMuscles, muscleIds]);

    return (
        <div className="flex gap-2">
            {/* Front view */}
            <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center" style={{ height }}>
                    <AnatomyView view="front" primaryMuscle={primaryMuscle} secondarySet={secondarySet} />
                </div>
                <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">正面 Anterior</span>
            </div>

            {/* Back view */}
            <div className="flex-1 flex flex-col items-center">
                <div className={`w-full bg-slate-900/60 rounded-xl border overflow-hidden flex items-center justify-center ${hasBackMuscles ? 'border-slate-800' : 'border-slate-800/50 opacity-60'}`} style={{ height }}>
                    <AnatomyView view="back" primaryMuscle={primaryMuscle} secondarySet={secondarySet} />
                </div>
                <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">背面 Posterior</span>
            </div>
        </div>
    );
};

export default ExerciseMuscleMap;
