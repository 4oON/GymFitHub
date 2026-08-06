# ZenFit App - 迁移步骤清单

## 📋 迁移原则

- ✅ 每一步都是独立的、可提交的变更
- ✅ 按照依赖关系从底层到上层迁移
- ✅ 先迁移无依赖的模块（utils、constants）
- ✅ 每步完成后测试应用是否正常运行
- ⚠️ 标记 `[需要修正 import]` 的步骤需要后续统一修正导入路径

---

## 🎯 阶段 0：准备工作

### Step 0.1: 创建 src 根目录
**操作：**
- 新建目录：`src/`

**说明：** 为所有源代码创建统一的根目录

---

### Step 0.2: 移动入口文件到 src
**操作：**
- 移动文件：`index.tsx` → `src/main.tsx`
- 移动文件：`App.tsx` → `src/App.tsx`

**⚠️ [需要修正 import]** 
- `index.html` 中的 script 标签需要更新为 `/src/main.tsx`
- `src/main.tsx` 中导入 App 的路径需要更新

---

### Step 0.3: 更新 Vite 配置
**操作：**
- 修改 `vite.config.ts` 中的入口路径配置

**说明：** 确保 Vite 能正确找到新的入口文件

---

## 🎯 阶段 1：创建基础目录结构

### Step 1.1: 创建 shared 模块目录
**操作：**
- 新建目录：`src/shared/`
- 新建目录：`src/shared/utils/`
- 新建目录：`src/shared/constants/`
- 新建目录：`src/shared/types/`
- 新建目录：`src/shared/hooks/`
- 新建目录：`src/shared/components/`
- 新建目录：`src/shared/components/ui/`
- 新建目录：`src/shared/components/layout/`

**说明：** 创建共享模块的基础结构

---

### Step 1.2: 创建 features 模块目录
**操作：**
- 新建目录：`src/features/`
- 新建目录：`src/features/workout/`
- 新建目录：`src/features/exercise/`
- 新建目录：`src/features/routine/`
- 新建目录：`src/features/progress/`
- 新建目录：`src/features/profile/`
- 新建目录：`src/features/ai/`
- 新建目录：`src/features/anatomy/`
- 新建目录：`src/features/export/`

**说明：** 创建功能模块的顶层目录

---

### Step 1.3: 创建其他顶层目录
**操作：**
- 新建目录：`src/core/`
- 新建目录：`src/core/config/`
- 新建目录：`src/store/`
- 新建目录：`src/assets/`
- 新建目录：`src/assets/images/`
- 新建目录：`src/dev/`
- 新建目录：`docs/`

**说明：** 创建核心、状态管理、资源和文档目录

---

## 🎯 阶段 2：迁移 Utils 和 Constants（无依赖）

### Step 2.1: 迁移 utils 工具函数
**操作：**
- 移动文件：`utils/uuid.ts` → `src/shared/utils/uuid.ts`
- 移动文件：`utils/colorAccessibility.ts` → `src/shared/utils/colorAccessibility.ts`

**⚠️ [需要修正 import]** 所有引用这些文件的地方需要更新路径

---

### Step 2.2: 迁移全局常量
**操作：**
- 移动文件：`constants.ts` → `src/shared/constants/initial_exercises.ts`

**⚠️ [需要修正 import]** 所有引用 `constants.ts` 的地方需要更新

---

### Step 2.3: 迁移类型定义
**操作：**
- 移动文件：`types.ts` → `src/shared/types/index.ts`
- 移动文件：`json.d.ts` → `src/shared/types/json.d.ts`

**⚠️ [需要修正 import]** 所有引用 `types.ts` 的地方需要更新

---

## 🎯 阶段 3：迁移 Anatomy 模块（独立性强）

### Step 3.1: 创建 anatomy 子目录
**操作：**
- 新建目录：`src/features/anatomy/components/`
- 新建目录：`src/features/anatomy/constants/`
- 新建目录：`src/features/anatomy/services/`
- 新建目录：`src/features/anatomy/types/`

