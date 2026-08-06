/**
 * 分享卡片类型定义
 * Share Card Types
 */

export interface ShareCardHighlight {
  /** 标签 */
  label: string;
  /** 数值 */
  value: string;
  /** 类型 */
  type?: 'weight' | 'volume' | 'reps' | 'sets' | 'frequency' | 'other';
}

export interface ShareCardData {
  /** 训练天数 */
  workoutDays: number;
  /** 总组数 */
  totalSets: number;
  /** 总负荷 (kg) */
  totalVolume: number;
  /** 负荷等级 */
  volumeLevel: 'insufficient' | 'adequate' | 'optimal' | 'excessive';
  /** 负荷等级标签 */
  volumeLabel: string;
  /** 日期范围 */
  dateRange: string;
  /** 周数 */
  weekNumber?: number;
  /** 年份 */
  year?: number;
  /** AI Token使用量 */
  tokenUsage?: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
  /** AI成本 */
  estimatedCost?: {
    totalCost: number;
  };
  /** 是否AI生成 */
  isAIGenerated?: boolean;
  /** 训练肌肉 */
  trainedMuscles?: string[];
  /** 下周建议 */
  nextWeekRecommendations?: string[];
  /** AI评价 */
  overview?: string;
  /** 语言 */
  language?: 'zh' | 'en';
  /** 本周突破记录 */
  highlights?: ShareCardHighlight[];
}

export interface ShareCardProps {
  /** 分享数据 */
  data: ShareCardData;
  /** 是否显示 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 分享成功回调 */
  onShareSuccess?: () => void;
  /** 额外样式 */
  className?: string;
}

export interface ShareCardRef {
  /** 生成分享图片 */
  generateImage: () => Promise<string | null>;
  /** 获取卡片DOM元素 */
  getCardElement: () => HTMLElement | null;
}

/** 分享平台 */
export type SharePlatform = 'wechat' | 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'copy' | 'download';

export interface ShareOption {
  id: SharePlatform;
  label: string;
  labelEn: string;
  icon: string;
  color: string;
  bgColor: string;
}
