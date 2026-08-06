/**
 * 分享卡片演示页面
 * Share Card Demo Page - 用于测试和预览分享卡片效果
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Share2,
  RefreshCw,
  Calendar,
  Dumbbell,
  Zap,
  TrendingUp,
  Cpu,
  Sparkles,
  Trophy
} from 'lucide-react';
import { ShareButton, ShareCardModal, fromSimpleData } from '@/features/share';
import type { ShareCardData } from '@/features/share';

// 模拟数据
const mockShareData: ShareCardData = {
  workoutDays: 3,
  totalSets: 66,
  totalVolume: 41508,
  volumeLevel: 'excessive',
  volumeLabel: '过量',
  dateRange: '2026-03-16 ~ 2026-03-22',
  weekNumber: 12,
  year: 2026,
  isAIGenerated: true,
  tokenUsage: {
    total_tokens: 15420,
    prompt_tokens: 12300,
    completion_tokens: 3120
  },
  estimatedCost: {
    totalCost: 0.15
  },
  overview: '本周训练3天，总负荷41508kg，较上周增长67.9%。训练强度较高，建议适当休息恢复。',
  language: 'zh',
  highlights: [
    { label: '杠铃卧推 最大重量', value: '85 kg', type: 'weight' },
    { label: '胸部 总容量', value: '12.5t', type: 'volume' },
    { label: '训练频率提升', value: '+1 天', type: 'frequency' },
    { label: '总容量增长', value: '+68%', type: 'volume' }
  ]
};

// 英文模拟数据
const mockShareDataEn: ShareCardData = {
  ...mockShareData,
  volumeLabel: 'High',
  overview: 'Trained 3 days this week with a total load of 41,508kg, up 67.9% from last week. High intensity, rest recommended.',
  language: 'en'
};

const ShareCardDemoPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [data, setData] = useState<ShareCardData>(mockShareData);

  const toggleLanguage = () => {
    const newLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
    setData(newLang === 'zh' ? mockShareData : mockShareDataEn);
  };

  const regenerateData = () => {
    // 随机生成一些变化
    const days = Math.floor(Math.random() * 5) + 1;
    const sets = days * Math.floor(Math.random() * 20 + 10);
    const volume = sets * Math.floor(Math.random() * 500 + 300);
    const maxWeight = Math.floor(Math.random() * 60) + 60; // 60-120kg
    const muscleVolume = (volume * (0.3 + Math.random() * 0.4) / 1000).toFixed(1); // 该肌肉占总容量30-70%
    const frequencyChange = Math.floor(Math.random() * 3) + 1; // +1 to +3 days
    const volumeChange = Math.floor(Math.random() * 50) + 20; // +20% to +70%
    
    const exercises = ['杠铃卧推', '深蹲', '硬拉', '肩推', '划船', '腿举'];
    const muscles = ['胸部', '背部', '腿部', '肩部', '手臂'];
    const randomExercise = exercises[Math.floor(Math.random() * exercises.length)];
    const randomMuscle = muscles[Math.floor(Math.random() * muscles.length)];
    
    setData(prev => ({
      ...prev,
      workoutDays: days,
      totalSets: sets,
      totalVolume: volume,
      highlights: [
        { label: `${randomExercise} 最大重量`, value: `${maxWeight} kg`, type: 'weight' },
        { label: `${randomMuscle} 总容量`, value: `${muscleVolume}t`, type: 'volume' },
        { label: '训练频率提升', value: `+${frequencyChange} 天`, type: 'frequency' },
        { label: '总容量增长', value: `+${volumeChange}%`, type: 'volume' }
      ],
      tokenUsage: {
        total_tokens: Math.floor(Math.random() * 20000) + 5000,
        prompt_tokens: Math.floor(Math.random() * 15000) + 3000,
        completion_tokens: Math.floor(Math.random() * 5000) + 1000
      }
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => window.history.back()}
            className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors active:scale-95"
            style={{ touchAction: 'manipulation' }}
          >
            <ArrowLeft size={20} className="text-slate-300" />
          </button>

          <h1 className="text-lg font-bold text-white">
            Share Card Demo
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-300 font-medium"
              style={{ touchAction: 'manipulation' }}
            >
              {language === 'zh' ? 'EN' : '中'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 pb-32">
        {/* 预览卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden"
        >
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Share2 size={18} className="text-emerald-400" />
              {language === 'zh' ? '分享卡片预览' : 'Share Card Preview'}
            </h2>
          </div>
          
          <div className="p-6 flex justify-center bg-slate-950/50">
            {/* 缩小显示卡片 - 新布局 */}
            <div className="transform scale-75 origin-top">
              <div className="w-[375px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-6 border border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                      <Zap size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">ZenFit</div>
                      <div className="text-[9px] text-slate-500">
                        {language === 'zh' ? 'AI 智能训练' : 'AI Training'}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600">{data.dateRange}</div>
                </div>

                {/* Title */}
                <div className="mb-4">
                  <div className="text-[11px] text-emerald-400 font-semibold mb-1 flex items-center gap-1">
                    <Sparkles size={11} />
                    {language === 'zh' ? '本周训练总结' : 'Weekly Summary'}
                  </div>
                  <div className="text-xl font-extrabold text-white">
                    {language === 'zh' ? '训练数据' : 'Workout Stats'}
                  </div>
                </div>

                {/* 本周突破 - 焦点区域 */}
                {data.highlights && data.highlights.length > 0 && (
                  <div className="bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-slate-900 rounded-2xl border border-emerald-500/25 p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <Trophy size={14} className="text-emerald-400" />
                      </div>
                      <span className="text-sm font-bold text-emerald-400">
                        {language === 'zh' ? '本周突破' : 'Weekly PRs'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {data.highlights.slice(0, 4).map((highlight, idx) => (
                        <div key={idx} className="bg-slate-950/60 rounded-xl px-3 py-3 flex flex-col">
                          <span className="text-[10px] text-slate-500 mb-1 truncate">{highlight.label}</span>
                          <span className="text-base font-bold text-emerald-400">{highlight.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 核心数据 - 单行紧凑 */}
                <div className="flex items-center justify-between bg-slate-800/40 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-blue-400" />
                    <div>
                      <div className="text-base font-bold text-white leading-none">{data.workoutDays}</div>
                      <div className="text-[9px] text-slate-500">{language === 'zh' ? '天' : 'Days'}</div>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-slate-700" />
                  <div className="flex items-center gap-2">
                    <Dumbbell size={13} className="text-emerald-400" />
                    <div>
                      <div className="text-base font-bold text-white leading-none">{data.totalSets}</div>
                      <div className="text-[9px] text-slate-500">{language === 'zh' ? '组' : 'Sets'}</div>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-slate-700" />
                  <div className="flex items-center gap-2">
                    <Zap size={13} className="text-cyan-400" />
                    <div>
                      <div className="text-base font-bold text-white leading-none">
                        {data.totalVolume >= 1000 ? `${(data.totalVolume / 1000).toFixed(1)}t` : data.totalVolume}
                      </div>
                      <div className="text-[9px] text-slate-500">{language === 'zh' ? '负荷' : 'Vol'}</div>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-slate-700" />
                  <div className="flex items-center gap-2">
                    <TrendingUp size={13} className="text-rose-400" />
                    <div>
                      <div className="text-sm font-bold text-rose-400 leading-none">{data.volumeLabel}</div>
                      <div className="text-[9px] text-slate-500">{language === 'zh' ? '等级' : 'Lvl'}</div>
                    </div>
                  </div>
                </div>

                {/* AI Overview */}
                <div className="bg-emerald-500/8 rounded-xl p-3 border border-emerald-500/15 mb-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles size={11} className="text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      {language === 'zh' ? 'AI 教练评价' : 'AI Coach'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{data.overview}</p>
                </div>

                {/* Token Usage */}
                <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Cpu size={16} className="text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-white">{data.tokenUsage?.total_tokens.toLocaleString()}</div>
                        <div className="text-[9px] text-slate-500">tokens</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-emerald-400">¥{data.estimatedCost?.totalCost.toFixed(2)}</div>
                      <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-400/60">
                        <Sparkles size={9} />
                        <span>AI</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-600">
                    {language === 'zh' ? '由 ZenFit AI 生成' : 'Generated by ZenFit AI'}
                  </span>
                  <span className="text-[9px] text-slate-700">zenfit.app</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 分享按钮展示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden"
        >
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-white font-bold">
              {language === 'zh' ? '分享按钮样式' : 'Share Button Styles'}
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Default */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Default</span>
              <ShareButton data={data} variant="default" />
            </div>

            {/* Minimal */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Minimal</span>
              <ShareButton data={data} variant="minimal" />
            </div>

            {/* Floating */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Floating</span>
              <ShareButton data={data} variant="floating" />
            </div>

            {/* With Label */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">With Label</span>
              <ShareButton 
                data={data} 
                variant="default" 
                label={language === 'zh' ? '分享成果' : 'Share Result'} 
              />
            </div>
          </div>
        </motion.div>

        {/* 直接打开弹窗 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden"
        >
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-white font-bold">
              {language === 'zh' ? '直接打开弹窗' : 'Open Modal Directly'}
            </h2>
          </div>
          
          <div className="p-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-white font-semibold transition-all active:scale-95"
              style={{ touchAction: 'manipulation' }}
            >
              {language === 'zh' ? '打开分享弹窗' : 'Open Share Modal'}
            </button>
          </div>
        </motion.div>

        {/* 数据控制 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden"
        >
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-white font-bold">
              {language === 'zh' ? '数据控制' : 'Data Control'}
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            <button
              onClick={regenerateData}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2 active:scale-95"
              style={{ touchAction: 'manipulation' }}
            >
              <RefreshCw size={18} />
              {language === 'zh' ? '随机生成数据' : 'Randomize Data'}
            </button>

            {/* 当前数据展示 */}
            <div className="bg-slate-950 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Workout Days:</span>
                <span className="text-white font-mono">{data.workoutDays}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Sets:</span>
                <span className="text-white font-mono">{data.totalSets}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Volume:</span>
                <span className="text-white font-mono">{data.totalVolume.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tokens:</span>
                <span className="text-white font-mono">{data.tokenUsage?.total_tokens.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 分享弹窗 */}
      <ShareCardModal
        data={data}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onShareSuccess={() => {
          console.log('分享成功');
        }}
      />
    </div>
  );
};

export default ShareCardDemoPage;