---

### Step 3.2: 迁移 anatomy constants
**操作：**
- 移动文件：`constants/muscleColors.ts` → `src/features/anatomy/constants/muscleColors.ts`
- 移动文件：`constants/muscleHitboxes.ts` → `src/features/anatomy/constants/muscleHitboxes.ts`
- 移动文件：`constants/musclePaths.ts` → `src/features/anatomy/constants/musclePaths.ts`

**⚠️ [需要修正 import]** 所有引用这些常量的组件需要更新路径

---

### Step 3.3: 迁移 anatomy services
**操作：**
- 移动文件：`services/MuscleHighlightService.ts` → `src/features/anatomy/services/MuscleHighlightService.ts`

**⚠️ [需要修正 import]**

---

### Step 3.4: 迁移 anatomy components
**操作：**
- 移动文件：`components/MuscleAnatomyViewer.tsx` → `src/features/anatomy/components/MuscleAnatomyViewer.tsx`
- 移动文件：`components/MuscleAnatomyTester.tsx` → `src/features/anatomy/components/MuscleAnatomyTester.tsx`
- 移动文件：`components/MuscleHighlightTester.tsx` → `src/features/anatomy/components/MuscleHighlightTester.tsx`

**⚠️ [需要修正 import]** 这些组件内部的 import 和引用它们的地方都需要更新

---

## 🎯 阶段 4：迁移 Exercise 模块

### Step 4.1: 创建 exercise 子目录
**操作：**
- 新建目录：`src/features/exercise/components/`
- 新建目录：`src/features/exercise/data/`
- 新建目录：`src/features/exercise/services/`
- 新建目录：`src/features/exercise/types/`

---

### Step 4.2: 迁移 exercise data
**操作：**
- 移动文件：`data/comprehensive_exercises.ts` → `src/features/exercise/data/comprehensive_exercises.ts`

**⚠️ [需要修正 import]**

---

### Step 4.3: 迁移 exercise services
**操作：**
- 移动文件：`services/ExerciseNameMappingService.ts` → `src/features/exercise/services/ExerciseNameMappingService.ts`

**⚠️ [需要修正 import]**

---

### Step 4.4: 迁移 exercise components
**操作：**
- 移动文件：`components/ExerciseLibraryView.tsx` → `src/features/exercise/components/ExerciseLibraryView.tsx`
- 移动文件：`components/ExerciseSelector.tsx` → `src/features/exercise/components/ExerciseSelector.tsx`
- 移动文件：`components/HeroExerciseCard.tsx` → `src/features/exercise/components/HeroExerciseCard.tsx`
- 移动文件：`components/VideoPlayer.tsx` → `src/features/exercise/components/VideoPlayer.tsx`

**⚠️ [需要修正 import]**

---

## 🎯 阶段 5：迁移 Workout 模块

### Step 5.1: 创建 workout 子目录
**操作：**
- 新建目录：`src/features/workout/components/`
- 新建目录：`src/features/workout/hooks/`
- 新建目录：`src/features/workout/services/`
- 新建目录：`src/features/workout/types/`

---

### Step 5.2: 迁移 workout components
**操作：**
- 移动文件：`components/WorkoutLogger.tsx` → `src/features/workout/components/WorkoutLogger.tsx`
- 移动文件：`components/InProgressWorkout.tsx` → `src/features/workout/components/InProgressWorkout.tsx`
- 移动文件：`components/SwipeableCard.tsx` → `src/features/workout/components/SwipeableCard.tsx`
- 移动文件：`components/GlobalTimer.tsx` → `src/features/workout/components/GlobalTimer.tsx`

**⚠️ [需要修正 import]**

---

## 🎯 阶段 6：迁移 Routine 模块

### Step 6.1: 创建 routine 子目录
**操作：**
- 新建目录：`src/features/routine/components/`
- 新建目录：`src/features/routine/services/`
- 新建目录：`src/features/routine/types/`

