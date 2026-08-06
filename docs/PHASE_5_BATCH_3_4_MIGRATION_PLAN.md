# Phase 5 Batch 3 & 4: Detailed Migration Plan

**Date**: 2025-12-02  
**Status**: Planning Phase - No Code Changes Yet

---

## 📋 Overview

This document provides detailed step-by-step migration plans for:
- **Batch 3**: Report Components → `src/features/report/components/`
- **Batch 4**: Workout Components → `src/features/workout/components/`

Each batch is broken down into small, manageable steps (3-5 files per step) with clear commit points.

---

## 🎯 Batch 3: Report Components Migration

### Target Structure

```
src/features/report/
├── components/                    ← NEW
│   ├── WorkoutReportModal.tsx    ← from components/
│   ├── WorkoutReport.tsx         ← from components/
│   ├── ProgressView.tsx          ← from components/
│   ├── WeeklyReportViewer.tsx    ← from components/
│   └── WeeklyReportComparison.tsx ← from components/
└── services/                      (Already exists from Batch 2)
    ├── WeeklyReportService.ts
    ├── ReportStorageService.ts
    └── CalorieCalculationService.ts
```

### File Analysis

#### 1. WorkoutReportModal.tsx (611 lines)
**Dependencies:**
- Types: `WorkoutSession`, `UserProfile`, `MuscleGroup` from `../types`
- Services: 
  - `calculateAdvancedCalories` from `../src/features/report/services/CalorieCalculationService`
  - `exportHolographicJSON` from `../src/features/export/services/JSONExportService`
  - `generateWorkoutPDF` from `../src/features/export/services/PDFExportService`
  - `exerciseNameMapping` from `../services/ExerciseNameMappingService`
- Constants: `MUSCLE_COLORS`, `getMuscleColor` from `../src/features/anatomy/constants/muscleColors`
- External: `recharts` library

**Import Changes Needed:**
- Types: `../types` → `../../../shared/types`
- CalorieCalculationService: `../src/features/report/services/` → `../services/`
- Export services: `../src/features/export/services/` → `../../export/services/`
- ExerciseNameMappingService: `../services/` → `../../../services/` (not yet migrated)
- Anatomy constants: `../src/features/anatomy/constants/` → `../../anatomy/constants/`

#### 2. WorkoutReport.tsx (174 lines)
**Dependencies:**
- Types: `WorkoutSession`, `MuscleGroup` from `../types`
- External: `recharts` library

**Import Changes Needed:**
- Types: `../types` → `../../../shared/types`

#### 3. ProgressView.tsx (529 lines)
**Dependencies:**
- Types: `MuscleGroup`, `RecoveryStatus`, `WorkoutSession`, `ActiveExercise` from `../types`
- Hooks: `usePDFExport` from `../src/features/export/hooks/usePDFExport`
- Components: `WorkoutReportModal` from `./WorkoutReportModal`
- Constants: `MUSCLE_COLORS`, `getMuscleColor`, `LEGACY_COLORS` from `../src/features/anatomy/constants/muscleColors`
- Services: `calculateAdvancedCalories` from `../src/features/report/services/CalorieCalculationService`
- External: `recharts` library

**Import Changes Needed:**
- Types: `../types` → `../../../shared/types`
- usePDFExport: `../src/features/export/hooks/` → `../../export/hooks/`
- WorkoutReportModal: `./WorkoutReportModal` → `./WorkoutReportModal` (same directory)
- Anatomy constants: `../src/features/anatomy/constants/` → `../../anatomy/constants/`
- CalorieCalculationService: `../src/features/report/services/` → `../services/`

#### 4. WeeklyReportViewer.tsx (492 lines)
**Dependencies:**
- Types: `WeeklyReport` from `../types`
- Services:
  - `reportStorage` from `../src/features/report/services/ReportStorageService`
  - `generateWeeklyReportSVG`, `exportWeeklyReportSVG` from `../src/features/export/services/SVGExportService`
  - `generateVectorWeeklyReportPDF` from `../src/features/export/services/VectorPDFExportService`
  - `exportSocialPNG`, `sharePNG` from `../src/features/export/services/PNGExportService`
  - `exportWeeklyReportJSON`, `exportAllReportsJSON` from `../src/features/export/services/JSONExportService`
