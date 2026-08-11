# ZenFit 死代码分析报告

> 分析时间：2026-08-11
> 分析范围：`frontend/src`（172 个源文件）+ 仓库根目录遗留文件
> 方法：静态引用图分析（脚本：`scripts/analyze-deadcode.cjs`，结果：`.deadcode-analysis.json`）+ 人工交叉验证

---

## 一、结论速览

- **确认死代码文件：27 个 `src` 文件 + 1 个 CSS（App.css）**
- **仅被 Dev/测试代码引用的文件：2 个**（可随 dev 面板一起移除）
- **根目录网页版遗留：23 个调试 HTML + dist-old/ + 2 个测试页 + 1 个脚本**
- **重复实现 5 组**（同一功能多个版本并存）
- **不可删除（误报）：1 个**（`shared/types/json.d.ts`，类型声明全局生效）

---

## 二、孤儿文件清单（27 个：无人引用）

### A 类：被新版替代的重复实现（网页版迭代遗留）— 最高优先级

| 文件 | 替代品 | 说明 |
|---|---|---|
| `features/routine/components/AiConfigModal.old.tsx` | `AiConfigModal.tsx` | `.old` 备份文件 |
| `features/routine/components/AiRecommendationCard.old.tsx` | `features/ai/components/AiRecommendationCard.tsx` | `.old` 备份文件 |
| `features/routine/components/AiResultPreview.old.tsx` | `features/ai/components/AiResultPreview.tsx` | `.old` 备份文件 |
| `features/routine/components/AiRecommendationCard.tsx` | `features/ai/components/AiRecommendationCard.tsx` | **同名重复**：RoutineCreator 实际引用的是 `features/ai` 版本 |
| `features/routine/components/AiResultPreview.tsx` | `features/ai/components/AiResultPreview.tsx` | **同名重复**：RoutineCreator 实际引用的是 `features/ai` 版本 |
| `features/routine/services/RoutineAIService.ts` | `features/ai/services/*` | 已被 ai 模块服务替代 |
| `features/exercise/constants/initial_exercises.ts` (967行) | `shared/constants/initial_exercises.ts` (909行) | **两份几乎相同的动作库**，实际引用全部指向 shared 版本 |
| `features/anatomy/constants/muscleHitboxes.ts` | `constants/musclePaths.ts` | 点击热区数据已合入 musclePaths |
| `features/ai/services/FitnessTerminologyService.ts` | `features/ai/services/*` | 无任何引用 |
| `features/ai/tokenTracking.ts` | `hooks/useTokenTracker.ts` + 组件直接引用 | **re-export 桶文件**，无人从它导入 |

### B 类：网页版遗留的调试/测试组件

| 文件 | 说明 |
|---|---|
| `dev/components/DeveloperTestPanel.tsx` | 无引用 |
| `dev/components/SVGPathEditor.tsx` | 无引用（仅 musclePaths 注释里提到名字） |
| `dev/components/SVGPathImporter.tsx` | 无引用 |
| `features/anatomy/components/MuscleAnatomyTester.tsx` | 无引用 |
| `features/anatomy/components/MuscleHighlightTester.tsx` | 无引用 |
| `features/workout/components/WorkoutScenarioTester.tsx` | 无引用 |

### C 类：未接入的功能/服务（网页版曾用或实验性）

| 文件 | 说明 |
|---|---|
| `features/export/services/EnhancedPDFExportService.ts` | 增强 PDF 导出，从未被任何组件引用 |
| `features/export/services/PNGExportService.ts` | PNG 导出，无引用 |
| `services/CalorieMigrationService.ts` | 卡路里数据迁移工具（一次性脚本性质） |
| `services/EnhancedRecoveryService.ts` | 增强恢复计算，无引用 |
| `features/report/components/WeeklyReportComparison.tsx` | 周报对比视图，无引用 |
| `features/report/components/WorkoutReport.tsx` | 被 `WorkoutReportModal.tsx` 取代 |
| `features/report/index.ts` | **barrel 桶文件**，无人从它导入（组件均被直接路径引用） |
| `shared/utils/colorAccessibility.ts` | 颜色可访问性工具，无引用 |
| `hooks/useScrollState.ts` / `hooks/useSharedIntersectionObserver.ts` | **re-export 桶文件**，实际引用全部指向 `shared/video/` 源实现 |

### D 类：CSS

| 文件 | 说明 |
|---|---|
| `src/App.css` | **Vite 模板默认样式**（`#root { max-width: 1280px; padding: 2rem }`），未被任何入口引用。⚠️ 若被误引入会破坏移动端全屏布局 |

---

## 三、仅被 Dev/测试代码引用的文件（2 个）

| 文件 | 被谁引用 |
|---|---|
| `features/export/components/PDFDebugger.tsx` | 仅 `dev/components/PDFDebuggerTestPage.tsx` |
| `features/report/components/MobileWorkoutReportModal.tsx` | 仅 `pages/MobileReportTestPage.tsx` |