---

### Step 6.2: 迁移 routine services
**操作：**
- 移动文件：`services/RoutineAIService.ts` → `src/features/routine/services/RoutineAIService.ts`

**⚠️ [需要修正 import]**

---

### Step 6.3: 迁移 routine components
**操作：**
- 移动文件：`components/RoutineBuilder.tsx` → `src/features/routine/components/RoutineBuilder.tsx`
- 移动文件：`components/RoutineCreator.tsx` → `src/features/routine/components/RoutineCreator.tsx`

**⚠️ [需要修正 import]**

---

## 🎯 阶段 7：迁移 Progress 模块

### Step 7.1: 创建 progress 子目录
**操作：**
- 新建目录：`src/features/progress/components/`
- 新建目录：`src/features/progress/services/`
- 新建目录：`src/features/progress/types/`

---

### Step 7.2: 迁移 progress services
**操作：**
- 移动文件：`services/WeeklyReportService.ts` → `src/features/progress/services/WeeklyReportService.ts`
- 移动文件：`services/ReportStorageService.ts` → `src/features/progress/services/ReportStorageService.ts`

**⚠️ [需要修正 import]**

---

### Step 7.3: 迁移 progress components
**操作：**
- 移动文件：`components/ProgressView.tsx` → `src/features/progress/components/ProgressView.tsx`
- 移动文件：`components/WorkoutReport.tsx` → `src/features/progress/components/WorkoutReport.tsx`
- 移动文件：`components/WorkoutReportModal.tsx` → `src/features/progress/components/WorkoutReportModal.tsx`
- 移动文件：`components/WeeklyReportViewer.tsx` → `src/features/progress/components/WeeklyReportViewer.tsx`
- 移动文件：`components/WeeklyReportComparison.tsx` → `src/features/progress/components/WeeklyReportComparison.tsx`

**⚠️ [需要修正 import]**

---

## 🎯 阶段 8：迁移 Profile 模块

### Step 8.1: 创建 profile 子目录
**操作：**
- 新建目录：`src/features/profile/components/`
- 新建目录：`src/features/profile/services/`
- 新建目录：`src/features/profile/types/`

---

### Step 8.2: 迁移 profile services
**操作：**
- 移动文件：`services/CalorieCalculationService.ts` → `src/features/profile/services/CalorieCalculationService.ts`

**⚠️ [需要修正 import]**

---

### Step 8.3: 迁移 profile components
**操作：**
- 移动文件：`components/ProfileSetup.tsx` → `src/features/profile/components/ProfileSetup.tsx`
- 移动文件：`components/ProfileView.tsx` → `src/features/profile/components/ProfileView.tsx`
- 移动文件：`components/ProfileEditorModal.tsx` → `src/features/profile/components/ProfileEditorModal.tsx`

**⚠️ [需要修正 import]**

---

## 🎯 阶段 9：迁移 AI 模块

### Step 9.1: 创建 ai 子目录
**操作：**
- 新建目录：`src/features/ai/components/`
- 新建目录：`src/features/ai/services/`
- 新建目录：`src/features/ai/types/`

---

### Step 9.2: 迁移 ai services
**操作：**
- 移动文件：`services/geminiService.ts` → `src/features/ai/services/geminiService.ts`
- 移动文件：`services/perplexityService.ts` → `src/features/ai/services/perplexityService.ts`
- 移动文件：`services/AIRecommendationService.ts` → `src/features/ai/services/AIRecommendationService.ts`

**⚠️ [需要修正 import]**

---

### Step 9.3: 迁移 ai components
**操作：**
- 移动文件：`components/AIRecommendationPanel.tsx` → `src/features/ai/components/AIRecommendationPanel.tsx`
- 移动文件：`components/AiRecommendationCard.tsx` → `src/features/ai/components/AiRecommendationCard.tsx`
- 移动文件：`components/AiConfigModal.tsx` → `src/features/ai/components/AiConfigModal.tsx`
- 移动文件：`components/AiResultPreview.tsx` → `src/features/ai/components/AiResultPreview.tsx`