- Components: `WeeklyReportComparison` from `./WeeklyReportComparison`

**Import Changes Needed:**
- Types: `../types` → `../../../shared/types`
- ReportStorageService: `../src/features/report/services/` → `../services/`
- Export services: `../src/features/export/services/` → `../../export/services/`
- WeeklyReportComparison: `./WeeklyReportComparison` → `./WeeklyReportComparison` (same directory)

#### 5. WeeklyReportComparison.tsx (390 lines)
**Dependencies:**
- Types: `WeeklyReport`, `MuscleGroup` from `../types`
- Services: `reportStorage` from `../src/features/report/services/ReportStorageService`

**Import Changes Needed:**
- Types: `../types` → `../../../shared/types`
- ReportStorageService: `../src/features/report/services/` → `../services/`

---

### Batch 3 Migration Steps

#### **Step 3.1: Migrate Simple Report Components (2 files)**

**Files to Move:**
1. `components/WorkoutReport.tsx` → `src/features/report/components/WorkoutReport.tsx`
2. `components/WeeklyReportComparison.tsx` → `src/features/report/components/WeeklyReportComparison.tsx`

**Rationale**: These have the fewest dependencies and no cross-component imports within the batch.

**Actions:**
1. Create directory: `src/features/report/components/`
2. Move `WorkoutReport.tsx`
3. Move `WeeklyReportComparison.tsx`
4. Update imports in both files:
   - Types: `../types` → `../../../shared/types`
   - ReportStorageService (WeeklyReportComparison only): `../src/features/report/services/` → `../services/`

**Files Needing Import Updates:**
- `src/App.tsx` (if it imports WorkoutReport - check needed)
- No other files import these directly

**Commit Point**: ✅ "Phase 5 Batch 3.1: Migrate WorkoutReport and WeeklyReportComparison components"

---

#### **Step 3.2: Migrate WeeklyReportViewer (1 file)**

**Files to Move:**
1. `components/WeeklyReportViewer.tsx` → `src/features/report/components/WeeklyReportViewer.tsx`

**Actions:**
1. Move `WeeklyReportViewer.tsx`
2. Update imports:
   - Types: `../types` → `../../../shared/types`
   - ReportStorageService: `../src/features/report/services/` → `../services/`
   - Export services: `../src/features/export/services/` → `../../export/services/`
   - WeeklyReportComparison: `./WeeklyReportComparison` → `./WeeklyReportComparison` (already in same directory)

**Files Needing Import Updates:**
- `src/App.tsx` (likely imports this for weekly report viewing)

**Commit Point**: ✅ "Phase 5 Batch 3.2: Migrate WeeklyReportViewer component"

---

#### **Step 3.3: Migrate WorkoutReportModal (1 file)**

**Files to Move:**
1. `components/WorkoutReportModal.tsx` → `src/features/report/components/WorkoutReportModal.tsx`

**Actions:**
1. Move `WorkoutReportModal.tsx`
2. Update imports:
   - Types: `../types` → `../../../shared/types`
   - CalorieCalculationService: `../src/features/report/services/` → `../services/`
   - Export services: `../src/features/export/services/` → `../../export/services/`
   - ExerciseNameMappingService: `../services/` → `../../../services/` (not yet migrated)
   - Anatomy constants: `../src/features/anatomy/constants/` → `../../anatomy/constants/`

**Files Needing Import Updates:**
- `components/ProgressView.tsx` (imports WorkoutReportModal)

**Commit Point**: ✅ "Phase 5 Batch 3.3: Migrate WorkoutReportModal component"

---

#### **Step 3.4: Migrate ProgressView and Update App.tsx (2 files)**

**Files to Move:**
1. `components/ProgressView.tsx` → `src/features/report/components/ProgressView.tsx`

**Actions:**
1. Move `ProgressView.tsx`
2. Update imports in ProgressView:
   - Types: `../types` → `../../../shared/types`
   - usePDFExport: `../src/features/export/hooks/` → `../../export/hooks/`
   - WorkoutReportModal: `./WorkoutReportModal` → `./WorkoutReportModal` (already in same directory)
   - Anatomy constants: `../src/features/anatomy/constants/` → `../../anatomy/constants/`
   - CalorieCalculationService: `../src/features/report/services/` → `../services/`
