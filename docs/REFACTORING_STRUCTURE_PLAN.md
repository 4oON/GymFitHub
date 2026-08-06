# ZenFit App - 目标目录结构方案

## 📁 完整目录结构

```
zenfit/
├── src/
│   ├── core/                          # 核心应用层
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── router.tsx
│   │   └── config/
│   │       ├── app.config.ts
│   │       └── ai.config.ts
│   │
│   ├── features/                      # 功能模块（按业务领域划分）
│   │   ├── workout/                   # 训练模块
│   │   │   ├── components/
│   │   │   │   ├── WorkoutLogger.tsx
│   │   │   │   ├── InProgressWorkout.tsx
│   │   │   │   ├── SwipeableCard.tsx
│   │   │   │   └── GlobalTimer.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useWorkoutSession.ts
│   │   │   │   └── useWorkoutTimer.ts
│   │   │   ├── services/
│   │   │   │   └── WorkoutService.ts
│   │   │   └── types/
│   │   │       └── workout.types.ts
│   │   │
│   │   ├── exercise/                  # 动作库模块
│   │   │   ├── components/
│   │   │   │   ├── ExerciseLibraryView.tsx
│   │   │   │   ├── ExerciseSelector.tsx
│   │   │   │   ├── HeroExerciseCard.tsx
│   │   │   │   └── VideoPlayer.tsx
│   │   │   ├── data/
│   │   │   │   └── comprehensive_exercises.ts
│   │   │   ├── services/
│   │   │   │   └── ExerciseNameMappingService.ts
│   │   │   └── types/
│   │   │       └── exercise.types.ts
│   │   │
│   │   ├── routine/                   # 训练计划模块
│   │   │   ├── components/
│   │   │   │   ├── RoutineBuilder.tsx
│   │   │   │   └── RoutineCreator.tsx
│   │   │   ├── services/
│   │   │   │   └── RoutineAIService.ts
│   │   │   └── types/
│   │   │       └── routine.types.ts
│   │   │
│   │   ├── progress/                  # 进度追踪模块
│   │   │   ├── components/
│   │   │   │   ├── ProgressView.tsx
│   │   │   │   ├── WorkoutReport.tsx
│   │   │   │   ├── WorkoutReportModal.tsx
│   │   │   │   ├── WeeklyReportViewer.tsx
│   │   │   │   └── WeeklyReportComparison.tsx
│   │   │   ├── services/
│   │   │   │   ├── WeeklyReportService.ts
│   │   │   │   └── ReportStorageService.ts
│   │   │   └── types/
│   │   │       └── report.types.ts
│   │   │
│   │   ├── profile/                   # 用户档案模块
│   │   │   ├── components/
│   │   │   │   ├── ProfileSetup.tsx
│   │   │   │   ├── ProfileView.tsx
│   │   │   │   └── ProfileEditorModal.tsx
│   │   │   ├── services/
│   │   │   │   └── CalorieCalculationService.ts
│   │   │   └── types/
│   │   │       └── profile.types.ts
│   │   │
│   │   ├── ai/                        # AI 功能模块
│   │   │   ├── components/
│   │   │   │   ├── AIRecommendationPanel.tsx
│   │   │   │   ├── AiRecommendationCard.tsx
│   │   │   │   ├── AiConfigModal.tsx
│   │   │   │   └── AiResultPreview.tsx
│   │   │   ├── services/
│   │   │   │   ├── geminiService.ts
│   │   │   │   ├── perplexityService.ts
│   │   │   │   └── AIRecommendationService.ts
│   │   │   └── types/
│   │   │       └── ai.types.ts
│   │   │
│   │   ├── anatomy/                   # 肌肉解剖模块
│   │   │   ├── components/
│   │   │   │   ├── MuscleAnatomyViewer.tsx
│   │   │   │   ├── MuscleAnatomyTester.tsx
│   │   │   │   └── MuscleHighlightTester.tsx
│   │   │   ├── constants/
│   │   │   │   ├── muscleColors.ts
│   │   │   │   ├── muscleHitboxes.ts
│   │   │   │   └── musclePaths.ts
│   │   │   ├── services/
│   │   │   │   └── MuscleHighlightService.ts
│   │   │   └── types/
│   │   │       └── anatomy.types.ts
│   │   │
│   │   └── export/                    # 导出功能模块
│   │       ├── components/
│   │       │   └── ExportOptionsModal.tsx
│   │       ├── services/
│   │       │   ├── PDFExportService.ts
│   │       │   ├── EnhancedPDFExportService.ts
│   │       │   ├── VectorPDFExportService.ts
│   │       │   ├── SVGExportService.ts
│   │       │   ├── PNGExportService.ts
│   │       │   ├── JSONExportService.ts
│   │       │   └── HTMLTemplateService.ts
│   │       ├── templates/
│   │       │   ├── enhanced_muscle_template.html
│   │       │   ├── enhanced_template.html
│   │       │   └── template_for_pdf.html
│   │       └── types/
│   │           └── export.types.ts
│   │
│   ├── shared/                        # 共享模块
│   │   ├── components/                # 通用 UI 组件
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   └── Input.tsx
│   │   │   ├── layout/
│   │   │   │   ├── AdaptiveHeightContainer.tsx
│   │   │   │   └── CollapsibleSection.tsx
│   │   │   └── feedback/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       └── ErrorBoundary.tsx
│   │   │
│   │   ├── hooks/                     # 通用 Hooks
│   │   │   ├── useAdaptiveHeight.ts
│   │   │   ├── usePDFExport.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── useDebounce.ts
│   │   │
│   │   ├── utils/                     # 工具函数
│   │   │   ├── uuid.ts
│   │   │   ├── colorAccessibility.ts
│   │   │   ├── dateFormatter.ts
│   │   │   └── validation.ts
│   │   │
│   │   ├── constants/                 # 全局常量
│   │   │   ├── app.constants.ts
│   │   │   └── initial_exercises.ts
│   │   │
│   │   └── types/                     # 全局类型定义
│   │       ├── index.ts
│   │       ├── common.types.ts
│   │       └── enums.ts
│   │
│   ├── store/                         # 状态管理（建议使用 Zustand 或 Context）
│   │   ├── index.ts
│   │   ├── workoutStore.ts
│   │   ├── exerciseStore.ts
│   │   ├── routineStore.ts
│   │   ├── profileStore.ts
│   │   └── uiStore.ts
│   │
│   ├── api/                           # API 层（未来扩展）
│   │   ├── client.ts
│   │   ├── endpoints/
│   │   └── interceptors/
│   │
│   ├── assets/                        # 静态资源
│   │   ├── images/
│   │   │   └── zenfit.png
│   │   ├── videos/
│   │   └── fonts/
│   │
│   └── dev/                           # 开发工具（仅开发环境）
│       ├── components/
│       │   ├── DeveloperTestPanel.tsx
│       │   ├── WorkoutScenarioTester.tsx
│       │   └── SVGPathImporter.tsx
│       └── utils/
│           └── devHelpers.ts
│
├── public/                            # 公共静态文件
│   └── index.html
│
├── Library/                           # 外部资源库（视频数据）
│   ├── band-final-video.json
│   ├── barbell-final-video.json
│   ├── bodyweigh-final-video.json
│   ├── cables-final-video.json
│   ├── dumbbell-final-video.json
│   ├── machine-final-video.json
│   ├── recovery-final-video.json
│   └── smith-final-video.json
│
├── scripts/                           # 构建和工具脚本
│   ├── generate_comprehensive_library.cjs
│   ├── audit_exercises.py
│   ├── check_muscle_ids.py
│   └── verify_videos.py
│
├── docs/                              # 文档
│   ├── REFACTORING_STRUCTURE_PLAN.md
│   ├── DATA_IMPORT_RULES.md
│   ├── FUNCTIONALITY_TEST_REPORT.md
│   └── MUSCLE_ANATOMY_DEVELOPMENT_PLAN.md
│
├── .vscode/                           # VSCode 配置
├── node_modules/
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── json.d.ts
└── README.md
```