**⚠️ [需要修正 import]**

---

## 🎯 阶段 10：迁移 Export 模块

### Step 10.1: 创建 export 子目录
**操作：**
- 新建目录：`src/features/export/services/`
- 新建目录：`src/features/export/templates/`
- 新建目录：`src/features/export/types/`

---

### Step 10.2: 迁移 export services
**操作：**
- 移动文件：`services/PDFExportService.ts` → `src/features/export/services/PDFExportService.ts`
- 移动文件：`services/EnhancedPDFExportService.ts` → `src/features/export/services/EnhancedPDFExportService.ts`
- 移动文件：`services/VectorPDFExportService.ts` → `src/features/export/services/VectorPDFExportService.ts`
- 移动文件：`services/SVGExportService.ts` → `src/features/export/services/SVGExportService.ts`
- 移动文件：`services/PNGExportService.ts` → `src/features/export/services/PNGExportService.ts`
- 移动文件：`services/JSONExportService.ts` → `src/features/export/services/JSONExportService.ts`
- 移动文件：`services/HTMLTemplateService.ts` → `src/features/export/services/HTMLTemplateService.ts`

**⚠️ [需要修正 import]**

---

### Step 10.3: 迁移 export templates
**操作：**
- 移动文件：`Library/enhanced_muscle_template.html` → `src/features/export/templates/enhanced_muscle_template.html`
- 移动文件：`Library/enhanced_template.html` → `src/features/export/templates/enhanced_template.html`
- 移动文件：`Library/template for PDF.html` → `src/features/export/templates/template_for_pdf.html`

**⚠️ [需要修正 import]** 注意文件名中的空格已被移除

---

## 🎯 阶段 11：迁移 Shared Hooks

### Step 11.1: 迁移 hooks
**操作：**
- 移动文件：`hooks/useAdaptiveHeight.ts` → `src/shared/hooks/useAdaptiveHeight.ts`
- 移动文件：`hooks/usePDFExport.ts` → `src/shared/hooks/usePDFExport.ts`

**⚠️ [需要修正 import]**

---

## 🎯 阶段 12：迁移 Shared Components

### Step 12.1: 迁移 layout components
**操作：**
- 移动文件：`components/AdaptiveHeightContainer.tsx` → `src/shared/components/layout/AdaptiveHeightContainer.tsx`
- 移动文件：`components/CollapsibleSection.tsx` → `src/shared/components/layout/CollapsibleSection.tsx`

**⚠️ [需要修正 import]**

---

## 🎯 阶段 13：迁移 Dev Tools

### Step 13.1: 创建 dev 子目录
**操作：**
- 新建目录：`src/dev/components/`

---

### Step 13.2: 迁移 dev components
**操作：**
- 移动文件：`components/DeveloperTestPanel.tsx` → `src/dev/components/DeveloperTestPanel.tsx`
- 移动文件：`components/WorkoutScenarioTester.tsx` → `src/dev/components/WorkoutScenarioTester.tsx`
- 移动文件：`components/SVGPathImporter.tsx` → `src/dev/components/SVGPathImporter.tsx`

**⚠️ [需要修正 import]**

---

## 🎯 阶段 14：迁移 Assets

### Step 14.1: 迁移图片资源
**操作：**
- 移动文件：`icon/zenfit.png` → `src/assets/images/zenfit.png`

**⚠️ [需要修正 import]** 如果有引用此图片的地方需要更新

---

## 🎯 阶段 15：整理文档