> 说明：`dev/components/*` 和 `pages/*TestPage` 通过 `/dev/*` 路由挂载（`App.tsx`），属于调试入口。若不需要保留 dev 路由，可整体移除。

---

## 四、⚠️ 不可删除（分析误报）

| 文件 | 原因 |
|---|---|
| `shared/types/json.d.ts` | **ambient 类型声明**：让 TS 允许 `import x from '*.json'`。虽然"无人显式导入"，但被 tsconfig 全局加载，删除会导致编译报错 |

---

## 五、重复实现对照（功能重叠，建议合并）

| 功能 | 活跃版本 | 冗余版本 |
|---|---|---|
| AI 动作推荐卡片 | `features/ai/components/AiRecommendationCard.tsx` | `features/routine/components/AiRecommendationCard.tsx` |
| AI 结果预览 | `features/ai/components/AiResultPreview.tsx` | `features/routine/components/AiResultPreview.tsx` |
| AI 推荐服务 | `services/EnhancedAIRecommendationService(V2).ts` | `features/routine/services/RoutineAIService.ts` |
| 动作库 | `shared/constants/initial_exercises.ts` (909行) | `features/exercise/constants/initial_exercises.ts` (967行) |
| 导出链路 | `PDFExportService` / `VectorPDFExportService` / `SVGExportService` / `JSONExportService` | `EnhancedPDFExportService.ts`、`PNGExportService.ts` |
| 恢复状态计算 | `services/RecoveryCalculationService.ts` | `services/EnhancedRecoveryService.ts` |

---

## 六、仓库根目录遗留（网页版时代产物）

### 23 个调试 HTML 页面（全部可删，不属于 Vite 构建链）

```
ai-debug-test.html          ai-recommendation-test.html
calorie-debug-tool.html     calorie-migration-tool.html
check-jan8-backend.html     check-jan8-data-complete.html
check-jan8-detail.html      check-storage.html
clear-local-cache.html      clear-routine-duplicates.html
debug-weekly-report-generation.html   debug-weekly-reports.html
diagnose-and-fix.html       fix-weekly-reports.html
refresh-clean-data.html     regenerate-january-reports.html
routine-diagnostic.html     storage-diagnostic-tool.html
test-railway-backend.html   test-sync.html
test-week-calculation.html  verify-workout-data.html
volume-analysis-tool.html
```

### 其他根目录遗留

| 路径 | 说明 | 建议 |
|---|---|---|
| `dist-old/` | 旧构建产物（assets/ + index.html） | 可删 |
| `test_pdf_debugger.html` (202行) | 独立测试页 | 可删 |
| `test_pdf_layout.html` (578行) | 独立测试页 | 可删 |
| `evaluate_compression.py` (104行) | 压缩评估实验脚本 | 可删/归档 |
| `screenshots/devtools-check.png` | 截图 | 可归档 |
| `Library/`（根目录） | 视频 JSON + HTML 模板 | ⚠️ 与 `frontend/public/Library` 疑似重复，删前需对比 |
| `Font/`（根目录） | 字体源文件 | ⚠️ 与 `frontend/public/fonts` 疑似重复，删前需对比 |

---

## 七、清理收益估算

| 项目 | 估算 |
|---|---|
| 可删除 src 文件数 | ~28 个（27 孤儿 + App.css） |
| 可删除根目录文件 | ~26 个（23 HTML + dist-old + 2 测试页 + 1 py） |
| 构建产物瘦身 | `EnhancedPDFExportService`/`PNGExportService` 等未被 tree-shaking 完全消除的模块，bundle 可再减几 KB~几十 KB |
| 心智负担 | **消除 3 组同名组件陷阱**（routine vs ai 的 AiResultPreview/AiRecommendationCard），大幅降低后续改错文件的概率 |

---

## 八、清理执行建议（安全顺序）

1. **备份**：`git add -A && git commit`（确保当前状态可回滚）
2. **第一批（零风险）**：删除所有 `.old.tsx`、`App.css`、根目录 23 个调试 HTML、`dist-old/`、`test_pdf_*.html`、`evaluate_compression.py`
3. **第二批（已确认无引用）**：删除 B/C 类孤儿文件（可用 `git rm` 逐个处理，每批 5-10 个）
4. **第三批（重复实现，需人工确认引用指向）**：先核对 `RoutineCreator.tsx` 的 import 路径，确认指向 `features/ai` 版本后，再删 `features/routine` 的重复文件
5. **验证**：`npm run build` + `npx tsc -b --noEmit`（确认无 `TS2307` 找不到模块错误）
6. **回归**：在 iOS 模拟器跑一遍首页 / 训练 / 周报 / 导出流程

> 💡 建议在 **git 分支** 上执行清理，合并前跑完整测试。

---

## 九、复用工具

本次分析脚本已保存：
- `scripts/analyze-deadcode.cjs` — 引用图分析（支持 `@/` 别名），每次清理后重跑可验证
- `.deadcode-analysis.json` — 完整"文件 → 谁引用了它"映射，可人工复查

---

*报告由 Mobile App Builder 专家生成。*
