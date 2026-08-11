import type { User, Profile, CreateProfileInput, UpdateProfileInput, AuthResponse, GetMeResponse, ApiError } from '../types/api';
import type {
  CreateWorkoutInput,
  UpdateWorkoutInput,
  GetWorkoutsResponse,
  GetWorkoutResponse,
  CreateWorkoutResponse,
  UpdateWorkoutResponse,
  DeleteWorkoutResponse
} from '../types/workout';
import type {
  CreateRoutineInput,
  UpdateRoutineInput,
  GetRoutinesResponse,
  GetRoutineResponse,
  CreateRoutineResponse,
  UpdateRoutineResponse,
  DeleteRoutineResponse
} from '../types/routine';
import { iOSStorage } from '@/services/iOSStorageService';
import type {
  HealthAuthorizationResponse,
  HealthSyncRequest,
  HealthSyncResponse,
  HealthDataListResponse,
  HealthDataResponse,
  WeightCalculationInput,
  WeightCalculationResponse,
  WeightTrendResponse,
  AutoSyncResponse
} from '../types/health';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'zenfit-token';

// 生产环境警告：检查API地址配置
if (import.meta.env.MODE === 'production' && API_BASE_URL.includes('localhost')) {
  console.error('⚠️ 生产环境使用了localhost API地址！请检查VITE_API_URL环境变量');
  console.error('当前API地址:', API_BASE_URL);
  console.error('期望API地址: https://kilo-zenfit-production.up.railway.app');
}

// 开发环境信息
if (import.meta.env.DEV) {
  console.log('🔧 开发模式 - API地址:', API_BASE_URL);
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = this.getToken();
  }

  // Token Management
  setToken(token: string): void {
    this.token = token;
    iOSStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = iOSStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  clearToken(): void {
    this.token = null;
    iOSStorage.removeItem(TOKEN_KEY);
  }

  // Private helper for making requests
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if token exists
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - auto logout
      if (response.status === 401) {
        this.clearToken();
        throw new Error('401: Unauthorized');
      }

      // Handle 404 Not Found - throw specific error
      if (response.status === 404) {
        throw new Error('404: Not Found');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Basic API
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/api/health');
  }

  async getUsers(): Promise<User[]> {
    return this.request('/api/auth/users');
  }

  // Authentication API
  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Auto-save token
    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Auto-save token
    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async getMe(): Promise<GetMeResponse> {
    return this.request('/api/auth/me');
  }

  logout(): { success: boolean; message: string } {
    this.clearToken();
    return { success: true, message: 'Logged out successfully' };
  }

  // Profile API
  async createProfile(data: CreateProfileInput): Promise<Profile> {
    return this.request('/api/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile(): Promise<Profile> {
    return this.request('/api/profile/me');
  }

  async updateProfile(data: UpdateProfileInput): Promise<Profile> {
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProfile(): Promise<{ message: string }> {
    return this.request('/api/profile', {
      method: 'DELETE',
    });
  }

  // Workout API
  async getWorkouts(status?: string): Promise<GetWorkoutsResponse> {
    const queryParam = status ? `?status=${status}` : '';
    return this.request(`/api/workout${queryParam}`);
  }

  async getWorkout(id: string): Promise<GetWorkoutResponse> {
    return this.request(`/api/workout/${id}`);
  }

  async createWorkout(data: CreateWorkoutInput): Promise<CreateWorkoutResponse> {
    return this.request('/api/workout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkout(id: string, data: UpdateWorkoutInput): Promise<UpdateWorkoutResponse> {
    return this.request(`/api/workout/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkout(id: string): Promise<DeleteWorkoutResponse> {
    return this.request(`/api/workout/${id}`, {
      method: 'DELETE',
    });
  }

  async batchSyncWorkouts(workouts: any[]): Promise<{
    success: boolean;
    stats: {
      total: number;
      created: number;
      skipped: number;
      failed: number;
    };
    createdWorkouts: any[];
    errors?: any[];
  }> {
    return this.request('/api/workout/batch-sync', {
      method: 'POST',
      body: JSON.stringify({ workouts }),
    });
  }

  // Routine API
  async getRoutines(): Promise<GetRoutinesResponse> {
    return this.request('/api/routine');
  }

  async getRoutine(id: string): Promise<GetRoutineResponse> {
    return this.request(`/api/routine/${id}`);
  }

  async createRoutine(data: CreateRoutineInput): Promise<CreateRoutineResponse> {
    return this.request('/api/routine', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRoutine(id: string, data: UpdateRoutineInput): Promise<UpdateRoutineResponse> {
    return this.request(`/api/routine/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRoutine(id: string): Promise<DeleteRoutineResponse> {
    return this.request(`/api/routine/${id}`, {
      method: 'DELETE',
    });
  }

  // Health Data API
  async getHealthAuthorization(): Promise<HealthAuthorizationResponse> {
    return this.request('/api/health/authorization');
  }

  async enableHealthSync(): Promise<HealthAuthorizationResponse> {
    return this.request('/api/health/enable', {
      method: 'POST',
    });
  }

  async disableHealthSync(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/health/disable', {
      method: 'POST',
    });
  }

  async syncHealthData(data: HealthSyncRequest): Promise<HealthSyncResponse> {
    return this.request('/api/health/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getHealthHistory(limit?: number, offset?: number): Promise<HealthDataListResponse> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const queryString = params.toString();
    return this.request(`/api/health/history${queryString ? `?${queryString}` : ''}`);
  }

  async getLatestHealthData(): Promise<HealthDataResponse> {
    return this.request('/api/health/latest');
  }

  async calculateRecommendedWeight(data: WeightCalculationInput): Promise<WeightCalculationResponse> {
    return this.request('/api/health/calculate-weight', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWeightTrend(days?: number): Promise<WeightTrendResponse> {
    const queryParam = days ? `?days=${days}` : '';
    return this.request(`/api/health/weight-trend${queryParam}`);
  }

  async enableAutoSync(): Promise<AutoSyncResponse> {
    return this.request('/api/health/auto-sync/enable', {
      method: 'POST',
    });
  }

  async disableAutoSync(): Promise<AutoSyncResponse> {
    return this.request('/api/health/auto-sync/disable', {
      method: 'POST',
    });
  }

  async checkAutoSync(): Promise<{ success: boolean; shouldSync: boolean; message: string }> {
    return this.request('/api/health/auto-sync/check');
  }

  // AI API
  async generateAIResponse(params: {
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
  }): Promise<{
    success: boolean;
    content: string;
    model?: string;
    provider?: string;
    usage?: any;
  }> {
    return this.request('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;