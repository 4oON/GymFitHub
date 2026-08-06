// API Types for ZenFit Backend

export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  weight?: number;
  height?: number;
  fitnessGoal?: 'lose_weight' | 'build_muscle' | 'maintain' | 'improve_endurance';
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfileInput {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  weight?: number;
  height?: number;
  fitnessGoal?: 'lose_weight' | 'build_muscle' | 'maintain' | 'improve_endurance';
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface UpdateProfileInput {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  weight?: number;
  height?: number;
  fitnessGoal?: 'lose_weight' | 'build_muscle' | 'maintain' | 'improve_endurance';
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface GetMeResponse {
  success: boolean;
  user: User;
}

export interface ApiError {
  error: string;
  details?: any;
}