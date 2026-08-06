/**
 * Profile Types
 * 
 * Type definitions for user profile data
 */

export type Gender = 'male' | 'female' | 'other';

export type FitnessGoal = 
  | 'lose_weight' 
  | 'build_muscle' 
  | 'maintain' 
  | 'improve_endurance';

export type ExperienceLevel = 
  | 'beginner' 
  | 'intermediate' 
  | 'advanced';

export interface CreateProfileInput {
  age?: number;
  gender?: Gender;
  weight?: number;
  height?: number;
  fitnessGoal?: FitnessGoal;
  experienceLevel?: ExperienceLevel;
}

export interface UpdateProfileInput {
  age?: number;
  gender?: Gender;
  weight?: number;
  height?: number;
  fitnessGoal?: FitnessGoal;
  experienceLevel?: ExperienceLevel;
}

export interface ProfileResponse {
  id: string;
  userId: string;
  age?: number;
  gender?: Gender;
  weight?: number;
  height?: number;
  fitnessGoal?: FitnessGoal;
  experienceLevel?: ExperienceLevel;
  createdAt: Date;
  updatedAt: Date;
}