/**
 * 用户类型定义
 */
export interface User {
  id: string;
  email: string;
  username?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API 响应类型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 健康检查响应
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  message: string;
  timestamp: string;
  uptime?: number;
  environment?: string;
}