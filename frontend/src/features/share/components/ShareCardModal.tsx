/**
 * 分享卡片弹窗组件 - 修复版
 * 
 * 关键修复：
 * 1. 预览使用 scale transform，但生成时获取原始元素
 * 2. 使用隐藏的原尺寸元素进行截图，避免 transform 影响
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShareCardCanvas } from './ShareCardCanvas';
import { useShareImage } from '../hooks/useShareImage';
import { getWeeklyTokenTotal } from '../services/TokenUsageService';
import type { ShareCardData } from '../types';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareCardData;
  onShareSuccess?: () => void;
  language?: 'zh' | 'en';
}

type TabType = 'preview' | 'image';

// 内联图标组件
const Icons = {
  Close: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Image: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
    </svg>
  ),
  Share: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M23 4v6h-6M1 20v-6h6"/>
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
    </svg>
  ),
  Loader: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round"/>
    </svg>
  )
};

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  data,
  onShareSuccess,
  language: propLanguage
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('preview');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [weeklyTokenTotal, setWeeklyTokenTotal] = useState(data.tokenUsage?.total_tokens ?? 0);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  
  // 加载语言设置
  useEffect(() => {
    if (propLanguage) {
      setLanguage(propLanguage);
    } else {
      try {
        const savedLang = localStorage.getItem('zenfit_language') as 'zh' | 'en';
        if (savedLang) setLanguage(savedLang);
      } catch {}
    }
  }, [propLanguage, isOpen]);
  
  // 关键：使用两个 ref
  // previewRef - 用于预览（带 scale transform）
  // captureRef - 用于截图（隐藏的原尺寸元素）
  const previewRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  
  const { imageUrl, isGenerating, generateImage, clearImage } = useShareImage();
  
  // 获取本周 token 总量
  useEffect(() => {
    const fetchTokenUsage = async () => {
      const total = await getWeeklyTokenTotal(data.tokenUsage?.total_tokens ?? 0);
      setWeeklyTokenTotal(total);
    };
    if (isOpen) {
      fetchTokenUsage();
    }
  }, [isOpen, data.tokenUsage?.total_tokens]);

  const showToastMessage = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }, []);

  // 生成图片 - 使用隐藏的 capture 元素
  const handleGenerate = async () => {
    // 使用隐藏的 captureRef 而不是预览元素
    const captureElement = captureRef.current;
    if (!captureElement) {
      showToastMessage('生成元素未找到');
      return;
    }
    
    try {
      await generateImage(captureElement);
      setActiveTab('image');
    } catch (err) {
      showToastMessage('图片生成失败，请重试');
    }
  };

  // 下载图片
  const handleDownload = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `zenfit-weekly-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToastMessage('图片已保存到下载文件夹');
  };

  // 分享图片
  const handleShare = async () => {
    if (!imageUrl) return;
    
    try {
      if (navigator.share && navigator.canShare) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'zenfit-weekly.png', { type: 'image/png' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: '我的 ZenFit 训练周报',
            text: '看看我本周的训练成果！',
            files: [file]
          });
          onShareSuccess?.();
          return;
        }
      }
      
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      showToastMessage('图片已复制到剪贴板');
      onShareSuccess?.();
    } catch {
      showToastMessage('分享失败，请尝试截图保存');
    }
  };

  // 关闭时重置
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setActiveTab('preview');
      clearImage();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal - 修复：使用 right 定位避免 left 50% transform 偏移 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-lg overflow-hidden"
          >
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[70vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
                <h2 className="text-lg font-semibold text-white">分享训练周报</h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <Icons.Close />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-800 shrink-0">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === 'preview' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icons.Eye />
                  <span>预览</span>
                  {activeTab === 'preview' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                  )}
                </button>
                <button
                  onClick={() => imageUrl && setActiveTab('image')}
                  disabled={!imageUrl}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === 'image' ? 'text-emerald-400' : 
                    imageUrl ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Icons.Image />
                  <span>图片</span>
                  {activeTab === 'image' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-5">
                {activeTab === 'preview' ? (
                  <div className="flex flex-col items-center gap-4">
                    {/* Preview Card - Scaled down */}
                    <div className="rounded-xl overflow-hidden bg-slate-800/50" style={{ maxHeight: '50vh' }}>
                      <div style={{ transform: 'scale(0.75)', transformOrigin: 'center top' }}>
                        <ShareCardCanvas ref={previewRef} data={data} weeklyTokenTotal={weeklyTokenTotal} language={language} />
                      </div>
                    </div>
                    
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4)' }}
                    >
                      {isGenerating ? (
                        <>
                          <Icons.Loader />
                          <span>生成中...</span>
                        </>
                      ) : (
                        <>
                          <Icons.Image />
                          <span>生成分享图片</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-5">
                    {imageUrl ? (
                      <>
                        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-800">
                          <img 
                            src={imageUrl} 
                            alt="训练周报" 
                            className="max-w-full block"
                            style={{ maxHeight: '50vh' }}
                          />
                        </div>
                        
                        <div className="flex gap-3 w-full">
                          <button
                            onClick={handleDownload}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-500"
                          >
                            <Icons.Download />
                            <span>保存</span>
                          </button>
                          <button
                            onClick={handleShare}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-white bg-cyan-600 hover:bg-cyan-500"
                          >
                            <Icons.Share />
                            <span>分享</span>
                          </button>
                        </div>
                        
                        <button
                          onClick={handleGenerate}
                          className="flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400"
                        >
                          <Icons.Refresh />
                          <span>重新生成</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-10 text-slate-500">
                        <p>点击预览页的「生成分享图片」按钮</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* 隐藏的 Capture 元素 - 用于截图（原尺寸，无 transform） */}
          <div 
            style={{ 
              position: 'fixed', 
              left: '-9999px', 
              top: '-9999px',
              opacity: 0,
              pointerEvents: 'none',
              zIndex: -1
            }}
          >
            <ShareCardCanvas ref={captureRef} data={data} weeklyTokenTotal={weeklyTokenTotal} language={language} />
          </div>

          {/* Toast */}
          <AnimatePresence>
            {showToast && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-slate-800 text-white px-5 py-3 rounded-xl border border-slate-700"
              >
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareCardModal;
