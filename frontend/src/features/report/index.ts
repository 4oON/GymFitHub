// Weekly Report Feature Exports

// Components
export { default as WeeklySummaryCard } from './components/WeeklySummaryCard';
export { default as WeeklySummaryModal } from './components/WeeklySummaryModal';
export { default as BodyHeatmap } from './components/BodyHeatmap';
export { default as WeeklyTrainingCoachCard } from './components/WeeklyTrainingCoachCard';
export { default as WeeklyTrainingCoachCardWithAI } from './components/WeeklyTrainingCoachCardWithAI';
export { default as RecommendedExerciseCard } from './components/RecommendedExerciseCard';
export { default as MuscleFeedbackModal } from './components/MuscleFeedbackModal';

// Services
export { default as WeeklySummaryService } from './services/WeeklySummaryService';
export { default as WeeklyTrainingCoachService } from './services/WeeklyTrainingCoachService';
export { default as MuscleFeedbackService } from './services/MuscleFeedbackService';

// Types
export type { AIWeeklySummary } from './services/WeeklySummaryService';
export type { 
  TrainingInsight, 
  WeeklyProgress, 
  CoachRecommendation,
  RecommendedExercise,
  ExerciseRecommendationGroup,
  NextSessionRecommendation
} from './services/WeeklyTrainingCoachService';