3. Update `src/App.tsx`:
   - ProgressView: `../components/ProgressView` → `./features/report/components/ProgressView`
   - WeeklyReportViewer: `../components/WeeklyReportViewer` → `./features/report/components/WeeklyReportViewer`

**Commit Point**: ✅ "Phase 5 Batch 3.4: Migrate ProgressView and update App.tsx imports"

---

### Batch 3 Summary

**Total Files Moved**: 5  
**Total Files Modified**: 6 (5 moved + 1 App.tsx)  
**New Directories**: 1 (`src/features/report/components/`)  
**Commit Points**: 4

**Migration Map:**
```
components/WorkoutReport.tsx           → src/features/report/components/WorkoutReport.tsx
components/WeeklyReportComparison.tsx  → src/features/report/components/WeeklyReportComparison.tsx
components/WeeklyReportViewer.tsx      → src/features/report/components/WeeklyReportViewer.tsx
components/WorkoutReportModal.tsx      → src/features/report/components/WorkoutReportModal.tsx
components/ProgressView.tsx            → src/features/report/components/ProgressView.tsx
```

---

## 🏋️ Batch 4: Workout Components Migration

### Target Structure

```
src/features/workout/
└── components/                        ← NEW
    ├── WorkoutScenarioTester.tsx     ← from components/
    ├── WorkoutLogger.tsx             ← from components/
    ├── InProgressWorkout.tsx         ← from components/
    ├── SwipeableCard.tsx             ← from components/
    └── GlobalTimer.tsx               ← from components/
```

### File Analysis

#### 1. WorkoutScenarioTester.tsx (366 lines)
**Dependencies:**
- Types: `MuscleGroup` from `../types`
- Functions: `getMuscleDisplayName` from `../src/features/anatomy/constants/musclePaths`
- Components: `MuscleAnatomyViewer` from `../src/features/anatomy/components/MuscleAnatomyViewer`

**Import Changes Needed:**
- Types: `../types` → `../../../shared/types`
- musclePaths: `../src/features/anatomy/constants/` → `../../anatomy/constants/`
- MuscleAnatomyViewer: `../src/features/anatomy/components/` → `../../anatomy/components/`

#### 2. WorkoutLogger.tsx (497 lines)
**Dependencies:**
- Types: `ActiveExercise`, `WorkoutSet`, `TimerState`, `Exercise`, `UserProfile` from `../types`
- Components: 
  - `VideoPlayer` from `./VideoPlayer` (not in this batch)
  - `SwipeableCard` from `./SwipeableCard` (in this batch)
- Services: 
  - `getExerciseTips`, `getExerciseRecommendation` from `../services/geminiService` (not yet migrated)

**Import Changes Needed:**
- Types: `../types` → `../../../shared/types`
- VideoPlayer: `./VideoPlayer` → `../../../components/VideoPlayer` (not yet migrated)
- SwipeableCard: `./SwipeableCard` → `./SwipeableCard` (same directory)
- geminiService: `../services/` → `../../../services/` (not yet migrated)

#### 3. InProgressWorkout.tsx (653 lines)
**Dependencies:**
- Types: `ActiveExercise`, `WorkoutSet`, `Exercise`, `UserProfile` from `../types`
- Components:
  - `VideoPlayer` from `./VideoPlayer` (not in this batch)
  - `SwipeableCard` from `./SwipeableCard` (in this batch)
- Services:
  - `getExerciseTips`, `getExerciseRecommendation` from `../services/geminiService` (not yet migrated)

**Import Changes Needed:**
- Types: `../types` → `../../../shared/types`
- VideoPlayer: `./VideoPlayer` → `../../../components/VideoPlayer` (not yet migrated)
- SwipeableCard: `./SwipeableCard` → `./SwipeableCard` (same directory)
- geminiService: `../services/` → `../../../services/` (not yet migrated)

#### 4. SwipeableCard.tsx (124 lines)
**Dependencies:**
- None (pure React component)

**Import Changes Needed:**
- None

#### 5. GlobalTimer.tsx (163 lines)
**Dependencies:**
- Types: `TimerState`, `AppScreen` from `../types`