---

## 📋 一级模块职责说明

### **1. `src/core/` - 核心应用层**
**职责：** 应用程序的入口和核心配置
- 应用主入口文件（`App.tsx`, `main.tsx`）
- 路由配置（`router.tsx`）
- 全局配置文件（AI 配置、应用配置）
- 应用级别的初始化逻辑

**关键特点：**
- 不包含业务逻辑
- 负责应用启动和全局设置
- 协调各个功能模块

---

### **2. `src/features/` - 功能模块层**
**职责：** 按业务领域划分的独立功能模块
- 每个子模块是一个完整的业务功能单元
- 包含该功能的组件、服务、类型、Hooks
- 模块间通过 store 或 props 通信

**子模块说明：**
- **`workout/`** - 训练执行（记录、计时、进行中的训练）
- **`exercise/`** - 动作库管理（浏览、选择、视频播放）
- **`routine/`** - 训练计划（创建、编辑、AI 生成）
- **`progress/`** - 进度追踪（历史记录、报告、周报）
- **`profile/`** - 用户档案（设置、编辑、卡路里计算）
- **`ai/`** - AI 功能（推荐、配置、结果预览）
- **`anatomy/`** - 肌肉解剖（可视化、高亮、测试）
- **`export/`** - 导出功能（PDF、SVG、PNG、JSON）

