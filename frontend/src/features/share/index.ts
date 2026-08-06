/**
 * 分享功能模块
 * Share Feature Module
 * 
 * 导出所有分享相关的组件和工具
 */

// 组件
export { ShareCardCanvas } from './components/ShareCardCanvas';
export { ShareCardModal } from './components/ShareCardModal';
export { ShareButton } from './components/ShareButton';

// Hooks
export { useShareImage } from './hooks/useShareImage';

// 工具函数
export { 
  fromAIWeeklySummary,
  fromWeeklyReport,
  fromSimpleData,
  transformToShareData
} from './utils/dataTransformer';

export {
  getWeeklyTokenUsage,
  getWeeklyTokenTotal
} from './services/TokenUsageService';

export {
  getColors,
  getNeonShadow,
  fontFamily,
  fontSize,
  borderRadius,
  spacing,
  shadows,
  shareCardStyles
} from './utils/shareCardStyles';

// 类型
export type {
  ShareCardData,
  ShareCardProps,
  ShareCardRef,
  SharePlatform,
  ShareOption
} from './types';

export type {
  WeeklyTokenUsage
} from './services/TokenUsageService';

// 默认导出
export { default } from './components/ShareCardModal';
