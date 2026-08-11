import { iOSStorage } from '@/services/iOSStorageService';
/**
 * Token 用量服务
 * 获取本周 AI Token 总用量
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface WeeklyTokenUsage {
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  week_start: string;
  week_end: string;
}

/**
 * 获取本周 Token 总用量
 */
export const getWeeklyTokenUsage = async (): Promise<WeeklyTokenUsage | null> => {
  try {
    const token = iOSStorage.getItem('zenfit-token');
    const response = await fetch(`${API_BASE_URL}/api/ai/weekly-token-usage`, {
      headers: {
        'Authorization': `Bearer ${token || ''}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (data?.success) {
      return data.data;
    }
  } catch {
    console.log('[TokenUsageService] Backend does not support weekly token usage');
  }
  return null;
};

export const getWeeklyTokenTotal = async (fallbackTokens: number = 0): Promise<number> => {
  const usage = await getWeeklyTokenUsage();
  if (usage) {
    return usage.total_tokens;
  }
  return fallbackTokens;
};
