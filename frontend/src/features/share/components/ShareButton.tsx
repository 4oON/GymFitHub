/**
 * 分享按钮组件
 * Share Button - 可复用的分享按钮，支持在任意报告组件中集成
 * 
 * 使用示例：
 * <ShareButton 
 *   data={shareCardData}
 *   onShareSuccess={() => console.log('分享成功')}
 * />
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import ShareCardModal from './ShareCardModal';
import type { ShareCardData } from '../types';

interface ShareButtonProps {
  /** 分享数据 */
  data: ShareCardData;
  /** 按钮样式变体 */
  variant?: 'default' | 'minimal' | 'floating';
  /** 按钮大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 分享成功回调 */
  onShareSuccess?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 自定义标签 */
  label?: string;
  /** 语言 */
  language?: 'zh' | 'en';
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  data,
  variant = 'default',
  size = 'md',
  onShareSuccess,
  className = '',
  label,
  language = 'zh'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // 尺寸配置
  const sizeConfig = {
    sm: { button: 'w-8 h-8', icon: 14 },
    md: { button: 'w-10 h-10', icon: 18 },
    lg: { button: 'w-12 h-12', icon: 22 }
  };

  // 变体样式
  const getVariantStyles = () => {
    switch (variant) {
      case 'minimal':
        return 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white';
      case 'floating':
        return 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30';
      default:
        return 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700';
    }
  };

  const defaultLabel = language === 'zh' ? '分享' : 'Share';

  return (
    <>
      {variant === 'floating' ? (
        // 浮动按钮
        <motion.button
          onClick={handleOpenModal}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`${sizeConfig[size].button} rounded-full ${getVariantStyles()} flex items-center justify-center transition-colors ${className}`}
          style={{ touchAction: 'manipulation' }}
        >
          <Share2 size={sizeConfig[size].icon} />
        </motion.button>
      ) : label ? (
        // 带文字按钮
        <motion.button
          onClick={handleOpenModal}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${getVariantStyles()} transition-colors font-medium text-sm ${className}`}
          style={{ touchAction: 'manipulation' }}
        >
          <Share2 size={sizeConfig[size].icon} />
          <span>{label || defaultLabel}</span>
        </motion.button>
      ) : (
        // 图标按钮
        <motion.button
          onClick={handleOpenModal}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`${sizeConfig[size].button} rounded-xl ${getVariantStyles()} flex items-center justify-center transition-colors ${className}`}
          style={{ touchAction: 'manipulation' }}
        >
          <Share2 size={sizeConfig[size].icon} />
        </motion.button>
      )}

      {/* 分享弹窗 */}
      <ShareCardModal
        data={data}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        language={language}
      />
    </>
  );
};

export default ShareButton;