**Import Changes Needed:**
- Types: `../types` → `../../../shared/types`

---

### Batch 4 Migration Steps

#### **Step 4.1: Migrate Utility Components (2 files)**

**Files to Move:**
1. `components/SwipeableCard.tsx` → `src/features/workout/components/SwipeableCard.tsx`
2. `components/GlobalTimer.tsx` → `src/features/workout/components/GlobalTimer.tsx`

**Rationale**: These are utility components with minimal dependencies. SwipeableCard has no dependencies, GlobalTimer only needs types.

**Actions:**
1. Create directory: `src/features/workout/components/`
2. Move `SwipeableCard.tsx` (no import changes needed)
3. Move `GlobalTimer.tsx`
4. Update imports in GlobalTimer:
   - Types: `../types` → `../../../shared/types`

**Files Needing Import Updates:**
- `components/WorkoutLogger.tsx` (imports SwipeableCard)
- `components/InProgressWorkout.tsx` (imports SwipeableCard)
- `src/App.tsx` (likely imports GlobalTimer)

**Commit Point**: ✅ "Phase 5 Batch 4.1: Migrate SwipeableCard and GlobalTimer utility components"

---

#### **Step 4.2: Migrate WorkoutLogger (1 file)**

**Files to Move:**
1. `components/WorkoutLogger.tsx` → `src/features/workout/components/WorkoutLogger.tsx`

**Actions:**
1. Move `WorkoutLogger.tsx`
2. Update imports:
   - Types: `../types` → `../../../shared/types`
   - VideoPlayer: `./VideoPlayer` → `../../../components/VideoPlayer`
   - SwipeableCard: `./SwipeableCard` → `./SwipeableCard` (already in same directory)
   - geminiService: `../services/` → `../../../services/`

**Files Needing Import Updates:**
- `src/App.tsx` (if it imports WorkoutLogger directly)

**Commit Point**: ✅ "Phase 5 Batch 4.2: Migrate WorkoutLogger component"

---

#### **Step 4.3: Migrate InProgressWorkout (1 file)**

**Files to Move:**
1. `components/InProgressWorkout.tsx` → `src/features/workout/components/InProgressWorkout.tsx`

**Actions:**
1. Move `InProgressWorkout.tsx`
2. Update imports:
   - Types: `../types` → `../../../shared/types`
   - VideoPlayer: `./VideoPlayer` → `../../../components/VideoPlayer`
   - SwipeableCard: `./SwipeableCard` → `./SwipeableCard` (already in same directory)
   - geminiService: `../services/` → `../../../services/`

**Files Needing Import Updates:**
- `src/App.tsx` (if it imports InProgressWorkout directly)

**Commit Point**: ✅ "Phase 5 Batch 4.3: Migrate InProgressWorkout component"

---

#### **Step 4.4: Migrate WorkoutScenarioTester and Update App.tsx (2 files)**

**Files to Move:**
1. `components/WorkoutScenarioTester.tsx` → `src/features/workout/components/WorkoutScenarioTester.tsx`

**Actions:**
1. Move `WorkoutScenarioTester.tsx`
2. Update imports in WorkoutScenarioTester:
   - Types: `../types` → `../../../shared/types`
   - musclePaths: `../src/features/anatomy/constants/` → `../../anatomy/constants/`
   - MuscleAnatomyViewer: `../src/features/anatomy/components/` → `../../anatomy/components/`
3. Update `src/App.tsx`:
   - WorkoutLogger: `../components/WorkoutLogger` → `./features/workout/components/WorkoutLogger`
   - InProgressWorkout: `../components/InProgressWorkout` → `./features/workout/components/InProgressWorkout`
   - GlobalTimer: `../components/GlobalTimer` → `./features/workout/components/GlobalTimer`
   - WorkoutScenarioTester: `../components/WorkoutScenarioTester` → `./features/workout/components/WorkoutScenarioTester`

**Commit Point**: ✅ "Phase 5 Batch 4.4: Migrate WorkoutScenarioTester and update App.tsx imports"

---

### Batch 4 Summary

**Total Files Moved**: 5  
**Total Files Modified**: 6 (5 moved + 1 App.tsx)  
**New Directories**: 1 (`src/features/workout/components/`)  
**Commit Points**: 4

