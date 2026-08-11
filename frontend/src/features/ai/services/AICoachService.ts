import { iOSStorage } from '@/services/iOSStorageService';
/**
 * AI Coach Service
 * 
 * 前端API客户端，用于与AI教练后端API通信
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface AICoachConversation {
  id: string;
  title: string;
  context: Record<string, any>;
  lastMessageAt: string;
  createdAt: string;
  _count?: { messages: number };
}

export interface AICoachMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type: 'text' | 'routine_suggestion' | 'exercise_suggestion';
  metadata?: Record<string, any>;
  createdAt: string;
  generatedTitle?: string; // AI generated title for the conversation (only on first message)
}

export interface AICustomRoutine {
  id: string;
  conversationId: string;
  name: string;
  description?: string;
  focusMuscles: string[];
  routineType: 'compound_focus' | 'isolation_focus' | 'balanced' | 'custom';
  exercises: AICustomExercise[];
  estimatedDuration?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  isSaved: boolean;
  isUsed: boolean;
  createdAt: string;
}

export interface AICustomExercise {
  name: string;
  nameZh: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restSeconds: number;
  exerciseType: 'compound' | 'isolation';
  tips: string;
}

export interface ConversationDetail extends AICoachConversation {
  messages: AICoachMessage[];
  routines: AICustomRoutine[];
  preferredConfigId?: string;
}

export interface SendMessageRequest {
  content: string;
  contextData?: {
    recentWorkouts?: any[];
    muscleRecovery?: any[];
    userProfile?: any;
    exerciseLibrary?: any[];
  };
}

export interface GenerateRoutineRequest {
  focusMuscles: string[];
  routineType: 'compound_focus' | 'isolation_focus' | 'balanced' | 'custom';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;
  preferences?: string;
}

// Helper to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = iOSStorage.getItem('zenfit-token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * 创建新对话
 */
export const createConversation = async (title?: string): Promise<AICoachConversation> => {
  const response = await fetch(`${API_BASE_URL}/api/ai/coach/conversations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title: (title && title.trim()) || '' }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to create conversation');
  }
  return data.data;
};

/**
 * 获取用户的所有对话
 */
export const getConversations = async (): Promise<AICoachConversation[]> => {
  const response = await fetch(`${API_BASE_URL}/api/ai/coach/conversations`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to get conversations');
  }
  return data.data;
};

/**
 * 获取单个对话详情
 */
export const getConversation = async (conversationId: string): Promise<ConversationDetail> => {
  const response = await fetch(`${API_BASE_URL}/api/ai/coach/conversations/${conversationId}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to get conversation');
  }
  return data.data;
};

/**
 * 发送消息
 */
export const sendMessage = async (
  conversationId: string,
  request: SendMessageRequest
): Promise<AICoachMessage> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120秒超时 - AI处理可能需要较长时间

  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/coach/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || data.message || `Server error ${response.status}`);
    }
    return data.data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw error;
  }
};

export interface AICoachStreamResult {
  messageId: string;
  content: string;
  model: string;
  provider: string;
  durationMs: number;
  generatedTitle?: string | null;
  createdAt: string;
}

/**
 * 流式发送消息（SSE）
 * 逐块回调 onDelta，结束后回调 onDone（含完整消息），出错回调 onError。
 */
export const sendMessageStream = async (
  conversationId: string,
  request: SendMessageRequest,
  onDelta: (text: string) => void,
  onDone: (result: AICoachStreamResult) => void,
  onError: (error: Error) => void
): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120秒超时

  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/coach/conversations/${conversationId}/messages/stream`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Server error ${response.status}`);
    }
    if (!response.body) {
      throw new Error('Response body is not readable');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE events separated by blank line
      let sepIndex: number;
      while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
        const eventText = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);
        handleSSEEvent(eventText, onDelta, onDone, onError);
      }
    }
    // Flush trailing event without blank-line terminator
    if (buffer.trim()) {
      handleSSEEvent(buffer, onDelta, onDone, onError);
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      onError(new Error('Request timeout - please try again'));
    } else {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
};

function handleSSEEvent(
  eventText: string,
  onDelta: (text: string) => void,
  onDone: (result: AICoachStreamResult) => void,
  onError: (error: Error) => void
): void {
  for (const line of eventText.split('\n')) {
    const trimmed = line.replace(/\r$/, '');
    if (!trimmed.startsWith('data:')) continue;
    const data = trimmed.slice(5).trim();
    if (!data) continue;
    try {
      const json = JSON.parse(data);
      if (json.error) {
        onError(new Error(json.error));
        return;
      }
      if (typeof json.delta === 'string') {
        onDelta(json.delta);
        return;
      }
      if (json.done) {
        onDone({
          messageId: json.messageId,
          content: json.content || '',
          model: json.model,
          provider: json.provider,
          durationMs: json.durationMs,
          generatedTitle: json.generatedTitle,
          createdAt: json.createdAt,
        });
        return;
      }
    } catch {
      // Ignore malformed lines
    }
  }
}

/**
 * 生成客制化训练计划
 */
export const generateRoutine = async (
  conversationId: string,
  request: GenerateRoutineRequest
): Promise<AICustomRoutine> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120秒超时（AI生成可能需要时间）

  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/coach/conversations/${conversationId}/routines`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate routine');
    }
    return data.data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Generation timeout - please try again');
    }
    throw error;
  }
};

/**
 * 获取用户的AI推荐训练计划
 */
export const getRoutines = async (includeUsed: boolean = false): Promise<AICustomRoutine[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/ai/coach/routines?includeUsed=${includeUsed}`,
    { headers: getAuthHeaders() }
  );

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to get routines');
  }
  return data.data;
};

/**
 * 保存训练计划
 */
export const saveRoutine = async (routineId: string): Promise<AICustomRoutine> => {
  const response = await fetch(`${API_BASE_URL}/api/ai/coach/routines/${routineId}/save`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to save routine');
  }
  return data.data;
};

/**
 * 标记训练计划为已使用
 */
export const markRoutineAsUsed = async (routineId: string): Promise<AICustomRoutine> => {
  const response = await fetch(`${API_BASE_URL}/api/ai/coach/routines/${routineId}/use`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to mark routine as used');
  }
  return data.data;
};

/**
 * 删除对话
 */
export const deleteConversation = async (conversationId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/ai/coach/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to delete conversation');
  }
};

/**
 * 更新对话标题
 */
export const updateConversationTitle = async (
  conversationId: string,
  title: string
): Promise<AICoachConversation> => {
  const response = await fetch(`${API_BASE_URL}/api/ai/coach/conversations/${conversationId}/title`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to update conversation title');
  }
  return data.data;
};

/**
 * 设置当前对话 preferred AI 配置
 */
export const setConversationModel = async (
  conversationId: string,
  configId: string
): Promise<AICoachConversation> => {
  const response = await fetch(`${API_BASE_URL}/api/ai/coach/conversations/${conversationId}/model`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ configId }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to set conversation model');
  }
  return data.data;
};

// Default export
const AICoachService = {
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  sendMessageStream,
  generateRoutine,
  getRoutines,
  saveRoutine,
  markRoutineAsUsed,
  deleteConversation,
  updateConversationTitle,
  setConversationModel,
};

export default AICoachService;
