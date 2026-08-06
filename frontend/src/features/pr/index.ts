// PR (Personal Record) Feature Module

// Legacy exports (kept for compatibility)
export { default as PersonalRecordService } from './services/PersonalRecordService';
export { default as PRBadgeCard } from './components/PRBadgeCard';
export type { PersonalRecord, PRSummary } from './services/PersonalRecordService';

// New Achievement System
export { default as AchievementService } from './services/AchievementService';
export { default as AchievementHall } from './components/AchievementHall';
export type { Achievement, AchievementSummary } from './services/AchievementService';
