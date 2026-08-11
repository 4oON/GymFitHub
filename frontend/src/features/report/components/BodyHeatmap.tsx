/**
 * 人体肌肉热力图组件 - Body Heatmap
 * 
 * 使用项目现有的肌肉路径数据
 * 展示正面和背面肌肉训练分布热力图
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BODY_PATHS, MUSCLE_PATHS } from '@/features/anatomy/constants/musclePaths';
import { iOSStorage } from '@/services/iOSStorageService';

interface MuscleData {
  muscle: string;
  percentage: number;
  sets: number;
  totalWeight: number;
}

interface BodyHeatmapProps {
  muscleData: MuscleData[];
  className?: string;
  language?: 'zh' | 'en';
}

// 肌肉名称映射（英文ID -> 中文）
const muscleNameMap: Record<string, string> = {
  'chest': '胸大肌',
  'biceps': '肱二头肌',
  'triceps': '肱三头肌',
  'forearms': '前臂',
  'shoulders': '三角肌',
  'abs': '腹肌',
  'obliques': '腹斜肌',
  'quads': '股四头肌',
  'traps_front': '斜方肌',
  'calves_front': '小腿',
  'traps': '斜方肌',
  'obliques_back': '腹斜肌',
  'back_shoulders': '三角肌',
  'back_triceps': '肱三头肌',
  'back_forearms': '前臂',
  'lats': '背阔肌',
  'lower_back': '下背部',
  'glutes': '臀大肌',
  'hamstrings': '腘绳肌',
  'calves': '小腿'
};

// 肌肉名称映射（中文 -> 英文显示）
const muscleNameToEn: Record<string, string> = {
  '胸大肌': 'Chest',
  '胸肌': 'Chest',
  '背阔肌': 'Lats',
  '背部': 'Back',
  '三角肌': 'Delts',
  '三角肌前束': 'Front Delts',
  '三角肌中束': 'Side Delts',
  '三角肌后束': 'Rear Delts',
  '肩部': 'Shoulders',
  '肱二头肌': 'Biceps',
  '肱三头肌': 'Triceps',
  '前臂': 'Forearms',
  '手臂': 'Arms',
  '腹肌': 'Abs',
  '腹斜肌': 'Obliques',
  '核心': 'Core',
  '股四头肌': 'Quads',
  '腿部': 'Legs',
  '斜方肌': 'Traps',
  '小腿': 'Calves',
  '臀大肌': 'Glutes',
  '臀部': 'Glutes',
  '腘绳肌': 'Hamstrings',
  '下背部': 'Lower Back',
  '全身': 'Full Body'
};

// 肌肉ID映射到MuscleData名称
const muscleIdToDataMap: Record<string, string[]> = {
  'chest': ['Chest', '胸大肌', '胸肌'],
  'biceps': ['Biceps', '肱二头肌'],
  'triceps': ['Triceps', '肱三头肌'],
  'forearms': ['Forearms', '前臂'],
  'back_forearms': ['Forearms', '前臂'],
  'shoulders': ['Shoulders', '肩部', '三角肌'],
  'back_shoulders': ['Shoulders', '肩部', '三角肌'],
  'abs': ['Abs', '腹肌'],
  'obliques': ['Obliques', '腹斜肌'],
  'obliques_back': ['Obliques', '腹斜肌'],
  'quads': ['Quads', '股四头肌', '腿部'],
  'traps': ['Traps', '斜方肌'],
  'traps_front': ['Traps', '斜方肌'],
  'lats': ['Lats', '背阔肌', '背部'],
  'lower_back': ['Lower Back', '下背部'],
  'glutes': ['Glutes', '臀大肌', '臀部'],
  'hamstrings': ['Hamstrings', '腘绳肌'],
  'calves': ['Calves', '小腿'],
  'calves_front': ['Calves', '小腿']
};

// 获取中文肌肉名称
const getMuscleName = (id: string): string => {
  return muscleNameMap[id] || id;
};

// 热力图颜色配置 - 高对比度热力
const getHeatmapColor = (percentage: number): string => {
  if (percentage >= 30) return '#ef4444'; // 红色 - 高强度
  if (percentage >= 20) return '#f97316'; // 橙色 - 中高强度
  if (percentage >= 10) return '#eab308'; // 黄色 - 中等强度
  if (percentage > 0) return '#22c55e';   // 绿色 - 低强度
  return 'rgba(30, 41, 59, 0.4)'; //  slate-800 - 无训练
};

// 获取强度标签
const getIntensityLabel = (percentage: number, lang: 'zh' | 'en' = 'zh'): string => {
  if (lang === 'zh') {
    if (percentage >= 30) return '高强度';
    if (percentage >= 20) return '中高强度';
    if (percentage >= 10) return '中等强度';
    if (percentage > 0) return '低强度';
    return '未训练';
  } else {
    if (percentage >= 30) return 'High';
    if (percentage >= 20) return 'Med-High';
    if (percentage >= 10) return 'Medium';
    if (percentage > 0) return 'Low';
    return 'No Training';
  }
};

// 正面视图肌肉列表
const FRONT_MUSCLES = [
  'traps_front', 'shoulders', 'chest', 'biceps', 
  'forearms', 'abs', 'obliques', 'quads', 'calves_front'
];

// 背面视图肌肉列表
const BACK_MUSCLES = [
  'traps', 'back_shoulders', 'lats', 'lower_back',
  'back_triceps', 'back_forearms', 'obliques_back', 
  'glutes', 'hamstrings', 'calves'
];

const BodyHeatmap: React.FC<BodyHeatmapProps> = ({ muscleData, className = '', language: propLanguage }) => {
  const [activeView, setActiveView] = useState<'front' | 'back'>('front');
  const [internalLanguage, setInternalLanguage] = useState<'zh' | 'en'>('zh');
  
  // 加载语言设置
  useEffect(() => {
    try {
      const savedLang = iOSStorage.getItem('zenfit_summary_language') as 'zh' | 'en';
      if (savedLang) {
        setInternalLanguage(savedLang);
      }
    } catch {
      // ignore
    }
  }, []);
  
  // 优先使用 prop 传入的语言，否则使用内部状态
  const language = propLanguage || internalLanguage;
  
  // 安全过滤肌肉数据
  const safeMuscleData = useMemo(() => {
    if (!Array.isArray(muscleData)) return [];
    return muscleData.filter(m => m && typeof m === 'object' && m.muscle);
  }, [muscleData]);

  // 查找肌肉数据
  const getMusclePercentage = (muscleId: string): number => {
    const possibleNames = muscleIdToDataMap[muscleId] || [muscleId];
    const data = safeMuscleData.find(m => {
      if (!m.muscle) return false;
      const dataName = m.muscle.toLowerCase();
      return possibleNames.some(name => 
        name.toLowerCase() === dataName || 
        dataName.includes(name.toLowerCase()) ||
        name.toLowerCase().includes(dataName)
      );
    });
    return data?.percentage || 0;
  };

  // 获取肌肉样式
  const getMuscleStyle = (muscleId: string) => {
    const percentage = getMusclePercentage(muscleId);
    const color = getHeatmapColor(percentage);
    
    return {
      fill: color,
      fillOpacity: percentage > 0 ? 0.9 : 0.3,
      stroke: 'rgba(226, 232, 240, 0.6)',
      strokeWidth: '0.5',
      style: {
        filter: percentage > 0 ? 'drop-shadow(0 0 3px ' + color + ')' : 'none',
        transition: 'all 0.3s ease'
      }
    };
  };

  // 当前视图的肌肉列表
  const currentMuscles = activeView === 'front' ? FRONT_MUSCLES : BACK_MUSCLES;

  // 获取训练量最高的肌肉
  const topMuscles = useMemo(() => {
    return [...safeMuscleData]
      .filter(m => m.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 6);
  }, [safeMuscleData]);

  return (
    <div className={`bg-slate-900 rounded-2xl border border-slate-800 p-4 ${className}`}>
      {/* 标题和切换按钮 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500" />
          {language === 'zh' ? '肌肉热力图' : 'Muscle Heatmap'}
        </h3>
        <div className="flex bg-slate-800/50 rounded-lg p-0.5">
          <button
            onClick={() => setActiveView('front')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeView === 'front' 
                ? 'bg-emerald-500 text-slate-900 shadow-lg' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {language === 'zh' ? '正面' : 'Front'}
          </button>
          <button
            onClick={() => setActiveView('back')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeView === 'back' 
                ? 'bg-emerald-500 text-slate-900 shadow-lg' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {language === 'zh' ? '背面' : 'Back'}
          </button>
        </div>
      </div>

      {/* 人体图和详情 */}
      <div className="flex justify-center gap-6">
        {/* SVG 人体图 */}
        <div className="relative w-44 h-80">
          <svg
            viewBox="-30 0 400 700"
            className="w-full h-full"
          >
            <g transform="translate(0, 10)">
              {/* 基础轮廓 */}
              <path
                d={activeView === 'front' ? BODY_PATHS.front.baseSilhouette : BODY_PATHS.back.baseSilhouette}
                fill="rgba(15, 23, 42, 0.6)"
                stroke="rgba(226, 232, 240, 0.8)"
                strokeWidth="0.8"
              />

              {/* 正面细节层 */}
              {activeView === 'front' && BODY_PATHS.front.detail1 && (
                <path
                  d={BODY_PATHS.front.detail1}
                  fill="none"
                  stroke="rgba(226, 232, 240, 0.7)"
                  strokeWidth="0.6"
                />
              )}

              {/* 肌肉层 - 只渲染当前视图存在的肌肉 */}
              {currentMuscles.map(muscleId => {
                const pathData = MUSCLE_PATHS[muscleId as keyof typeof MUSCLE_PATHS];
                if (!pathData) return null;
                
                const style = getMuscleStyle(muscleId);
                return (
                  <motion.path
                    key={muscleId}
                    d={pathData}
                    initial={{ fillOpacity: 0 }}
                    animate={{ fillOpacity: style.fillOpacity }}
                    transition={{ duration: 0.5 }}
                    {...style}
                  />
                );
              })}
            </g>
          </svg>
          
          {/* 视角标签 */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 uppercase tracking-wider">
            {activeView === 'front' ? 'Front View' : 'Back View'}
          </div>
        </div>

        {/* 训练详情列表 */}
        <div className="flex-1 max-w-[200px] space-y-2">
          <h4 className="text-xs text-slate-500 font-medium mb-2">{language === 'zh' ? '训练详情' : 'Training Details'}</h4>
          {topMuscles.length > 0 ? (
            topMuscles.map((muscle, idx) => (
              <motion.div
                key={muscle.muscle}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: getHeatmapColor(muscle.percentage) }}
                  />
                </div>
                <div className="flex-1 mx-2">
                  <span className="text-xs text-slate-300">{language === 'zh' ? muscle.muscle : (muscleNameToEn[muscle.muscle] || muscle.muscle)}</span>
                </div>
                <div className="text-right flex items-center gap-1.5">
                  <span className="text-xs text-white font-medium">{muscle.percentage.toFixed(1)}%</span>
                  <span className="text-[10px] text-slate-500">({muscle.sets}{language === 'zh' ? '组' : ' sets'})</span>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">{language === 'zh' ? '暂无训练数据' : 'No training data'}</p>
          )}
        </div>
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 pt-3 border-t border-slate-800/50">
        {(language === 'zh' ? [
          { color: '#ef4444', label: '高强度', range: '≥30%' },
          { color: '#f97316', label: '中高', range: '20-29%' },
          { color: '#eab308', label: '中等', range: '10-19%' },
          { color: '#22c55e', label: '低强度', range: '1-9%' },
          { color: 'rgba(30, 41, 59, 0.4)', label: '未训练', range: '0%' },
        ] : [
          { color: '#ef4444', label: 'High', range: '≥30%' },
          { color: '#f97316', label: 'Med-High', range: '20-29%' },
          { color: '#eab308', label: 'Medium', range: '10-19%' },
          { color: '#22c55e', label: 'Low', range: '1-9%' },
          { color: 'rgba(30, 41, 59, 0.4)', label: 'None', range: '0%' },
        ]).map((level, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div 
              className="w-2.5 h-2.5 rounded-full border border-slate-700"
              style={{ backgroundColor: level.color }}
            />
            <span className="text-[10px] text-slate-400">{level.label}</span>
            <span className="text-[10px] text-slate-600">{level.range}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BodyHeatmap;