**Migration Map:**
```
components/SwipeableCard.tsx          → src/features/workout/components/SwipeableCard.tsx
components/GlobalTimer.tsx            → src/features/workout/components/GlobalTimer.tsx
components/WorkoutLogger.tsx          → src/features/workout/components/WorkoutLogger.tsx
components/InProgressWorkout.tsx      → src/features/workout/components/InProgressWorkout.tsx
components/WorkoutScenarioTester.tsx  → src/features/workout/components/WorkoutScenarioTester.tsx
```

---

## 📊 Overall Statistics

### Batch 3 (Report Components)
- **Files to Move**: 5
- **Total Lines**: ~2,196 lines
- **Steps**: 4
- **Estimated Time**: 30-45 minutes
- **Dependencies**: Export services, Anatomy constants, Report services

### Batch 4 (Workout Components)
- **Files to Move**: 5
- **Total Lines**: ~1,803 lines
- **Steps**: 4
- **Estimated Time**: 30-45 minutes
- **Dependencies**: Anatomy components, Gemini service, VideoPlayer

### Combined
- **Total Files**: 10
- **Total Lines**: ~3,999 lines
- **Total Steps**: 8
- **Total Commits**: 8
- **Estimated Total Time**: 60-90 minutes

---

## ⚠️ Important Notes

### Cross-Feature Dependencies

**Batch 3 Dependencies:**
- ✅ Export services (already migrated in Batch 1)
- ✅ Report services (already migrated in Batch 2)
- ✅ Anatomy constants (already migrated in Phase 4)
- ❌ ExerciseNameMappingService (still in `services/`, not yet migrated)

**Batch 4 Dependencies:**
- ✅ Anatomy components (already migrated in Phase 4)
- ❌ VideoPlayer (still in `components/`, not yet migrated)
- ❌ geminiService (still in `services/`, not yet migrated)

### Files Not Yet Migrated (Referenced by Batch 3 & 4)

1. **services/ExerciseNameMappingService.ts**
   - Used by: WorkoutReportModal
   - Suggested location: `src/features/exercise/services/`

2. **components/VideoPlayer.tsx**
   - Used by: WorkoutLogger, InProgressWorkout
   - Suggested location: `src/shared/components/` or `src/features/exercise/components/`

3. **services/geminiService.ts**
   - Used by: WorkoutLogger, InProgressWorkout
   - Suggested location: `src/features/ai/services/` or `src/shared/services/`

### Testing Checklist

After each step, verify:
- [ ] TypeScript compilation passes (`npm run build` or `tsc --noEmit`)
- [ ] No import errors in browser console
- [ ] Component renders correctly
- [ ] All functionality works as expected
- [ ] No broken links or missing dependencies

---

## 🎯 Execution Order

**Recommended execution order:**

1. **Batch 3 (Report Components)** - Execute first
   - Fewer external dependencies
   - More self-contained
   - Builds on already-migrated report services

2. **Batch 4 (Workout Components)** - Execute second
   - Has dependencies on unmigrated files (VideoPlayer, geminiService)
   - May require additional migration steps for dependencies

**Alternative approach:**
- Execute Batch 3 and Batch 4 in parallel if working with multiple developers
- Each batch is independent and doesn't cross-reference the other

---

## 📝 Next Steps After Batch 3 & 4

1. **Create barrel exports** (`index.ts` files) for cleaner imports:
   ```typescript
   // src/features/report/components/index.ts
   export { WorkoutReportModal } from './WorkoutReportModal';
   export { WorkoutReport } from './WorkoutReport';
   export { ProgressView } from './ProgressView';
   export { WeeklyReportViewer } from './WeeklyReportViewer';
   export { WeeklyReportComparison } from './WeeklyReportComparison';
   ```

2. **Migrate remaining dependencies**:
   - ExerciseNameMappingService
   - VideoPlayer
   - geminiService

3. **Update documentation** with new import paths

4. **Consider creating shared components directory** for truly shared UI components

---

**Status**: ✅ **PLANNING COMPLETE - READY FOR EXECUTION**

This plan provides clear, step-by-step instructions for migrating all report and workout components while maintaining code functionality and minimizing risk.