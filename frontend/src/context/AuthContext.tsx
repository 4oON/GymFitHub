import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import apiClient from '../services/apiClient';
import type { User } from '../types/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-fetch user on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const token = apiClient.getToken();
      if (token) {
        try {
          // 直接调用 API 而不是依赖外部函数，避免依赖问题
          const response = await apiClient.getMe();
          setUser(response.user);
        } catch (error) {
          console.error('Failed to refresh user:', error);
          apiClient.clearToken();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []); // 空依赖数组是安全的，因为我们只在组件挂载时运行一次

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.login(email, password);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.register(email, password);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.getMe();
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};