### Step 15.1: 移动文档到 docs 目录
**操作：**
- 移动文件：`REFACTORING_STRUCTURE_PLAN.md` → `docs/REFACTORING_STRUCTURE_PLAN.md`
- 移动文件：`DATA_IMPORT_RULES.md` → `docs/DATA_IMPORT_RULES.md`
- 移动文件：`FUNCTIONALITY_TEST_REPORT.md` → `docs/FUNCTIONALITY_TEST_REPORT.md`
- 移动文件：`MUSCLE_ANATOMY_DEVELOPMENT_PLAN.md` → `docs/MUSCLE_ANATOMY_DEVELOPMENT_PLAN.md`
- 移动文件：`MIGRATION_STEPS.md` → `docs/MIGRATION_STEPS.md`

**说明：** 不影响代码运行

---

## 🎯 阶段 16：清理旧目录

### Step 16.1: 删除空目录
**操作：**
- 删除目录：`components/` (如果为空)
- 删除目录：`services/` (如果为空)
- 删除目录：`hooks/` (如果为空)
- 删除目录：`constants/` (如果为空)
- 删除目录：`data/` (如果为空)
- 删除目录：`utils/` (如果为空)
- 删除目录：`icon/` (如果为空)

**说明：** 确保所有文件都已迁移后再删除

---

## 🎯 阶段 17：统一修正 Import 路径

### Step 17.1: 批量更新 import 路径
**操作：**
- 使用 IDE 的全局查找替换功能
- 或使用脚本批量更新所有 import 语句

**需要更新的路径模式：**
```typescript
// 旧路径 → 新路径
'../types' → '@/shared/types'
'../constants' → '@/shared/constants'
'../utils/' → '@/shared/utils/'
'../components/' → '@/features/*/components/' 或 '@/shared/components/'
'../services/' → '@/features/*/services/'
'../hooks/' → '@/shared/hooks/'
```

**⚠️ 重要：** 建议配置 TypeScript path aliases 简化导入

---

## 🎯 阶段 18：配置 Path Aliases

### Step 18.1: 更新 tsconfig.json
**操作：**
- 在 `tsconfig.json` 中添加 `paths` 配置：
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/shared/*": ["src/shared/*"],
      "@/features/*": ["src/features/*"],
      "@/core/*": ["src/core/*"],
      "@/store/*": ["src/store/*"]
    }
  }
}
```

---

### Step 18.2: 更新 vite.config.ts
**操作：**
- 在 `vite.config.ts` 中添加 alias 配置：
```typescript
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/store': path.resolve(__dirname, './src/store'),
    }
  }
})
```

---

## 🎯 阶段 19：测试和验证

### Step 19.1: 运行开发服务器
**操作：**
```bash
npm run dev
```
**验证：** 确保应用能正常启动，无编译错误

---

### Step 19.2: 功能测试
**操作：**
- 测试所有主要功能模块
- 检查是否有运行时错误
- 验证所有页面和组件正常工作

---

### Step 19.3: 构建测试
**操作：**
```bash
npm run build
```
**验证：** 确保生产构建成功

---

## 📊 迁移统计

**总步骤数：** 约 60+ 个小步骤
**预计耗时：** 4-6 小时（取决于测试和调试时间）
**需要修正 import 的步骤：** 约 30 个步骤

---

## ⚠️ 注意事项

1. **每完成一个阶段就 commit 一次**
2. **在修正 import 之前，应用可能无法运行**
3. **建议在新分支上进行迁移**
4. **保留原始代码备份**
5. **使用 Git 跟踪所有变更**
6. **遇到问题可以随时回滚**

---

## 🚀 快速开始

建议按以下顺序执行：
1. 阶段 0-1：准备工作和创建目录（5 分钟）
2. 阶段 2：迁移 utils 和 constants（10 分钟）
3. 阶段 3-13：逐个迁移功能模块（每个模块 15-30 分钟）
4. 阶段 14-16：整理资源和清理（10 分钟）
5. 阶段 17-18：统一修正 import 和配置 aliases（30-60 分钟）
6. 阶段 19：测试验证（30 分钟）

**建议每完成 2-3 个阶段就测试一次，确保应用仍能正常运行。**