**设计原则：**
- 高内聚：相关功能集中在一个模块
- 低耦合：模块间依赖最小化
- 可独立测试和维护

---

### **3. `src/shared/` - 共享模块层**
**职责：** 跨功能模块的可复用代码
- **`components/`** - 通用 UI 组件（按钮、模态框、卡片等）
- **`hooks/`** - 通用自定义 Hooks（localStorage、防抖等）
- **`utils/`** - 工具函数（UUID、日期格式化、验证等）
- **`constants/`** - 全局常量（应用配置、初始数据）
- **`types/`** - 全局类型定义（通用接口、枚举）

**关键特点：**
- 不依赖任何 feature 模块
- 可被任何模块导入使用
- 保持纯函数和无副作用

---

### **4. `src/store/` - 状态管理层**
**职责：** 集中管理应用状态
- 使用 Zustand 或 React Context 实现
- 按功能领域划分 store（workout、exercise、routine 等）
- 提供统一的状态访问和更新接口
- 处理 localStorage 持久化

**Store 划分：**
- **`workoutStore`** - 训练会话状态
- **`exerciseStore`** - 动作库状态
- **`routineStore`** - 训练计划状态
- **`profileStore`** - 用户档案状态
- **`uiStore`** - UI 状态（模态框、导航等）

---

### **5. `src/api/` - API 层（未来扩展）**
**职责：** 统一管理外部 API 调用
- HTTP 客户端配置
- API 端点定义
- 请求/响应拦截器
- 错误处理

**当前状态：** 预留目录，暂时使用 services 中的 AI 服务

---

### **6. `src/assets/` - 静态资源层**
**职责：** 存放图片、字体、视频等静态文件
- 按类型分类（images、videos、fonts）
- 由构建工具处理和优化

---

### **7. `src/dev/` - 开发工具层**
**职责：** 仅在开发环境使用的工具和组件
- 开发者测试面板
- 场景测试工具
- SVG 导入工具
- 仅在开发模式下加载

---

### **8. `Library/` - 外部资源库**
**职责：** 存放外部视频数据 JSON 文件
- 按器械类型分类的视频数据
- 不参与构建，作为数据源使用

---

### **9. `scripts/` - 构建脚本层**
**职责：** 数据处理和构建工具脚本
- 动作库生成脚本
- 数据审计和验证脚本
- Python 和 Node.js 工具脚本

---

### **10. `docs/` - 文档层**
**职责：** 项目文档和开发指南
- 重构计划文档
- 功能测试报告
- 开发规范和指南

---

## 🎯 重构优势

### **1. 清晰的职责分离**
- 每个模块有明确的职责边界
- 避免代码混乱和重复

### **2. 可维护性提升**
- 功能模块独立，易于定位和修改
- 新功能可以独立开发和测试

### **3. 可扩展性增强**
- 新增功能只需添加新的 feature 模块
- 不影响现有代码

### **4. 团队协作友好**
- 不同开发者可以并行开发不同模块
- 减少代码冲突

### **5. 测试覆盖率提升**
- 每个模块可以独立测试
- 更容易编写单元测试和集成测试

---

## 📝 下一步行动建议

1. **审查并确认此结构方案**
2. **创建迁移计划**（分阶段重构）
3. **选择状态管理方案**（Zustand 推荐）
4. **开始重构 App.tsx**（提取状态到 store）
5. **逐步迁移组件到新结构**

---

**注意：** 此方案仅为目标结构，实际重构需要分阶段进行，确保应用在重构过程中保持可用状态。