**User:**

<task>
经过我的观察，在做了一部分的修复之后，我发现我的cable的json库完全没有被加载到library，现在开始做审查，找到root cause。如果需要读取json文件，不可以一次读取很多，只能一个一个读，并且要经过我的批准。
</task>
[Image]
<environment_details>
# VSCode Visible Files
frontend\src\features\report\components\WorkoutReportModal.tsx,frontend\src\features\anatomy\constants\musclePaths.ts

# VSCode Open Tabs
../Users/Leo X1/.gemini/antigravity/brain/a7136be9-9ecc-4838-9eee-047d05bb0d4e/task.md,../Users/Leo X1/.gemini/antigravity/brain/a7136be9-9ecc-4838-9eee-047d05bb0d4e/walkthrough.md,../Users/Leo X1/.gemini/antigravity/brain/a49a8412-842a-4531-8408-31a3134b7fcb/walkthrough.md,../Users/Leo X1/.gemini/antigravity/brain/b9772538-bba1-4012-b82f-394ff47bc64e/walkthrough.md,../Users/Leo X1/.gemini/antigravity/brain/a49a8412-842a-4531-8408-31a3134b7fcb/implementation_plan.md,components/RoutineBuilder.tsx,services/RoutineAIService.ts,json.d.ts,data/comprehensive_exercises.ts,../Users/Leo X1/.gemini/antigravity/brain/b98bc365-3dbc-4cc3-a6b4-298fb960c167/implementation_plan.md,../Users/Leo X1/.gemini/antigravity/brain/b98bc365-3dbc-4cc3-a6b4-298fb960c167/walkthrough.md,../Users/Leo X1/.gemini/antigravity/brain/86adafe1-02b3-4d87-b107-18d8efbe8475/implementation_plan.md,components/SwipeableCard.tsx,../Users/Leo X1/.gemini/antigravity/brain/14133304-7a83-4026-b3b4-0db98619114b/walkthrough.md,services/SVGExportService.ts,services/VectorPDFExportService.ts,services/PNGExportService.ts,hooks/useAdaptiveHeight.ts,components/AdaptiveHeightContainer.tsx,docs/FUNCTIONALITY_TEST_REPORT.md

# Actively Running Terminals
## Terminal 1 (Active)
### Working Directory: `c:\zenfit`
### Original command: `cd frontend && npm run dev`
## Terminal 2 (Active)
### Working Directory: `c:\zenfit`
### Original command: `cd frontend && npm run dev 2>&1 | findstr /C:"Loaded" /C:"Total exercises"`

# Current Time
Current time in ISO 8601 UTC format: 2025-12-28T12:43:51.874Z
User time zone: Asia/Hong_Kong, UTC+8:00

# Current Cost
$0.00

# Current Mode
<slug>code</slug>
<name>Code</name>
<model>claude-sonnet-4-5-20250929</model>
<tool_format>xml</tool_format>


# Current Workspace Directory (c:/zenfit) Files
.gitignore
connection-log.txt
nixpacks.toml
railway.json
test_pdf_debugger.html
test_pdf_layout.html
zenfit.code-workspace
.vscode/
backend/
backend/.env.example
backend/.gitignore
backend/nodemon.json
backend/package.json
backend/README.md
backend/tsconfig.json
backend/prisma/
backend/prisma/schema.prisma
backend/prisma/schema.prisma.backup
backend/src/
backend/src/index.ts
backend/src/controllers/
backend/src/controllers/aiController.ts
backend/src/db/
backend/src/db/client.ts
backend/src/middleware/
backend/src/middleware/authMiddleware.ts
backend/src/routes/
backend/src/routes/ai.ts
backend/src/routes/auth.ts
backend/src/routes/health.ts
backend/src/routes/profile.ts
backend/src/routes/workout.ts
backend/src/services/
backend/src/services/geminiService.ts
backend/src/types/
backend/src/types/index.ts
backend/src/types/profile.ts
backend/src/types/workout.ts
backend/src/utils/
backend/src/utils/auth.ts
backend/src/validators/
backend/src/validators/profileValidator.ts
backend/src/validators/workoutValidator.ts
docs/
docs/ACTIVE_WORKOUT_TIMER_UI_FIX_SUMMARY.md
docs/ACTIVE_WORKOUT_TIMER_UI_FIX.md
docs/AI_COMPONENT_DUPLICATE_FIX.md
docs/BACKEND_PHASE1_EXECUTION_PLAN.md
docs/DATA_IMPORT_RULES.md
docs/EXERCISE_LIBRARY_AUDIT_REPORT.md
docs/EXPO_MOBILE_SETUP_GUIDE.md
docs/FRONTEND_BACKEND_INTEGRATION_PLAN.md
docs/FRONTEND_BACKEND_SEPARATION_ROADMAP.md
docs/FUNCTIONALITY_TEST_REPORT.md
docs/GIT_BRANCH_CLEANUP_GUIDE.md
docs/GIT_WORKFLOW_GUIDE.md
docs/IOS_APP_VIDEO_CONFIGURATION.md
docs/MIGRATION_STEPS.md
docs/MOBILE_APP_IMPLEMENTATION_PLAN.md
docs/MOBILE_APP_QUICK_START.md
docs/MOBILE_APP_SETUP_GUIDE.md
docs/MUSCLE_ANATOMY_DEVELOPMENT_PLAN.md
docs/MUSCLE_PATH_UPDATE_TEST_GUIDE.md
docs/MUSCLE_SELECTION_FEEDBACK_IMPROVEMENTS.md
docs/MUSCLE_VIEW_ANALYSIS.md
docs/PDF_DEBUGGER_GUIDE.md
docs/PDF_DEBUGGER_STARTUP_GUIDE.md
docs/PDF_EXPORT_SERVICE_FIX.md
docs/PDF_GENERATION_TECHNICAL_DOCUMENTATION.md
docs/PDF_LAYOUT_FIX_V2.md
docs/PDF_LAYOUT_OPTIMIZATION.md
docs/PDF_MUSCLE_HIGHLIGHT_ENHANCEMENT_PR.md
docs/PDF_SWISS_STYLE_REFACTOR.md
docs/PDF_TEST_GUIDE.md
docs/PHASE_0-1_COMPLETION_SUMMARY.md
docs/PHASE_2_COMPLETION_SUMMARY.md
docs/PHASE_5_BATCH_3_4_MIGRATION_PLAN.md
docs/PHASE4_EXECUTION_PLAN.md
docs/RAILWAY_COMPLETE_CONFIG.md
docs/RAILWAY_DEPLOYMENT_GUIDE.md
docs/RAILWAY_DEPLOYMENT_TROUBLESHOOTING.md
docs/REFACTORING_STRUCTURE_PLAN.md
docs/STEP_1_TAB_UI_IMPLEMENTATION.md
docs/STEP1_PR_CHECKLIST.md
docs/SVG_EDITOR_OUTLINE_ENHANCEMENT_GUIDE.md
docs/SVG_EDITOR_VIEW_TYPE_TEST_GUIDE.md
docs/TRAPS_FRONT_RENDERING_FIX_GUIDE.md
docs/WORKOUT_FLOW_ISSUE_ANALYSIS.md
docs/ZenFit-Phase0-Anatomy-Plan.md
Font/
Font/NotoSansSC-VariableFont_wght.ttf
Font/OFL.txt
Font/README.txt
Font/static/
Font/static/NotoSansSC-Black.ttf
Font/static/NotoSansSC-Bold.ttf
Font/static/NotoSansSC-ExtraBold.ttf
Font/static/NotoSansSC-ExtraLight.ttf
Font/static/NotoSansSC-Light.ttf
Font/static/NotoSansSC-Medium.ttf
Font/static/NotoSansSC-Regular.ttf
Font/static/NotoSansSC-SemiBold.ttf
Font/static/NotoSansSC-Thin.ttf
frontend/
frontend/.gitignore
frontend/eslint.config.js
frontend/index.html
frontend/package.json
frontend/postcss.config.js
frontend/README.md
frontend/tailwind.config.js
frontend/tsc_output.txt
frontend/tsconfig.app.json
frontend/tsconfig.json
frontend/tsconfig.node.json
frontend/vite.config.ts
frontend/public/
frontend/public/vite.svg
frontend/public/fonts/
frontend/public/fonts/Inter-Bold.ttf
frontend/public/fonts/Inter-Regular.ttf
frontend/public/fonts/Inter-SemiBold.ttf
frontend/public/fonts/NotoSansSC-Bold.ttf
frontend/public/fonts/NotoSansSC-Regular.ttf
frontend/public/fonts/Oswald-Bold.ttf
frontend/public/fonts/Oswald-ExtraLight.ttf
frontend/public/fonts/Oswald-Light.ttf
frontend/public/fonts/Oswald-Medium.ttf
frontend/public/fonts/Oswald-Regular.ttf
frontend/public/fonts/Oswald-SemiBold.ttf
frontend/public/Library/
frontend/public/Library/band-final-video.json
frontend/public/Library/barbell-final-video.json
frontend/public/Library/bodyweigh-final-video.json
frontend/public/Library/cables-final-video.json
frontend/public/Library/dumbbell-final-video.json
frontend/public/Library/machine-final-video.json
frontend/public/Library/recovery-final-video.json
frontend/public/Library/smith-final-video.json
frontend/src/
frontend/src/App.css
frontend/src/App.tsx
frontend/src/index.css
frontend/src/main.tsx
frontend/src/assets/
frontend/src/assets/react.svg
frontend/src/components/
frontend/src/components/PrivateRoute.tsx
frontend/src/components/Toast.tsx
frontend/src/context/
frontend/src/context/AuthContext.tsx
frontend/src/dev/
frontend/src/dev/components/
frontend/src/dev/components/AuthProfileTestPanel.tsx
frontend/src/dev/components/Detail1PathAnalyzer.tsx
frontend/src/dev/components/DeveloperTestPanel.tsx
frontend/src/dev/components/PDFDebuggerTestPage.tsx
frontend/src/dev/components/PDFSVGPathTester.tsx
frontend/src/dev/components/SVGPathEditor.tsx
frontend/src/dev/components/SVGPathImporter.tsx
frontend/src/dev/components/WorkoutTestPanel.tsx
frontend/src/features/
frontend/src/features/ai/
frontend/src/features/ai/components/
frontend/src/features/ai/components/AiConfigModal.tsx
frontend/src/features/ai/components/AiRecommendationCard.tsx
frontend/src/features/ai/components/AIRecommendationPanel.tsx
frontend/src/features/ai/components/AiResultPreview.tsx
frontend/src/features/ai/services/
frontend/src/features/ai/services/AIRecommendationService.ts
frontend/src/features/ai/services/geminiService.ts
frontend/src/features/ai/services/perplexityService.ts
frontend/src/features/anatomy/
frontend/src/features/anatomy/components/
frontend/src/features/anatomy/components/MuscleAnatomyTester.tsx
frontend/src/features/anatomy/components/MuscleAnatomyViewer.tsx
frontend/src/features/anatomy/components/MuscleHighlightTester.tsx
frontend/src/features/anatomy/constants/
frontend/src/features/anatomy/constants/muscleColors.ts
frontend/src/features/anatomy/constants/muscleHitboxes.ts
frontend/src/features/anatomy/constants/musclePaths.ts
frontend/src/features/anatomy/services/
frontend/src/features/anatomy/services/MuscleHighlightService.ts
frontend/src/features/exercise/
frontend/src/features/exercise/components/
frontend/src/features/exercise/components/ExerciseLibraryView.tsx
frontend/src/features/exercise/components/ExerciseSelector.tsx
frontend/src/features/exercise/components/HeroExerciseCard.tsx
frontend/src/features/exercise/components/VideoPlayer.tsx
frontend/src/features/exercise/constants/
frontend/src/features/exercise/constants/initial_exercises.ts
frontend/src/features/exercise/data/
frontend/src/features/exercise/data/comprehensive_exercises.ts
frontend/src/features/exercise/services/
frontend/src/features/exercise/services/ExerciseNameMappingService.ts
frontend/src/features/export/
frontend/src/features/export/components/
frontend/src/features/export/components/PDFDebugger.tsx
frontend/src/features/export/components/PDFExportOptionsModal.tsx
frontend/src/features/export/constants/

(File list truncated. Use list_files on specific subdirectories if you need to explore further.)
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

我看到问题了！从终端输出可以清楚地看到：

```
Loaded 0 exercise mappings from cables-final-video.json
```

而其他文件都正常加载了（barbell: 174, dumbbell: 266, bodyweigh: 180等）。这说明cables的JSON文件没有被正确加载。

让我先检查ExerciseNameMappingService.ts来了解加载逻辑：

<read_file>
<args>
  <file>
    <path>frontend/src/features/exercise/services/ExerciseNameMappingService.ts</path>
  </file>
</args>
</read_file>

---

**User:**

[read_file for 'frontend/src/features/exercise/services/ExerciseNameMappingService.ts'. Reading multiple files at once is more efficient for the LLM. If other files are relevant to your current task, please read them simultaneously.] Result:
<files>
<file><path>frontend/src/features/exercise/services/ExerciseNameMappingService.ts</path>
<content lines="1-220">
  1 | /**
  2 |  * Exercise Name Mapping Service
  3 |  * 
  4 |  * This service provides comprehensive mapping between English and Chinese exercise names
  5 |  * by reading from all Library JSON files (8 equipment categories).
  6 |  * 
  7 |  * Data Structure from Library JSON files:
  8 |  * - exercise_name_zh: Chinese exercise name
  9 |  * - exercise_name: English exercise name (in some files)
 10 |  * - muscle_module_en: English muscle module identifier
 11 |  * - equipment_type_zh: Chinese equipment type
 12 |  */
 13 | 
 14 | interface LibraryExercise {
 15 |     exercise_name_zh: string;
 16 |     exercise_name?: string;
 17 |     muscle_module_en: string;
 18 |     equipment_type_zh: string;
 19 |     muscle_ids: string[];
 20 |     muscle_ids_zh: string[];
 21 |     difficulty: string;
 22 |     mechanic: string;
 23 |     equipment_type: string;
 24 | }
 25 | 
 26 | interface LibraryData {
 27 |     total_exercise_count: number;
 28 |     data?: LibraryExercise[];
 29 |     exercises?: LibraryExercise[];
 30 | }
 31 | 
 32 | class ExerciseNameMappingService {
 33 |     private exerciseMap: Map<string, string> = new Map();
 34 |     private reverseMap: Map<string, string> = new Map();
 35 |     private isInitialized = false;
 36 | 
 37 |     /**
 38 |      * Initialize the mapping service by loading all Library JSON files
 39 |      */
 40 |     async initialize(): Promise<void> {
 41 |         if (this.isInitialized) return;
 42 | 
 43 |         const libraryFiles = [
 44 |             'barbell-final-video.json',
 45 |             'dumbbell-final-video.json',
 46 |             'bodyweigh-final-video.json',
 47 |             'cables-final-video.json',
 48 |             'machine-final-video.json',
 49 |             'band-final-video.json',
 50 |             'smith-final-video.json',
 51 |             'recovery-final-video.json'
 52 |         ];
 53 | 
 54 |         try {
 55 |             for (const filename of libraryFiles) {
 56 |                 await this.loadLibraryFile(filename);
 57 |             }
 58 | 
 59 |             console.log(`✅ Exercise mapping initialized with ${this.exerciseMap.size} exercises from ${libraryFiles.length} equipment categories`);
 60 |             this.isInitialized = true;
 61 |         } catch (error) {
 62 |             console.error('❌ Failed to initialize exercise mapping:', error);
 63 |             throw error;
 64 |         }
 65 |     }
 66 | 
 67 |     /**
 68 |      * Load a single Library JSON file and extract exercise mappings
 69 |      */
 70 |     private async loadLibraryFile(filename: string): Promise<void> {
 71 |         try {
 72 |             const response = await fetch(`/Library/${filename}`);
 73 |             if (!response.ok) {
 74 |                 throw new Error(`Failed to fetch ${filename}: ${response.status}`);
 75 |             }
 76 | 
 77 |             const data: LibraryData = await response.json();
 78 |             const exercises = data.data || data.exercises || [];
 79 | 
 80 |             let mappedCount = 0;
 81 |             for (const exercise of exercises) {
 82 |                 if (exercise.exercise_name_zh && exercise.muscle_module_en) {
 83 |                     // Map English identifier to Chinese name
 84 |                     this.exerciseMap.set(exercise.muscle_module_en, exercise.exercise_name_zh);
 85 | 
 86 |                     // Create reverse mapping (Chinese to English)
 87 |                     this.reverseMap.set(exercise.exercise_name_zh, exercise.muscle_module_en);
 88 | 
 89 |                     // Also map exercise_name if available
 90 |                     if (exercise.exercise_name) {
 91 |                         this.exerciseMap.set(exercise.exercise_name, exercise.exercise_name_zh);
 92 |                         this.reverseMap.set(exercise.exercise_name_zh, exercise.exercise_name);
 93 |                     }
 94 | 
 95 |                     mappedCount++;
 96 |                 }
 97 |             }
 98 | 
 99 |             console.log(`📚 Loaded ${mappedCount} exercise mappings from ${filename}`);
100 |         } catch (error) {
101 |             console.error(`❌ Error loading ${filename}:`, error);
102 |             // Continue loading other files even if one fails
103 |         }
104 |     }
105 | 
106 |     /**
107 |      * Get Chinese name for an English exercise identifier
108 |      */
109 |     getChineseName(englishName: string): string {
110 |         if (!this.isInitialized) {
111 |             console.warn('⚠️ Exercise mapping not initialized, returning original name');
112 |             return englishName;
113 |         }
114 | 
115 |         const chineseName = this.exerciseMap.get(englishName);
116 |         if (chineseName) {
117 |             return chineseName;
118 |         }
119 | 
120 |         // Try fuzzy matching for common variations
121 |         const fuzzyMatch = this.findFuzzyMatch(englishName);
122 |         if (fuzzyMatch) {
123 |             return fuzzyMatch;
124 |         }
125 | 
126 |         console.log(`🔍 No Chinese mapping found for: "${englishName}"`);
127 |         return englishName; // Return original if no mapping found
128 |     }
129 | 
130 |     /**
131 |      * Get English name for a Chinese exercise name
132 |      */
133 |     getEnglishName(chineseName: string): string {
134 |         if (!this.isInitialized) {
135 |             console.warn('⚠️ Exercise mapping not initialized, returning original name');
136 |             return chineseName;
137 |         }
138 | 
139 |         const englishName = this.reverseMap.get(chineseName);
140 |         return englishName || chineseName;
141 |     }
142 | 
143 |     /**
144 |      * Fuzzy matching for exercise names with common variations
145 |      */
146 |     private findFuzzyMatch(englishName: string): string | null {
147 |         const normalizedInput = englishName.toLowerCase().trim();
148 | 
149 |         // Try exact match first (case insensitive)
150 |         for (const [key, value] of this.exerciseMap.entries()) {
151 |             if (key.toLowerCase() === normalizedInput) {
152 |                 return value;
153 |             }
154 |         }
155 | 
156 |         // Try partial matching for compound exercise names
157 |         for (const [key, value] of this.exerciseMap.entries()) {
158 |             const normalizedKey = key.toLowerCase();
159 | 
160 |             // Check if the input contains the key or vice versa
161 |             if (normalizedInput.includes(normalizedKey) || normalizedKey.includes(normalizedInput)) {
162 |                 return value;
163 |             }
164 |         }
165 | 
166 |         return null;
167 |     }
168 | 
169 |     /**
170 |      * Get all available exercise mappings
171 |      */
172 |     getAllMappings(): Array<{ english: string; chinese: string }> {
173 |         const mappings: Array<{ english: string; chinese: string }> = [];
174 | 
175 |         for (const [english, chinese] of this.exerciseMap.entries()) {
176 |             mappings.push({ english, chinese });
177 |         }
178 | 
179 |         return mappings.sort((a, b) => a.english.localeCompare(b.english));
180 |     }
181 | 
182 |     /**
183 |      * Get mapping statistics
184 |      */
185 |     getStats(): { totalMappings: number; isInitialized: boolean } {
186 |         return {
187 |             totalMappings: this.exerciseMap.size,
188 |             isInitialized: this.isInitialized
189 |         };
190 |     }
191 | 
192 |     /**
193 |      * Search for exercises by partial name (both English and Chinese)
194 |      */
195 |     searchExercises(query: string): Array<{ english: string; chinese: string }> {
196 |         const normalizedQuery = query.toLowerCase().trim();
197 |         const results: Array<{ english: string; chinese: string }> = [];
198 | 
199 |         for (const [english, chinese] of this.exerciseMap.entries()) {
200 |             if (
201 |                 english.toLowerCase().includes(normalizedQuery) ||
202 |                 chinese.includes(query) // Chinese characters are case-sensitive
203 |             ) {
204 |                 results.push({ english, chinese });
205 |             }
206 |         }
207 | 
208 |         return results.slice(0, 20); // Limit results to prevent UI overflow
209 |     }
210 | }
211 | 
212 | // Create singleton instance
213 | export const exerciseNameMapping = new ExerciseNameMappingService();
214 | 
215 | // Auto-initialize when the module is imported
216 | exerciseNameMapping.initialize().catch(error => {
217 |     console.error('❌ Failed to auto-initialize exercise mapping:', error);
218 | });
219 | 
220 | export default exerciseNameMapping;
</content>
</file>
</files>
<environment_details>
# VSCode Visible Files
frontend\src\features\report\components\WorkoutReportModal.tsx,frontend\src\features\anatomy\constants\musclePaths.ts

# VSCode Open Tabs
../Users/Leo X1/.gemini/antigravity/brain/a7136be9-9ecc-4838-9eee-047d05bb0d4e/task.md,../Users/Leo X1/.gemini/antigravity/brain/a7136be9-9ecc-4838-9eee-047d05bb0d4e/walkthrough.md,../Users/Leo X1/.gemini/antigravity/brain/a49a8412-842a-4531-8408-31a3134b7fcb/walkthrough.md,../Users/Leo X1/.gemini/antigravity/brain/b9772538-bba1-4012-b82f-394ff47bc64e/walkthrough.md,../Users/Leo X1/.gemini/antigravity/brain/a49a8412-842a-4531-8408-31a3134b7fcb/implementation_plan.md,components/RoutineBuilder.tsx,services/RoutineAIService.ts,json.d.ts,data/comprehensive_exercises.ts,../Users/Leo X1/.gemini/antigravity/brain/b98bc365-3dbc-4cc3-a6b4-298fb960c167/implementation_plan.md,../Users/Leo X1/.gemini/antigravity/brain/b98bc365-3dbc-4cc3-a6b4-298fb960c167/walkthrough.md,../Users/Leo X1/.gemini/antigravity/brain/86adafe1-02b3-4d87-b107-18d8efbe8475/implementation_plan.md,components/SwipeableCard.tsx,../Users/Leo X1/.gemini/antigravity/brain/14133304-7a83-4026-b3b4-0db98619114b/walkthrough.md,services/SVGExportService.ts,services/VectorPDFExportService.ts,services/PNGExportService.ts,hooks/useAdaptiveHeight.ts,components/AdaptiveHeightContainer.tsx,docs/FUNCTIONALITY_TEST_REPORT.md

# Actively Running Terminals
## Terminal 1 (Active)
### Working Directory: `c:\zenfit`
### Original command: `cd frontend && npm run dev`
## Terminal 2 (Active)
### Working Directory: `c:\zenfit`
### Original command: `cd frontend && npm run dev 2>&1 | findstr /C:"Loaded" /C:"Total exercises"`

# Current Time
Current time in ISO 8601 UTC format: 2025-12-28T12:44:07.688Z
User time zone: Asia/Hong_Kong, UTC+8:00

# Current Cost
$0.00

# Current Mode
<slug>code</slug>
<name>Code</name>
<model>claude-sonnet-4-5-20250929</model>
<tool_format>xml</tool_format>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

现在我需要检查cables-final-video.json文件，看看它的数据结构是否与其他文件不同。让我读取这个文件：

<read_file>
<args>
  <file>
    <path>frontend/public/Library/cables-final-video.json</path>
  </file>
</args>
</read_file>

---

**User:**

[read_file for 'frontend/public/Library/cables-final-video.json'. Reading multiple files at once is more efficient for the LLM. If other files are relevant to your current task, please read them simultaneously.] Result:
<files>
<file><path>frontend/public/Library/cables-final-video.json</path>
<content lines="1-2349">
   1 | {
   2 |   "metadata": {
   3 |     "total_urls": 156,
   4 |     "success_count": 156,
   5 |     "failed_count": 12,
   6 |     "scraped_at": "2025-11-27T08:39:33.477Z"
   7 |   },
   8 |   "exercises": [
   9 |     {
  10 |       "exercise_name": "Cable Bar Kneeling Crunch",
  11 |       "exercise_name_zh": "绳索跪姿直杆卷腹",
  12 |       "secondary_muscles": [],
  13 |       "difficulty": "Beginner",
  14 |       "url": "https://musclewiki.com/cables/male/abdominals/cable-bar-kneeling-crunch",
  15 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-kneeling-crunch-front.mp4",
  16 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-kneeling-crunch-side.mp4",
  17 |       "mechanic": "Isolation",
  18 |       "equipment_type": "cables",
  19 |       "equipment_type_zh": "绳索",
  20 |       "muscle_ids": [
  21 |         "Abdominals"
  22 |       ]
  23 |     },
  24 |     {
  25 |       "exercise_name": "Cable Bar Standing Crunch",
  26 |       "exercise_name_zh": "绳索站姿直杆卷腹",
  27 |       "secondary_muscles": [],
  28 |       "difficulty": "Beginner",
  29 |       "url": "https://musclewiki.com/cables/male/abdominals/cable-bar-standing-crunch",
  30 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-standing-crunch-front.mp4",
  31 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-standing-crunch-side.mp4",
  32 |       "mechanic": "Isolation",
  33 |       "equipment_type": "cables",
  34 |       "equipment_type_zh": "绳索",
  35 |       "muscle_ids": [
  36 |         "Abdominals"
  37 |       ]
  38 |     },
  39 |     {
  40 |       "exercise_name": "Cable Kneeling High To Low Wood Chopper",
  41 |       "exercise_name_zh": "绳索跪姿高位",
  42 |       "secondary_muscles": [],
  43 |       "difficulty": "Beginner",
  44 |       "url": "https://musclewiki.com/cables/male/abdominals/cable-kneeling-high-to-low-wood-chopper",
  45 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-kneeling-high-to-low-wood-chopper-front.mp4",
  46 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-kneeling-high-to-low-wood-chopper-side.mp4",
  47 |       "mechanic": "Isolation",
  48 |       "equipment_type": "cables",
  49 |       "equipment_type_zh": "绳索",
  50 |       "muscle_ids": [
  51 |         "Abdominals"
  52 |       ]
  53 |     },
  54 |     {
  55 |       "exercise_name": "Cable Rope Kneeling Crunch",
  56 |       "exercise_name_zh": "跪姿绳索卷腹",
  57 |       "secondary_muscles": [],
  58 |       "difficulty": "Beginner",
  59 |       "url": "https://musclewiki.com/cables/male/abdominals/cable-rope-kneeling-crunch",
  60 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-kneeling-crunch-front.mp4",
  61 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-kneeling-crunch-side.mp4",
  62 |       "mechanic": "Isolation",
  63 |       "equipment_type": "cables",
  64 |       "equipment_type_zh": "绳索",
  65 |       "muscle_ids": [
  66 |         "Abdominals"
  67 |       ]
  68 |     },
  69 |     {
  70 |       "exercise_name": "Cable Rope Kneeling Oblique Crunch",
  71 |       "exercise_name_zh": "绳索跪姿侧腹卷腹",
  72 |       "secondary_muscles": [],
  73 |       "difficulty": "Beginner",
  74 |       "url": "https://musclewiki.com/cables/male/abdominals/cable-rope-kneeling-oblique-crunch",
  75 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-kneeling-oblique-crunch-front.mp4",
  76 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-kneeling-oblique-crunch-side.mp4",
  77 |       "mechanic": "Isolation",
  78 |       "equipment_type": "cables",
  79 |       "equipment_type_zh": "绳索",
  80 |       "muscle_ids": [
  81 |         "Abdominals"
  82 |       ]
  83 |     },
  84 |     {
  85 |       "exercise_name": "Cable Rope Standing Crunch",
  86 |       "exercise_name_zh": "绳索站姿卷腹",
  87 |       "secondary_muscles": [],
  88 |       "difficulty": "Beginner",
  89 |       "url": "https://musclewiki.com/cables/male/abdominals/cable-rope-standing-crunch",
  90 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-standing-crunch-front.mp4",
  91 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-standing-crunch-side.mp4",
  92 |       "mechanic": "Isolation",
  93 |       "equipment_type": "cables",
  94 |       "equipment_type_zh": "绳索",
  95 |       "muscle_ids": [
  96 |         "Abdominals"
  97 |       ]
  98 |     },
  99 |     {
 100 |       "exercise_name": "Cable Row Bar Kneeling Crunch",
 101 |       "exercise_name_zh": "绳索跪姿卷腹（划杆）",
 102 |       "secondary_muscles": [],
 103 |       "difficulty": "Beginner",
 104 |       "url": "https://musclewiki.com/cables/male/abdominals/cable-row-bar-kneeling-crunch",
 105 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-row-bar-kneeling-crunch-front.mp4",
 106 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-row-bar-kneeling-crunch-side.mp4",
 107 |       "mechanic": "Isolation",
 108 |       "equipment_type": "cables",
 109 |       "equipment_type_zh": "绳索",
 110 |       "muscle_ids": [
 111 |         "Abdominals"
 112 |       ]
 113 |     },
 114 |     {
 115 |       "exercise_name": "Cable Standing Crunch",
 116 |       "exercise_name_zh": "站姿绳索卷腹",
 117 |       "secondary_muscles": [],
 118 |       "difficulty": "Beginner",
 119 |       "url": "https://musclewiki.com/cables/male/abdominals/cable-standing-crunch",
 120 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-crunch-front.mp4",
 121 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-crunch-side.mp4",
 122 |       "mechanic": "Isolation",
 123 |       "equipment_type": "cables",
 124 |       "equipment_type_zh": "绳索",
 125 |       "muscle_ids": [
 126 |         "Abdominals"
 127 |       ]
 128 |     },
 129 |     {
 130 |       "exercise_name": "Cable Standing High To Low Wood Chopper",
 131 |       "exercise_name_zh": "绳索站姿高位",
 132 |       "secondary_muscles": [],
 133 |       "difficulty": "Beginner",
 134 |       "url": "https://musclewiki.com/cables/male/abdominals/cable-standing-high-to-low-wood-chopper",
 135 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-high-to-low-wood-chopper-front.mp4",
 136 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-high-to-low-wood-chopper-side.mp4",
 137 |       "mechanic": "Isolation",
 138 |       "equipment_type": "cables",
 139 |       "equipment_type_zh": "绳索",
 140 |       "muscle_ids": [
 141 |         "Abdominals"
 142 |       ]
 143 |     },
 144 |     {
 145 |       "exercise_name": "Cable Standing Low To High Wood Chopper",
 146 |       "exercise_name_zh": "绳索站姿高位",
 147 |       "secondary_muscles": [],
 148 |       "difficulty": "Beginner",
 149 |       "url": "https://musclewiki.com/cables/male/abdominals/cable-standing-low-to-high-wood-chopper",
 150 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-low-to-high-wood-chopper-front.mp4",
 151 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-low-to-high-wood-chopper-side.mp4",
 152 |       "mechanic": "Isolation",
 153 |       "equipment_type": "cables",
 154 |       "equipment_type_zh": "绳索",
 155 |       "muscle_ids": [
 156 |         "Abdominals"
 157 |       ]
 158 |     },
 159 |     {
 160 |       "exercise_name": "Cable Bench Press",
 161 |       "exercise_name_zh": "绳索卧推",
 162 |       "secondary_muscles": [],
 163 |       "difficulty": "Beginner",
 164 |       "url": "https://musclewiki.com/cables/male/anterior-deltoid/cable-bench-press",
 165 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bench-press-front.mp4",
 166 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bench-press-side.mp4",
 167 |       "mechanic": "Isolation",
 168 |       "equipment_type": "cables",
 169 |       "equipment_type_zh": "绳索",
 170 |       "muscle_ids": [
 171 |         "Anterior Deltoid"
 172 |       ]
 173 |     },
 174 |     {
 175 |       "exercise_name": "Cable Chest Press",
 176 |       "exercise_name_zh": "绳索胸推",
 177 |       "secondary_muscles": [],
 178 |       "difficulty": "Beginner",
 179 |       "url": "https://musclewiki.com/cables/male/anterior-deltoid/cable-chest-press",
 180 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-chest-press-front.mp4",
 181 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-chest-press-side.mp4",
 182 |       "mechanic": "Isolation",
 183 |       "equipment_type": "cables",
 184 |       "equipment_type_zh": "绳索",
 185 |       "muscle_ids": [
 186 |         "Anterior Deltoid"
 187 |       ]
 188 |     },
 189 |     {
 190 |       "exercise_name": "Cable Decline Bench Press",
 191 |       "exercise_name_zh": "下斜绳索卧推",
 192 |       "secondary_muscles": [],
 193 |       "difficulty": "Beginner",
 194 |       "url": "https://musclewiki.com/cables/male/anterior-deltoid/cable-decline-bench-press",
 195 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-decline-bench-press-front.mp4",
 196 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-decline-bench-press-side.mp4",
 197 |       "mechanic": "Isolation",
 198 |       "equipment_type": "cables",
 199 |       "equipment_type_zh": "绳索",
 200 |       "muscle_ids": [
 201 |         "Anterior Deltoid"
 202 |       ]
 203 |     },
 204 |     {
 205 |       "exercise_name": "Cable Decline Single Arm Bench Press",
 206 |       "exercise_name_zh": "下斜单臂拉力器卧推",
 207 |       "secondary_muscles": [],
 208 |       "difficulty": "Beginner",
 209 |       "url": "https://musclewiki.com/cables/male/anterior-deltoid/cable-decline-single-arm-bench-press",
 210 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-decline-single-arm-bench-press-front.mp4",
 211 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-decline-single-arm-bench-press-side.mp4",
 212 |       "mechanic": "Isolation",
 213 |       "equipment_type": "cables",
 214 |       "equipment_type_zh": "绳索",
 215 |       "muscle_ids": [
 216 |         "Anterior Deltoid"
 217 |       ]
 218 |     },
 219 |     {
 220 |       "exercise_name": "Cable Single Arm Bench Press",
 221 |       "exercise_name_zh": "单臂绳索卧推",
 222 |       "secondary_muscles": [],
 223 |       "difficulty": "Beginner",
 224 |       "url": "https://musclewiki.com/cables/male/anterior-deltoid/cable-single-arm-bench-press",
 225 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-bench-press-front.mp4",
 226 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-bench-press-side.mp4",
 227 |       "mechanic": "Isolation",
 228 |       "equipment_type": "cables",
 229 |       "equipment_type_zh": "绳索",
 230 |       "muscle_ids": [
 231 |         "Anterior Deltoid"
 232 |       ]
 233 |     },
 234 |     {
 235 |       "exercise_name": "Cable Standing Single Arm Chest Press",
 236 |       "exercise_name_zh": "绳索站姿单臂胸推",
 237 |       "secondary_muscles": [],
 238 |       "difficulty": "Beginner",
 239 |       "url": "https://musclewiki.com/cables/male/anterior-deltoid/cable-standing-single-arm-chest-press",
 240 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-single-arm-chest-press-front.mp4",
 241 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-single-arm-chest-press-side.mp4",
 242 |       "mechanic": "Isolation",
 243 |       "equipment_type": "cables",
 244 |       "equipment_type_zh": "绳索",
 245 |       "muscle_ids": [
 246 |         "Anterior Deltoid"
 247 |       ]
 248 |     },
 249 |     {
 250 |       "exercise_name": "Cable Standing Single Arm Incline Chest Press",
 251 |       "exercise_name_zh": "绳索站姿上斜单臂胸推",
 252 |       "secondary_muscles": [],
 253 |       "difficulty": "Beginner",
 254 |       "url": "https://musclewiki.com/cables/male/anterior-deltoid/cable-standing-single-arm-incline-chest-press",
 255 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-single-arm-incline-chest-press-front.mp4",
 256 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-single-arm-incline-chest-press-side.mp4",
 257 |       "mechanic": "Isolation",
 258 |       "equipment_type": "cables",
 259 |       "equipment_type_zh": "绳索",
 260 |       "muscle_ids": [
 261 |         "Anterior Deltoid"
 262 |       ]
 263 |     },
 264 |     {
 265 |       "exercise_name": "Cable Archer Row",
 266 |       "exercise_name_zh": "绳索弓箭划船",
 267 |       "secondary_muscles": [],
 268 |       "difficulty": "Beginner",
 269 |       "url": "https://musclewiki.com/cables/male/biceps/cable-archer-row",
 270 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-archer-row-front.mp4",
 271 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-archer-row-side.mp4",
 272 |       "mechanic": "Isolation",
 273 |       "equipment_type": "cables",
 274 |       "equipment_type_zh": "绳索",
 275 |       "muscle_ids": [
 276 |         "Biceps"
 277 |       ]
 278 |     },
 279 |     {
 280 |       "exercise_name": "Cable Bar Curl",
 281 |       "exercise_name_zh": "绳索直杆弯举",
 282 |       "secondary_muscles": [],
 283 |       "difficulty": "Beginner",
 284 |       "url": "https://musclewiki.com/cables/male/biceps/cable-bar-curl",
 285 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-curl-front.mp4",
 286 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-curl-side.mp4",
 287 |       "mechanic": "Isolation",
 288 |       "equipment_type": "cables",
 289 |       "equipment_type_zh": "绳索",
 290 |       "muscle_ids": [
 291 |         "Biceps"
 292 |       ]
 293 |     },
 294 |     {
 295 |       "exercise_name": "Cable Bilateral Bayesian Curl",
 296 |       "exercise_name_zh": "绳索贝叶斯弯举",
 297 |       "secondary_muscles": [],
 298 |       "difficulty": "Beginner",
 299 |       "url": "https://musclewiki.com/cables/male/biceps/cable-bilateral-bayesian-curl",
 300 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bilateral-bayesian-curl-front.mp4",
 301 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bilateral-bayesian-curl-side.mp4",
 302 |       "mechanic": "Isolation",
 303 |       "equipment_type": "cables",
 304 |       "equipment_type_zh": "绳索",
 305 |       "muscle_ids": [
 306 |         "Biceps"
 307 |       ]
 308 |     },
 309 |     {
 310 |       "exercise_name": "Cable Hammer Bayesian Curl",
 311 |       "exercise_name_zh": "绳索锤式弯举（Bayesian）",
 312 |       "secondary_muscles": [],
 313 |       "difficulty": "Beginner",
 314 |       "url": "https://musclewiki.com/cables/male/biceps/cable-hammer-bayesian-curl",
 315 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-hammer-bayesian-curl-front.mp4",
 316 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-hammer-bayesian-curl-side.mp4",
 317 |       "mechanic": "Isolation",
 318 |       "equipment_type": "cables",
 319 |       "equipment_type_zh": "绳索",
 320 |       "muscle_ids": [
 321 |         "Biceps"
 322 |       ]
 323 |     },
 324 |     {
 325 |       "exercise_name": "Cable High Bayesian Curl",
 326 |       "exercise_name_zh": "高位绳索Bayesian弯举",
 327 |       "secondary_muscles": [],
 328 |       "difficulty": "Beginner",
 329 |       "url": "https://musclewiki.com/cables/male/biceps/cable-high-bayesian-curl",
 330 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-bayesian-curl-front.mp4",
 331 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-bayesian-curl-side.mp4",
 332 |       "mechanic": "Isolation",
 333 |       "equipment_type": "cables",
 334 |       "equipment_type_zh": "绳索",
 335 |       "muscle_ids": [
 336 |         "Biceps"
 337 |       ]
 338 |     },
 339 |     {
 340 |       "exercise_name": "Cable High Single Arm Hammer Bayesian Curl",
 341 |       "exercise_name_zh": "绳索高位单臂贝叶斯",
 342 |       "secondary_muscles": [],
 343 |       "difficulty": "Beginner",
 344 |       "url": "https://musclewiki.com/cables/male/biceps/cable-high-single-arm-hammer-bayesian-curl",
 345 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-single-arm-hammer-bayesian-curl-front.mp4",
 346 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-single-arm-hammer-bayesian-curl-side.mp4",
 347 |       "mechanic": "Isolation",
 348 |       "equipment_type": "cables",
 349 |       "equipment_type_zh": "绳索",
 350 |       "muscle_ids": [
 351 |         "Biceps"
 352 |       ]
 353 |     },
 354 |     {
 355 |       "exercise_name": "Cable High Single Arm Hammer Rolling Curl",
 356 |       "exercise_name_zh": "绳索高位单臂",
 357 |       "secondary_muscles": [],
 358 |       "difficulty": "Beginner",
 359 |       "url": "https://musclewiki.com/cables/male/biceps/cable-high-single-arm-hammer-rolling-curl",
 360 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-single-arm-hammer-rolling-curl-front.mp4",
 361 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-single-arm-hammer-rolling-curl-side.mp4",
 362 |       "mechanic": "Isolation",
 363 |       "equipment_type": "cables",
 364 |       "equipment_type_zh": "绳索",
 365 |       "muscle_ids": [
 366 |         "Biceps"
 367 |       ]
 368 |     },
 369 |     {
 370 |       "exercise_name": "Cable High Single Arm Reverse Bayesian Curl",
 371 |       "exercise_name_zh": "绳索高位单臂反握贝叶斯",
 372 |       "secondary_muscles": [],
 373 |       "difficulty": "Beginner",
 374 |       "url": "https://musclewiki.com/cables/male/biceps/cable-high-single-arm-reverse-bayesian-curl",
 375 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-single-arm-reverse-bayesian-curl-front.mp4",
 376 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-single-arm-reverse-bayesian-curl-side.mp4",
 377 |       "mechanic": "Isolation",
 378 |       "equipment_type": "cables",
 379 |       "equipment_type_zh": "绳索",
 380 |       "muscle_ids": [
 381 |         "Biceps"
 382 |       ]
 383 |     },
 384 |     {
 385 |       "exercise_name": "Cable High Single Arm Reverse Rolling Curl",
 386 |       "exercise_name_zh": "绳索高位单臂反握",
 387 |       "secondary_muscles": [],
 388 |       "difficulty": "Beginner",
 389 |       "url": "https://musclewiki.com/cables/male/biceps/cable-high-single-arm-reverse-rolling-curl",
 390 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-single-arm-reverse-rolling-curl-front.mp4",
 391 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-single-arm-reverse-rolling-curl-side.mp4",
 392 |       "mechanic": "Isolation",
 393 |       "equipment_type": "cables",
 394 |       "equipment_type_zh": "绳索",
 395 |       "muscle_ids": [
 396 |         "Biceps"
 397 |       ]
 398 |     },
 399 |     {
 400 |       "exercise_name": "Cable High Single Arm Rolling Curl",
 401 |       "exercise_name_zh": "绳索高位单臂",
 402 |       "secondary_muscles": [],
 403 |       "difficulty": "Beginner",
 404 |       "url": "https://musclewiki.com/cables/male/biceps/cable-high-single-arm-rolling-curl",
 405 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-single-arm-rolling-curl-front.mp4",
 406 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-single-arm-rolling-curl-side.mp4",
 407 |       "mechanic": "Isolation",
 408 |       "equipment_type": "cables",
 409 |       "equipment_type_zh": "绳索",
 410 |       "muscle_ids": [
 411 |         "Biceps"
 412 |       ]
 413 |     },
 414 |     {
 415 |       "exercise_name": "Cable Pull Around",
 416 |       "exercise_name_zh": "绳索绕拉",
 417 |       "secondary_muscles": [],
 418 |       "difficulty": "Beginner",
 419 |       "url": "https://musclewiki.com/cables/male/biceps/cable-pull-around",
 420 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-pull-around-front.mp4",
 421 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-pull-around-side.mp4",
 422 |       "mechanic": "Isolation",
 423 |       "equipment_type": "cables",
 424 |       "equipment_type_zh": "绳索",
 425 |       "muscle_ids": [
 426 |         "Biceps"
 427 |       ]
 428 |     },
 429 |     {
 430 |       "exercise_name": "Cable Pull In",
 431 |       "exercise_name_zh": "绳索收腹",
 432 |       "secondary_muscles": [],
 433 |       "difficulty": "Beginner",
 434 |       "url": "https://musclewiki.com/cables/male/biceps/cable-pull-in",
 435 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-pull-in-front.mp4",
 436 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-pull-in-side.mp4",
 437 |       "mechanic": "Isolation",
 438 |       "equipment_type": "cables",
 439 |       "equipment_type_zh": "绳索",
 440 |       "muscle_ids": [
 441 |         "Biceps"
 442 |       ]
 443 |     },
 444 |     {
 445 |       "exercise_name": "Cable Reverse Bayesian Curl",
 446 |       "exercise_name_zh": "绳索反握贝叶斯弯举",
 447 |       "secondary_muscles": [],
 448 |       "difficulty": "Beginner",
 449 |       "url": "https://musclewiki.com/cables/male/biceps/cable-reverse-bayesian-curl",
 450 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-reverse-bayesian-curl-front.mp4",
 451 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-reverse-bayesian-curl-side.mp4",
 452 |       "mechanic": "Isolation",
 453 |       "equipment_type": "cables",
 454 |       "equipment_type_zh": "绳索",
 455 |       "muscle_ids": [
 456 |         "Biceps"
 457 |       ]
 458 |     },
 459 |     {
 460 |       "exercise_name": "Cable Rope Hammer Curl",
 461 |       "exercise_name_zh": "绳索锤式弯举",
 462 |       "secondary_muscles": [],
 463 |       "difficulty": "Beginner",
 464 |       "url": "https://musclewiki.com/cables/male/biceps/cable-rope-hammer-curl",
 465 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-hammer-curl-front.mp4",
 466 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-hammer-curl-side.mp4",
 467 |       "mechanic": "Isolation",
 468 |       "equipment_type": "cables",
 469 |       "equipment_type_zh": "绳索",
 470 |       "muscle_ids": [
 471 |         "Biceps"
 472 |       ]
 473 |     },
 474 |     {
 475 |       "exercise_name": "Cable Row Bar Standing Row",
 476 |       "exercise_name_zh": "坐姿滑轮划船（直杆） 站姿划船",
 477 |       "secondary_muscles": [],
 478 |       "difficulty": "Beginner",
 479 |       "url": "https://musclewiki.com/cables/male/biceps/cable-row-bar-standing-row",
 480 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-row-bar-standing-row-front.mp4",
 481 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-row-bar-standing-row-side.mp4",
 482 |       "mechanic": "Isolation",
 483 |       "equipment_type": "cables",
 484 |       "equipment_type_zh": "绳索",
 485 |       "muscle_ids": [
 486 |         "Biceps"
 487 |       ]
 488 |     },
 489 |     {
 490 |       "exercise_name": "Cable Seated Bayesian Curl",
 491 |       "exercise_name_zh": "坐姿绳索贝叶斯弯举",
 492 |       "secondary_muscles": [],
 493 |       "difficulty": "Beginner",
 494 |       "url": "https://musclewiki.com/cables/male/biceps/cable-seated-bayesian-curl",
 495 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-seated-bayesian-curl-front.mp4",
 496 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-seated-bayesian-curl-side.mp4",
 497 |       "mechanic": "Isolation",
 498 |       "equipment_type": "cables",
 499 |       "equipment_type_zh": "绳索",
 500 |       "muscle_ids": [
 501 |         "Biceps"
 502 |       ]
 503 |     },
 504 |     {
 505 |       "exercise_name": "Cable Seated Bayesian Hammer Curl",
 506 |       "exercise_name_zh": "坐姿绳索 Bayesian 锤式弯举",
 507 |       "secondary_muscles": [],
 508 |       "difficulty": "Beginner",
 509 |       "url": "https://musclewiki.com/cables/male/biceps/cable-seated-bayesian-hammer-curl",
 510 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-seated-bayesian-hammer-curl-front.mp4",
 511 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-seated-bayesian-hammer-curl-side.mp4",
 512 |       "mechanic": "Isolation",
 513 |       "equipment_type": "cables",
 514 |       "equipment_type_zh": "绳索",
 515 |       "muscle_ids": [
 516 |         "Biceps"
 517 |       ]
 518 |     },
 519 |     {
 520 |       "exercise_name": "Cable Seated Bayesian Reverse Curl",
 521 |       "exercise_name_zh": "坐姿绳索 Bayesian 反握弯举",
 522 |       "secondary_muscles": [],
 523 |       "difficulty": "Beginner",
 524 |       "url": "https://musclewiki.com/cables/male/biceps/cable-seated-bayesian-reverse-curl",
 525 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-seated-bayesian-reverse-curl-front.mp4",
 526 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-seated-bayesian-reverse-curl-side.mp4",
 527 |       "mechanic": "Isolation",
 528 |       "equipment_type": "cables",
 529 |       "equipment_type_zh": "绳索",
 530 |       "muscle_ids": [
 531 |         "Biceps"
 532 |       ]
 533 |     },
 534 |     {
 535 |       "exercise_name": "Cable Single Arm Bayesian Curl",
 536 |       "exercise_name_zh": "贝叶斯式单臂绳索弯举",
 537 |       "secondary_muscles": [],
 538 |       "difficulty": "Beginner",
 539 |       "url": "https://musclewiki.com/cables/male/biceps/cable-single-arm-bayesian-curl",
 540 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-bayesian-curl-front.mp4",
 541 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-bayesian-curl-side.mp4",
 542 |       "mechanic": "Isolation",
 543 |       "equipment_type": "cables",
 544 |       "equipment_type_zh": "绳索",
 545 |       "muscle_ids": [
 546 |         "Biceps"
 547 |       ]
 548 |     },
 549 |     {
 550 |       "exercise_name": "Cable Single Arm Neutral Grip Row",
 551 |       "exercise_name_zh": "绳索单臂中立握划船",
 552 |       "secondary_muscles": [],
 553 |       "difficulty": "Beginner",
 554 |       "url": "https://musclewiki.com/cables/male/biceps/cable-single-arm-neutral-grip-row",
 555 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-neutral-grip-row-front.mp4",
 556 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-neutral-grip-row-side.mp4",
 557 |       "mechanic": "Isolation",
 558 |       "equipment_type": "cables",
 559 |       "equipment_type_zh": "绳索",
 560 |       "muscle_ids": [
 561 |         "Biceps"
 562 |       ]
 563 |     },
 564 |     {
 565 |       "exercise_name": "Cable Single Arm Reverse Curl",
 566 |       "exercise_name_zh": "绳索单臂反握",
 567 |       "secondary_muscles": [],
 568 |       "difficulty": "Beginner",
 569 |       "url": "https://musclewiki.com/cables/male/biceps/cable-single-arm-reverse-curl",
 570 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-reverse-curl-front.mp4",
 571 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-reverse-curl-side.mp4",
 572 |       "mechanic": "Isolation",
 573 |       "equipment_type": "cables",
 574 |       "equipment_type_zh": "绳索",
 575 |       "muscle_ids": [
 576 |         "Biceps"
 577 |       ]
 578 |     },
 579 |     {
 580 |       "exercise_name": "Cable Single Arm Underhand Grip Row",
 581 |       "exercise_name_zh": "绳索单臂划船",
 582 |       "secondary_muscles": [],
 583 |       "difficulty": "Beginner",
 584 |       "url": "https://musclewiki.com/cables/male/biceps/cable-single-arm-underhand-grip-row",
 585 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-underhand-grip-row-front.mp4",
 586 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-underhand-grip-row-side.mp4",
 587 |       "mechanic": "Isolation",
 588 |       "equipment_type": "cables",
 589 |       "equipment_type_zh": "绳索",
 590 |       "muscle_ids": [
 591 |         "Biceps"
 592 |       ]
 593 |     },
 594 |     {
 595 |       "exercise_name": "Cable Standing Single Arm Cross Rear Delt Row",
 596 |       "exercise_name_zh": "绳索站姿单臂划船",
 597 |       "secondary_muscles": [],
 598 |       "difficulty": "Beginner",
 599 |       "url": "https://musclewiki.com/cables/male/biceps/cable-standing-single-arm-cross-rear-delt-row",
 600 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-single-arm-cross-rear-delt-row-front.mp4",
 601 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-single-arm-cross-rear-delt-row-side.mp4",
 602 |       "mechanic": "Isolation",
 603 |       "equipment_type": "cables",
 604 |       "equipment_type_zh": "绳索",
 605 |       "muscle_ids": [
 606 |         "Biceps"
 607 |       ]
 608 |     },
 609 |     {
 610 |       "exercise_name": "Cable Supinating Row",
 611 |       "exercise_name_zh": "绳索划船",
 612 |       "secondary_muscles": [],
 613 |       "difficulty": "Beginner",
 614 |       "url": "https://musclewiki.com/cables/male/biceps/cable-supinating-row",
 615 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-supinating-row-front.mp4",
 616 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-supinating-row-side.mp4",
 617 |       "mechanic": "Isolation",
 618 |       "equipment_type": "cables",
 619 |       "equipment_type_zh": "绳索",
 620 |       "muscle_ids": [
 621 |         "Biceps"
 622 |       ]
 623 |     },
 624 |     {
 625 |       "exercise_name": "Cable Twisting Curl",
 626 |       "exercise_name_zh": "绳索扭转弯举",
 627 |       "secondary_muscles": [],
 628 |       "difficulty": "Beginner",
 629 |       "url": "https://musclewiki.com/cables/male/biceps/cable-twisting-curl",
 630 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-twisting-curl-front.mp4",
 631 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-twisting-curl-side.mp4",
 632 |       "mechanic": "Isolation",
 633 |       "equipment_type": "cables",
 634 |       "equipment_type_zh": "绳索",
 635 |       "muscle_ids": [
 636 |         "Biceps"
 637 |       ]
 638 |     },
 639 |     {
 640 |       "exercise_name": "Cable Bar Calve Raise",
 641 |       "exercise_name_zh": "绳索直杆提踵",
 642 |       "secondary_muscles": [],
 643 |       "difficulty": "Beginner",
 644 |       "url": "https://musclewiki.com/cables/male/calves/cable-bar-calve-raise",
 645 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-calve-raise-front.mp4",
 646 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-calve-raise-side.mp4",
 647 |       "mechanic": "Isolation",
 648 |       "equipment_type": "cables",
 649 |       "equipment_type_zh": "绳索",
 650 |       "muscle_ids": [
 651 |         "Calves"
 652 |       ]
 653 |     },
 654 |     {
 655 |       "exercise_name": "Cable Belt Calf Raise",
 656 |       "exercise_name_zh": "绳索提踵",
 657 |       "secondary_muscles": [],
 658 |       "difficulty": "Beginner",
 659 |       "url": "https://musclewiki.com/cables/male/calves/cable-belt-calf-raise",
 660 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-belt-calf-raise-front.mp4",
 661 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-belt-calf-raise-side.mp4",
 662 |       "mechanic": "Isolation",
 663 |       "equipment_type": "cables",
 664 |       "equipment_type_zh": "绳索",
 665 |       "muscle_ids": [
 666 |         "Calves"
 667 |       ]
 668 |     },
 669 |     {
 670 |       "exercise_name": "Cable Calve Raise",
 671 |       "exercise_name_zh": "绳索提踵",
 672 |       "secondary_muscles": [],
 673 |       "difficulty": "Beginner",
 674 |       "url": "https://musclewiki.com/cables/male/calves/cable-calve-raise",
 675 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-calve-raise-front.mp4",
 676 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-calve-raise-side.mp4",
 677 |       "mechanic": "Isolation",
 678 |       "equipment_type": "cables",
 679 |       "equipment_type_zh": "绳索",
 680 |       "muscle_ids": [
 681 |         "Calves"
 682 |       ]
 683 |     },
 684 |     {
 685 |       "exercise_name": "Cable Bench Chest Fly",
 686 |       "exercise_name_zh": "平板绳索飞鸟",
 687 |       "secondary_muscles": [],
 688 |       "difficulty": "Beginner",
 689 |       "url": "https://musclewiki.com/cables/male/chest/cable-bench-chest-fly",
 690 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bench-chest-fly-front.mp4",
 691 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bench-chest-fly-side.mp4",
 692 |       "mechanic": "Isolation",
 693 |       "equipment_type": "cables",
 694 |       "equipment_type_zh": "绳索",
 695 |       "muscle_ids": [
 696 |         "Chest"
 697 |       ]
 698 |     },
 699 |     {
 700 |       "exercise_name": "Cable Braced Single Arm Chest Fly",
 701 |       "exercise_name_zh": "绳索单臂",
 702 |       "secondary_muscles": [],
 703 |       "difficulty": "Beginner",
 704 |       "url": "https://musclewiki.com/cables/male/chest/cable-braced-single-arm-chest-fly",
 705 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-braced-single-arm-chest-fly-front.mp4",
 706 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-braced-single-arm-chest-fly-side.mp4",
 707 |       "mechanic": "Isolation",
 708 |       "equipment_type": "cables",
 709 |       "equipment_type_zh": "绳索",
 710 |       "muscle_ids": [
 711 |         "Chest"
 712 |       ]
 713 |     },
 714 |     {
 715 |       "exercise_name": "Cable Braced Single Arm Chest Press",
 716 |       "exercise_name_zh": "绳索单臂胸推",
 717 |       "secondary_muscles": [],
 718 |       "difficulty": "Beginner",
 719 |       "url": "https://musclewiki.com/cables/male/chest/cable-braced-single-arm-chest-press",
 720 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-braced-single-arm-chest-press-front.mp4",
 721 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-braced-single-arm-chest-press-side.mp4",
 722 |       "mechanic": "Isolation",
 723 |       "equipment_type": "cables",
 724 |       "equipment_type_zh": "绳索",
 725 |       "muscle_ids": [
 726 |         "Chest"
 727 |       ]
 728 |     },
 729 |     {
 730 |       "exercise_name": "Cable Braced Single Arm Internally Rotated Chest Fly",
 731 |       "exercise_name_zh": "绳索单臂",
 732 |       "secondary_muscles": [],
 733 |       "difficulty": "Beginner",
 734 |       "url": "https://musclewiki.com/cables/male/chest/cable-braced-single-arm-internally-rotated-chest-fly",
 735 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-braced-single-arm-internally-rotated-chest-fly-front.mp4",
 736 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-braced-single-arm-internally-rotated-chest-fly-side.mp4",
 737 |       "mechanic": "Isolation",
 738 |       "equipment_type": "cables",
 739 |       "equipment_type_zh": "绳索",
 740 |       "muscle_ids": [
 741 |         "Chest"
 742 |       ]
 743 |     },
 744 |     {
 745 |       "exercise_name": "Cable Decline Bench Chest Fly",
 746 |       "exercise_name_zh": "下斜绳索飞鸟",
 747 |       "secondary_muscles": [],
 748 |       "difficulty": "Beginner",
 749 |       "url": "https://musclewiki.com/cables/male/chest/cable-decline-bench-chest-fly",
 750 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-decline-bench-chest-fly-front.mp4",
 751 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-decline-bench-chest-fly-side.mp4",
 752 |       "mechanic": "Isolation",
 753 |       "equipment_type": "cables",
 754 |       "equipment_type_zh": "绳索",
 755 |       "muscle_ids": [
 756 |         "Chest"
 757 |       ]
 758 |     },
 759 |     {
 760 |       "exercise_name": "Cable Decline Press Around",
 761 |       "exercise_name_zh": "绳索下斜",
 762 |       "secondary_muscles": [],
 763 |       "difficulty": "Beginner",
 764 |       "url": "https://musclewiki.com/cables/male/chest/cable-decline-press-around",
 765 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-decline-press-around-front.mp4",
 766 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-decline-press-around-side.mp4",
 767 |       "mechanic": "Isolation",
 768 |       "equipment_type": "cables",
 769 |       "equipment_type_zh": "绳索",
 770 |       "muscle_ids": [
 771 |         "Chest"
 772 |       ]
 773 |     },
 774 |     {
 775 |       "exercise_name": "Cable Incline Bench Press",
 776 |       "exercise_name_zh": "上斜绳索卧推",
 777 |       "secondary_muscles": [],
 778 |       "difficulty": "Beginner",
 779 |       "url": "https://musclewiki.com/cables/male/chest/cable-incline-bench-press",
 780 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-incline-bench-press-front.mp4",
 781 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-incline-bench-press-side.mp4",
 782 |       "mechanic": "Isolation",
 783 |       "equipment_type": "cables",
 784 |       "equipment_type_zh": "绳索",
 785 |       "muscle_ids": [
 786 |         "Chest"
 787 |       ]
 788 |     },
 789 |     {
 790 |       "exercise_name": "Cable Incline Chest Fly",
 791 |       "exercise_name_zh": "上斜绳索飞鸟",
 792 |       "secondary_muscles": [],
 793 |       "difficulty": "Beginner",
 794 |       "url": "https://musclewiki.com/cables/male/chest/cable-incline-chest-fly",
 795 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-incline-chest-fly-front.mp4",
 796 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-incline-chest-fly-side.mp4",
 797 |       "mechanic": "Isolation",
 798 |       "equipment_type": "cables",
 799 |       "equipment_type_zh": "绳索",
 800 |       "muscle_ids": [
 801 |         "Chest"
 802 |       ]
 803 |     },
 804 |     {
 805 |       "exercise_name": "Cable Incline Fly Around",
 806 |       "exercise_name_zh": "绳索上斜",
 807 |       "secondary_muscles": [],
 808 |       "difficulty": "Beginner",
 809 |       "url": "https://musclewiki.com/cables/male/chest/cable-incline-fly-around",
 810 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-incline-fly-around-front.mp4",
 811 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-incline-fly-around-side.mp4",
 812 |       "mechanic": "Isolation",
 813 |       "equipment_type": "cables",
 814 |       "equipment_type_zh": "绳索",
 815 |       "muscle_ids": [
 816 |         "Chest"
 817 |       ]
 818 |     },
 819 |     {
 820 |       "exercise_name": "Cable Incline Press Around",
 821 |       "exercise_name_zh": "绳索上斜",
 822 |       "secondary_muscles": [],
 823 |       "difficulty": "Beginner",
 824 |       "url": "https://musclewiki.com/cables/male/chest/cable-incline-press-around",
 825 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-incline-press-around-front.mp4",
 826 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-incline-press-around-side.mp4",
 827 |       "mechanic": "Isolation",
 828 |       "equipment_type": "cables",
 829 |       "equipment_type_zh": "绳索",
 830 |       "muscle_ids": [
 831 |         "Chest"
 832 |       ]
 833 |     },
 834 |     {
 835 |       "exercise_name": "Cable Pec Fly",
 836 |       "exercise_name_zh": "绳索飞鸟",
 837 |       "secondary_muscles": [],
 838 |       "difficulty": "Beginner",
 839 |       "url": "https://musclewiki.com/cables/male/chest/cable-pec-fly",
 840 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-pec-fly-front.mp4",
 841 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-pec-fly-side.mp4",
 842 |       "mechanic": "Isolation",
 843 |       "equipment_type": "cables",
 844 |       "equipment_type_zh": "绳索",
 845 |       "muscle_ids": [
 846 |         "Chest"
 847 |       ]
 848 |     },
 849 |     {
 850 |       "exercise_name": "Cable Single Arm Bench Chest Fly",
 851 |       "exercise_name_zh": "单臂缆绳平板飞鸟",
 852 |       "secondary_muscles": [],
 853 |       "difficulty": "Beginner",
 854 |       "url": "https://musclewiki.com/cables/male/chest/cable-single-arm-bench-chest-fly",
 855 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-bench-chest-fly-front.mp4",
 856 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-bench-chest-fly-side.mp4",
 857 |       "mechanic": "Isolation",
 858 |       "equipment_type": "cables",
 859 |       "equipment_type_zh": "绳索",
 860 |       "muscle_ids": [
 861 |         "Chest"
 862 |       ]
 863 |     },
 864 |     {
 865 |       "exercise_name": "Cable Single Arm Decline Bench Chest Fly",
 866 |       "exercise_name_zh": "下斜单臂绳索飞鸟",
 867 |       "secondary_muscles": [],
 868 |       "difficulty": "Beginner",
 869 |       "url": "https://musclewiki.com/cables/male/chest/cable-single-arm-decline-bench-chest-fly",
 870 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-decline-bench-chest-fly-front.mp4",
 871 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-decline-bench-chest-fly-side.mp4",
 872 |       "mechanic": "Isolation",
 873 |       "equipment_type": "cables",
 874 |       "equipment_type_zh": "绳索",
 875 |       "muscle_ids": [
 876 |         "Chest"
 877 |       ]
 878 |     },
 879 |     {
 880 |       "exercise_name": "Cable Single Arm Incline Chest Fly",
 881 |       "exercise_name_zh": "上斜单臂绳索飞鸟",
 882 |       "secondary_muscles": [],
 883 |       "difficulty": "Beginner",
 884 |       "url": "https://musclewiki.com/cables/male/chest/cable-single-arm-incline-chest-fly",
 885 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-incline-chest-fly-front.mp4",
 886 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-incline-chest-fly-side.mp4",
 887 |       "mechanic": "Isolation",
 888 |       "equipment_type": "cables",
 889 |       "equipment_type_zh": "绳索",
 890 |       "muscle_ids": [
 891 |         "Chest"
 892 |       ]
 893 |     },
 894 |     {
 895 |       "exercise_name": "Cable Standing Single Arm Chest Fly",
 896 |       "exercise_name_zh": "绳索站姿单臂",
 897 |       "secondary_muscles": [],
 898 |       "difficulty": "Beginner",
 899 |       "url": "https://musclewiki.com/cables/male/chest/cable-standing-single-arm-chest-fly",
 900 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-single-arm-chest-fly-front.mp4",
 901 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-single-arm-chest-fly-side.mp4",
 902 |       "mechanic": "Isolation",
 903 |       "equipment_type": "cables",
 904 |       "equipment_type_zh": "绳索",
 905 |       "muscle_ids": [
 906 |         "Chest"
 907 |       ]
 908 |     },
 909 |     {
 910 |       "exercise_name": "Cable Standing Single Arm Incline Chest Fly",
 911 |       "exercise_name_zh": "绳索站姿上斜单臂",
 912 |       "secondary_muscles": [],
 913 |       "difficulty": "Beginner",
 914 |       "url": "https://musclewiki.com/cables/male/chest/cable-standing-single-arm-incline-chest-fly",
 915 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-single-arm-incline-chest-fly-front.mp4",
 916 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-single-arm-incline-chest-fly-side.mp4",
 917 |       "mechanic": "Isolation",
 918 |       "equipment_type": "cables",
 919 |       "equipment_type_zh": "绳索",
 920 |       "muscle_ids": [
 921 |         "Chest"
 922 |       ]
 923 |     },
 924 |     {
 925 |       "exercise_name": "Cable Standing Single Arm Internally Rotated Chest Fly",
 926 |       "exercise_name_zh": "绳索站姿单臂",
 927 |       "secondary_muscles": [],
 928 |       "difficulty": "Beginner",
 929 |       "url": "https://musclewiki.com/cables/male/chest/cable-standing-single-arm-internally-rotated-chest-fly",
 930 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-single-arm-internally-rotated-chest-fly-front.mp4",
 931 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-single-arm-internally-rotated-chest-fly-side.mp4",
 932 |       "mechanic": "Isolation",
 933 |       "equipment_type": "cables",
 934 |       "equipment_type_zh": "绳索",
 935 |       "muscle_ids": [
 936 |         "Chest"
 937 |       ]
 938 |     },
 939 |     {
 940 |       "exercise_name": "Cable Standing Single Arm Internally Rotated Incline Chest Fly",
 941 |       "exercise_name_zh": "绳索站姿上斜单臂",
 942 |       "secondary_muscles": [],
 943 |       "difficulty": "Beginner",
 944 |       "url": "https://musclewiki.com/cables/male/chest/cable-standing-single-arm-internally-rotated-incline-chest-fly",
 945 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-single-arm-internally-rotated-incline-chest-fly-front.mp4",
 946 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-single-arm-internally-rotated-incline-chest-fly-side.mp4",
 947 |       "mechanic": "Isolation",
 948 |       "equipment_type": "cables",
 949 |       "equipment_type_zh": "绳索",
 950 |       "muscle_ids": [
 951 |         "Chest"
 952 |       ]
 953 |     },
 954 |     {
 955 |       "exercise_name": "Cable Bar Reverse Grip Curl",
 956 |       "exercise_name_zh": "绳索直杆反握弯举",
 957 |       "secondary_muscles": [],
 958 |       "difficulty": "Beginner",
 959 |       "url": "https://musclewiki.com/cables/male/forearms/cable-bar-reverse-grip-curl",
 960 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-reverse-grip-curl-front.mp4",
 961 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-reverse-grip-curl-side.mp4",
 962 |       "mechanic": "Isolation",
 963 |       "equipment_type": "cables",
 964 |       "equipment_type_zh": "绳索",
 965 |       "muscle_ids": [
 966 |         "Forearms"
 967 |       ]
 968 |     },
 969 |     {
 970 |       "exercise_name": "Cable Braced Wrist Curl",
 971 |       "secondary_muscles": [],
 972 |       "difficulty": "Beginner",
 973 |       "url": "https://musclewiki.com/cables/male/forearms/cable-braced-wrist-curl",
 974 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-braced-wrist-curl-front.mp4",
 975 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-braced-wrist-curl-side.mp4",
 976 |       "mechanic": "Isolation",
 977 |       "exercise_name_zh": "绳索支撑腕弯举",
 978 |       "equipment_type": "cables",
 979 |       "equipment_type_zh": "绳索",
 980 |       "muscle_ids": [
 981 |         "Forearms"
 982 |       ]
 983 |     },
 984 |     {
 985 |       "exercise_name": "Cable Braced Wrist Extension",
 986 |       "secondary_muscles": [],
 987 |       "difficulty": "Beginner",
 988 |       "url": "https://musclewiki.com/cables/male/forearms/cable-braced-wrist-extension",
 989 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-braced-wrist-extension-front.mp4",
 990 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-braced-wrist-extension-side.mp4",
 991 |       "mechanic": "Isolation",
 992 |       "exercise_name_zh": "绳索支撑腕伸展",
 993 |       "equipment_type": "cables",
 994 |       "equipment_type_zh": "绳索",
 995 |       "muscle_ids": [
 996 |         "Forearms"
 997 |       ]
 998 |     },
 999 |     {
1000 |       "exercise_name": "Cable Wrist Curl",
1001 |       "secondary_muscles": [],
1002 |       "difficulty": "Beginner",
1003 |       "url": "https://musclewiki.com/cables/male/forearms/cable-wrist-curl",
1004 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-wrist-curl-front.mp4",
1005 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-wrist-curl-side.mp4",
1006 |       "mechanic": "Isolation",
1007 |       "exercise_name_zh": "绳索腕弯举",
1008 |       "equipment_type": "cables",
1009 |       "equipment_type_zh": "绳索",
1010 |       "muscle_ids": [
1011 |         "Forearms"
1012 |       ]
1013 |     },
1014 |     {
1015 |       "exercise_name": "Cable Wrist Extension",
1016 |       "secondary_muscles": [],
1017 |       "difficulty": "Beginner",
1018 |       "url": "https://musclewiki.com/cables/male/forearms/cable-wrist-extension",
1019 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-wrist-extension-front.mp4",
1020 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-wrist-extension-side.mp4",
1021 |       "mechanic": "Isolation",
1022 |       "exercise_name_zh": "绳索腕伸展",
1023 |       "equipment_type": "cables",
1024 |       "equipment_type_zh": "绳索",
1025 |       "muscle_ids": [
1026 |         "Forearms"
1027 |       ]
1028 |     },
1029 |     {
1030 |       "exercise_name": "Cable Internal Rotation",
1031 |       "secondary_muscles": [],
1032 |       "difficulty": "Beginner",
1033 |       "url": "https://musclewiki.com/cables/male/front-shoulders/cable-internal-rotation",
1034 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-internal-rotation-front.mp4",
1035 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-internal-rotation-side.mp4",
1036 |       "mechanic": "Isolation",
1037 |       "exercise_name_zh": "绳索内旋",
1038 |       "equipment_type": "cables",
1039 |       "equipment_type_zh": "绳索",
1040 |       "muscle_ids": [
1041 |         "Front Shoulders"
1042 |       ]
1043 |     },
1044 |     {
1045 |       "exercise_name": "Cable Belt Split Squat",
1046 |       "secondary_muscles": [],
1047 |       "difficulty": "Beginner",
1048 |       "url": "https://musclewiki.com/cables/male/glutes/cable-belt-split-squat",
1049 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-belt-split-squat-front.mp4",
1050 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-belt-split-squat-side.mp4",
1051 |       "mechanic": "Isolation",
1052 |       "exercise_name_zh": "绳索腰带分腿深蹲",
1053 |       "equipment_type": "cables",
1054 |       "equipment_type_zh": "绳索",
1055 |       "muscle_ids": [
1056 |         "Glutes"
1057 |       ]
1058 |     },
1059 |     {
1060 |       "exercise_name": "Cable Belt Squat",
1061 |       "secondary_muscles": [],
1062 |       "difficulty": "Beginner",
1063 |       "url": "https://musclewiki.com/cables/male/glutes/cable-belt-squat",
1064 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-belt-squat-front.mp4",
1065 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-belt-squat-side.mp4",
1066 |       "mechanic": "Isolation",
1067 |       "exercise_name_zh": "绳索腰带深蹲",
1068 |       "equipment_type": "cables",
1069 |       "equipment_type_zh": "绳索",
1070 |       "muscle_ids": [
1071 |         "Glutes"
1072 |       ]
1073 |     },
1074 |     {
1075 |       "exercise_name": "Cable Quadruped Hip Abduction",
1076 |       "secondary_muscles": [],
1077 |       "difficulty": "Beginner",
1078 |       "url": "https://musclewiki.com/cables/male/glutes/cable-quadruped-hip-abduction",
1079 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-quadruped-hip-abduction-front.mp4",
1080 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-quadruped-hip-abduction-side.mp4",
1081 |       "mechanic": "Isolation",
1082 |       "exercise_name_zh": "绳索四点支撑髋外展",
1083 |       "equipment_type": "cables",
1084 |       "equipment_type_zh": "绳索",
1085 |       "muscle_ids": [
1086 |         "Glutes"
1087 |       ]
1088 |     },
1089 |     {
1090 |       "exercise_name": "Cable Split Squat",
1091 |       "secondary_muscles": [],
1092 |       "difficulty": "Beginner",
1093 |       "url": "https://musclewiki.com/cables/male/glutes/cable-split-squat",
1094 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-split-squat-front.mp4",
1095 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-split-squat-side.mp4",
1096 |       "mechanic": "Isolation",
1097 |       "exercise_name_zh": "绳索分腿深蹲",
1098 |       "equipment_type": "cables",
1099 |       "equipment_type_zh": "绳索",
1100 |       "muscle_ids": [
1101 |         "Glutes"
1102 |       ]
1103 |     },
1104 |     {
1105 |       "exercise_name": "Cable Standing Glute Kickback",
1106 |       "secondary_muscles": [],
1107 |       "difficulty": "Beginner",
1108 |       "url": "https://musclewiki.com/cables/male/glutes/cable-standing-glute-kickback",
1109 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-glute-kickback-front.mp4",
1110 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-glute-kickback-side.mp4",
1111 |       "mechanic": "Isolation",
1112 |       "exercise_name_zh": "绳索站姿",
1113 |       "equipment_type": "cables",
1114 |       "equipment_type_zh": "绳索",
1115 |       "muscle_ids": [
1116 |         "Glutes"
1117 |       ]
1118 |     },
1119 |     {
1120 |       "exercise_name": "Cable Standing Hip Abduction",
1121 |       "secondary_muscles": [],
1122 |       "difficulty": "Beginner",
1123 |       "url": "https://musclewiki.com/cables/male/glutes/cable-standing-hip-abduction",
1124 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-hip-abduction-front.mp4",
1125 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-hip-abduction-side.mp4",
1126 |       "mechanic": "Isolation",
1127 |       "exercise_name_zh": "绳索站姿",
1128 |       "equipment_type": "cables",
1129 |       "equipment_type_zh": "绳索",
1130 |       "muscle_ids": [
1131 |         "Glutes"
1132 |       ]
1133 |     },
1134 |     {
1135 |       "exercise_name": "Cable Standing Hip Adduction",
1136 |       "secondary_muscles": [],
1137 |       "difficulty": "Beginner",
1138 |       "url": "https://musclewiki.com/cables/male/glutes/cable-standing-hip-adduction",
1139 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-hip-adduction-front.mp4",
1140 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-hip-adduction-side.mp4",
1141 |       "mechanic": "Isolation",
1142 |       "exercise_name_zh": "绳索站姿",
1143 |       "equipment_type": "cables",
1144 |       "equipment_type_zh": "绳索",
1145 |       "muscle_ids": [
1146 |         "Glutes"
1147 |       ]
1148 |     },
1149 |     {
1150 |       "exercise_name": "Cable Hamstring Curl",
1151 |       "secondary_muscles": [],
1152 |       "difficulty": "Beginner",
1153 |       "url": "https://musclewiki.com/cables/male/hamstrings/cable-hamstring-curl",
1154 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-hamstring-curl-front.mp4",
1155 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-hamstring-curl-side.mp4",
1156 |       "mechanic": "Isolation",
1157 |       "exercise_name_zh": "绳索腿后肌弯举",
1158 |       "equipment_type": "cables",
1159 |       "equipment_type_zh": "绳索",
1160 |       "muscle_ids": [
1161 |         "Hamstrings"
1162 |       ]
1163 |     },
1164 |     {
1165 |       "exercise_name": "Cable Seated Leg Curl",
1166 |       "secondary_muscles": [],
1167 |       "difficulty": "Beginner",
1168 |       "url": "https://musclewiki.com/cables/male/hamstrings/cable-seated-leg-curl",
1169 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-seated-leg-curl-front.mp4",
1170 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-seated-leg-curl-side.mp4",
1171 |       "mechanic": "Isolation",
1172 |       "exercise_name_zh": "绳索坐姿腿弯举",
1173 |       "equipment_type": "cables",
1174 |       "equipment_type_zh": "绳索",
1175 |       "muscle_ids": [
1176 |         "Hamstrings"
1177 |       ]
1178 |     },
1179 |     {
1180 |       "exercise_name": "Cable Single Leg Laying Leg Curl",
1181 |       "secondary_muscles": [],
1182 |       "difficulty": "Beginner",
1183 |       "url": "https://musclewiki.com/cables/male/hamstrings/cable-single-leg-laying-leg-curl",
1184 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-leg-laying-leg-curl-front.mp4",
1185 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-leg-laying-leg-curl-side.mp4",
1186 |       "mechanic": "Isolation",
1187 |       "exercise_name_zh": "绳索单腿俯卧腿弯举",
1188 |       "equipment_type": "cables",
1189 |       "equipment_type_zh": "绳索",
1190 |       "muscle_ids": [
1191 |         "Hamstrings"
1192 |       ]
1193 |     },
1194 |     {
1195 |       "exercise_name": "Cable Bent Over Bar Pullover",
1196 |       "secondary_muscles": [],
1197 |       "difficulty": "Beginner",
1198 |       "url": "https://musclewiki.com/cables/male/lats/cable-bent-over-bar-pullover",
1199 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bent-over-bar-pullover-front.mp4",
1200 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bent-over-bar-pullover-side.mp4",
1201 |       "mechanic": "Isolation",
1202 |       "exercise_name_zh": "绳索直杆",
1203 |       "equipment_type": "cables",
1204 |       "equipment_type_zh": "绳索",
1205 |       "muscle_ids": [
1206 |         "Lats"
1207 |       ]
1208 |     },
1209 |     {
1210 |       "exercise_name": "Cable Kayak Row",
1211 |       "secondary_muscles": [],
1212 |       "difficulty": "Beginner",
1213 |       "url": "https://musclewiki.com/cables/male/lats/cable-kayak-row",
1214 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-kayak-row-front.mp4",
1215 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-kayak-row-side.mp4",
1216 |       "mechanic": "Isolation",
1217 |       "exercise_name_zh": "绳索划船",
1218 |       "equipment_type": "cables",
1219 |       "equipment_type_zh": "绳索",
1220 |       "muscle_ids": [
1221 |         "Lats"
1222 |       ]
1223 |     },
1224 |     {
1225 |       "exercise_name": "Cable Lat Prayer",
1226 |       "secondary_muscles": [],
1227 |       "difficulty": "Beginner",
1228 |       "url": "https://musclewiki.com/cables/male/lats/cable-lat-prayer",
1229 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-lat-prayer-front.mp4",
1230 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-lat-prayer-side.mp4",
1231 |       "mechanic": "Isolation",
1232 |       "exercise_name_zh": "绳索背阔肌祈祷式下拉",
1233 |       "equipment_type": "cables",
1234 |       "equipment_type_zh": "绳索",
1235 |       "muscle_ids": [
1236 |         "Lats"
1237 |       ]
1238 |     },
1239 |     {
1240 |       "exercise_name": "Cable Rope Lat Prayer",
1241 |       "secondary_muscles": [],
1242 |       "difficulty": "Beginner",
1243 |       "url": "https://musclewiki.com/cables/male/lats/cable-rope-lat-prayer",
1244 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-lat-prayer-front.mp4",
1245 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-lat-prayer-side.mp4",
1246 |       "mechanic": "Isolation",
1247 |       "exercise_name_zh": "绳索背阔肌祈祷式下拉",
1248 |       "equipment_type": "cables",
1249 |       "equipment_type_zh": "绳索",
1250 |       "muscle_ids": [
1251 |         "Lats"
1252 |       ]
1253 |     },
1254 |     {
1255 |       "exercise_name": "Cable Rope Pullover",
1256 |       "secondary_muscles": [],
1257 |       "difficulty": "Beginner",
1258 |       "url": "https://musclewiki.com/cables/male/lats/cable-rope-pullover",
1259 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-pullover-front.mp4",
1260 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-pullover-side.mp4",
1261 |       "mechanic": "Isolation",
1262 |       "exercise_name_zh": "绳索上拉",
1263 |       "equipment_type": "cables",
1264 |       "equipment_type_zh": "绳索",
1265 |       "muscle_ids": [
1266 |         "Lats"
1267 |       ]
1268 |     },
1269 |     {
1270 |       "exercise_name": "Cable Single Arm Lat Prayer",
1271 |       "secondary_muscles": [],
1272 |       "difficulty": "Beginner",
1273 |       "url": "https://musclewiki.com/cables/male/lats/cable-single-arm-lat-prayer",
1274 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-lat-prayer-front.mp4",
1275 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-lat-prayer-side.mp4",
1276 |       "mechanic": "Isolation",
1277 |       "exercise_name_zh": "绳索单臂",
1278 |       "equipment_type": "cables",
1279 |       "equipment_type_zh": "绳索",
1280 |       "muscle_ids": [
1281 |         "Lats"
1282 |       ]
1283 |     },
1284 |     {
1285 |       "exercise_name": "Cable Straight Arm Pull In",
1286 |       "secondary_muscles": [],
1287 |       "difficulty": "Beginner",
1288 |       "url": "https://musclewiki.com/cables/male/lats/cable-straight-arm-pull-in",
1289 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-straight-arm-pull-in-front.mp4",
1290 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-straight-arm-pull-in-side.mp4",
1291 |       "mechanic": "Isolation",
1292 |       "exercise_name_zh": "绳索直臂下拉",
1293 |       "equipment_type": "cables",
1294 |       "equipment_type_zh": "绳索",
1295 |       "muscle_ids": [
1296 |         "Lats"
1297 |       ]
1298 |     },
1299 |     {
1300 |       "exercise_name": "Cable Bar Romanian Deadlift",
1301 |       "secondary_muscles": [],
1302 |       "difficulty": "Beginner",
1303 |       "url": "https://musclewiki.com/cables/male/lowerback/cable-bar-romanian-deadlift",
1304 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-romanian-deadlift-front.mp4",
1305 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-romanian-deadlift-side.mp4",
1306 |       "mechanic": "Isolation",
1307 |       "exercise_name_zh": "绳索直杆",
1308 |       "equipment_type": "cables",
1309 |       "equipment_type_zh": "绳索",
1310 |       "muscle_ids": [
1311 |         "Lowerback"
1312 |       ]
1313 |     },
1314 |     {
1315 |       "exercise_name": "Cable Bar Staggered Romanian Deadlift",
1316 |       "secondary_muscles": [],
1317 |       "difficulty": "Beginner",
1318 |       "url": "https://musclewiki.com/cables/male/lowerback/cable-bar-staggered-romanian-deadlift",
1319 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-staggered-romanian-deadlift-front.mp4",
1320 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-staggered-romanian-deadlift-side.mp4",
1321 |       "mechanic": "Isolation",
1322 |       "exercise_name_zh": "绳索直杆",
1323 |       "equipment_type": "cables",
1324 |       "equipment_type_zh": "绳索",
1325 |       "muscle_ids": [
1326 |         "Lowerback"
1327 |       ]
1328 |     },
1329 |     {
1330 |       "exercise_name": "Cable Bench Straight Leg Kickback",
1331 |       "secondary_muscles": [],
1332 |       "difficulty": "Beginner",
1333 |       "url": "https://musclewiki.com/cables/male/lowerback/cable-bench-straight-leg-kickback",
1334 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bench-straight-leg-kickback-front.mp4",
1335 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bench-straight-leg-kickback-side.mp4",
1336 |       "mechanic": "Isolation",
1337 |       "exercise_name_zh": "绳索长凳直腿后踢",
1338 |       "equipment_type": "cables",
1339 |       "equipment_type_zh": "绳索",
1340 |       "muscle_ids": [
1341 |         "Lowerback"
1342 |       ]
1343 |     },
1344 |     {
1345 |       "exercise_name": "Cable Elevated Deadlift",
1346 |       "secondary_muscles": [],
1347 |       "difficulty": "Beginner",
1348 |       "url": "https://musclewiki.com/cables/male/lowerback/cable-elevated-deadlift",
1349 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-elevated-deadlift-front.mp4",
1350 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-elevated-deadlift-side.mp4",
1351 |       "mechanic": "Isolation",
1352 |       "exercise_name_zh": "绳索高位硬拉",
1353 |       "equipment_type": "cables",
1354 |       "equipment_type_zh": "绳索",
1355 |       "muscle_ids": [
1356 |         "Lowerback"
1357 |       ]
1358 |     },
1359 |     {
1360 |       "exercise_name": "Cable Goblet Squat",
1361 |       "secondary_muscles": [],
1362 |       "difficulty": "Beginner",
1363 |       "url": "https://musclewiki.com/cables/male/lowerback/cable-goblet-squat",
1364 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-goblet-squat-front.mp4",
1365 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-goblet-squat-side.mp4",
1366 |       "mechanic": "Isolation",
1367 |       "exercise_name_zh": "绳索高脚杯深蹲",
1368 |       "equipment_type": "cables",
1369 |       "equipment_type_zh": "绳索",
1370 |       "muscle_ids": [
1371 |         "Lowerback"
1372 |       ]
1373 |     },
1374 |     {
1375 |       "exercise_name": "Cable Incline Bench Straight Leg Kickback",
1376 |       "secondary_muscles": [],
1377 |       "difficulty": "Beginner",
1378 |       "url": "https://musclewiki.com/cables/male/lowerback/cable-incline-bench-straight-leg-kickback",
1379 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-incline-bench-straight-leg-kickback-front.mp4",
1380 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-incline-bench-straight-leg-kickback-side.mp4",
1381 |       "mechanic": "Isolation",
1382 |       "exercise_name_zh": "绳索上斜",
1383 |       "equipment_type": "cables",
1384 |       "equipment_type_zh": "绳索",
1385 |       "muscle_ids": [
1386 |         "Lowerback"
1387 |       ]
1388 |     },
1389 |     {
1390 |       "exercise_name": "Cable Pull Through",
1391 |       "secondary_muscles": [],
1392 |       "difficulty": "Beginner",
1393 |       "url": "https://musclewiki.com/cables/male/lowerback/cable-pull-through",
1394 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-pull-through-front.mp4",
1395 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-pull-through-side.mp4",
1396 |       "mechanic": "Isolation",
1397 |       "exercise_name_zh": "绳索穿越硬拉",
1398 |       "equipment_type": "cables",
1399 |       "equipment_type_zh": "绳索",
1400 |       "muscle_ids": [
1401 |         "Lowerback"
1402 |       ]
1403 |     },
1404 |     {
1405 |       "exercise_name": "Cable Single Leg Deadlift",
1406 |       "secondary_muscles": [],
1407 |       "difficulty": "Beginner",
1408 |       "url": "https://musclewiki.com/cables/male/lowerback/cable-single-leg-deadlift",
1409 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-leg-deadlift-front.mp4",
1410 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-leg-deadlift-side.mp4",
1411 |       "mechanic": "Isolation",
1412 |       "exercise_name_zh": "绳索单腿硬拉",
1413 |       "equipment_type": "cables",
1414 |       "equipment_type_zh": "绳索",
1415 |       "muscle_ids": [
1416 |         "Lowerback"
1417 |       ]
1418 |     },
1419 |     {
1420 |       "exercise_name": "Cable Standing Mid Kickback",
1421 |       "secondary_muscles": [],
1422 |       "difficulty": "Beginner",
1423 |       "url": "https://musclewiki.com/cables/male/lowerback/cable-standing-mid-kickback",
1424 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-mid-kickback-front.mp4",
1425 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-mid-kickback-side.mp4",
1426 |       "mechanic": "Isolation",
1427 |       "exercise_name_zh": "绳索站姿",
1428 |       "equipment_type": "cables",
1429 |       "equipment_type_zh": "绳索",
1430 |       "muscle_ids": [
1431 |         "Lowerback"
1432 |       ]
1433 |     },
1434 |     {
1435 |       "exercise_name": "Cable Standing Straight Leg Glute Glute Kickback",
1436 |       "secondary_muscles": [],
1437 |       "difficulty": "Beginner",
1438 |       "url": "https://musclewiki.com/cables/male/lowerback/cable-standing-straight-leg-glute-glute-kickback",
1439 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-straight-leg-glute-glute-kickback-front.mp4",
1440 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-straight-leg-glute-glute-kickback-side.mp4",
1441 |       "mechanic": "Isolation",
1442 |       "exercise_name_zh": "绳索站姿",
1443 |       "equipment_type": "cables",
1444 |       "equipment_type_zh": "绳索",
1445 |       "muscle_ids": [
1446 |         "Lowerback"
1447 |       ]
1448 |     },
1449 |     {
1450 |       "exercise_name": "Cable Standing Straight Leg Mid Kickback",
1451 |       "secondary_muscles": [],
1452 |       "difficulty": "Beginner",
1453 |       "url": "https://musclewiki.com/cables/male/lowerback/cable-standing-straight-leg-mid-kickback",
1454 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-straight-leg-mid-kickback-front.mp4",
1455 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-straight-leg-mid-kickback-side.mp4",
1456 |       "mechanic": "Isolation",
1457 |       "exercise_name_zh": "绳索站姿",
1458 |       "equipment_type": "cables",
1459 |       "equipment_type_zh": "绳索",
1460 |       "muscle_ids": [
1461 |         "Lowerback"
1462 |       ]
1463 |     },
1464 |     {
1465 |       "exercise_name": "Cable Zercher Good Morning",
1466 |       "secondary_muscles": [],
1467 |       "difficulty": "Beginner",
1468 |       "url": "https://musclewiki.com/cables/male/lowerback/cable-zercher-good-morning",
1469 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-zercher-good-morning-front.mp4",
1470 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-zercher-good-morning-side.mp4",
1471 |       "mechanic": "Isolation",
1472 |       "exercise_name_zh": "绳索泽彻早安式前屈",
1473 |       "equipment_type": "cables",
1474 |       "equipment_type_zh": "绳索",
1475 |       "muscle_ids": [
1476 |         "Lowerback"
1477 |       ]
1478 |     },
1479 |     {
1480 |       "exercise_name": "Cable Zercher Squat",
1481 |       "secondary_muscles": [],
1482 |       "difficulty": "Beginner",
1483 |       "url": "https://musclewiki.com/cables/male/lowerback/cable-zercher-squat",
1484 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-zercher-squat-front.mp4",
1485 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-zercher-squat-side.mp4",
1486 |       "mechanic": "Isolation",
1487 |       "exercise_name_zh": "绳索泽彻深蹲",
1488 |       "equipment_type": "cables",
1489 |       "equipment_type_zh": "绳索",
1490 |       "muscle_ids": [
1491 |         "Lowerback"
1492 |       ]
1493 |     },
1494 |     {
1495 |       "exercise_name": "Cable Half Kneeling High To Low Wood Chopper",
1496 |       "secondary_muscles": [],
1497 |       "difficulty": "Beginner",
1498 |       "url": "https://musclewiki.com/cables/male/obliques/cable-half-kneeling-high-to-low-wood-chopper",
1499 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-half-kneeling-high-to-low-wood-chopper-front.mp4",
1500 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-half-kneeling-high-to-low-wood-chopper-side.mp4",
1501 |       "mechanic": "Isolation",
1502 |       "exercise_name_zh": "绳索跪姿高位",
1503 |       "equipment_type": "cables",
1504 |       "equipment_type_zh": "绳索",
1505 |       "muscle_ids": [
1506 |         "Obliques"
1507 |       ]
1508 |     },
1509 |     {
1510 |       "exercise_name": "Cable Half Kneeling Low To High Wood Chopper",
1511 |       "secondary_muscles": [],
1512 |       "difficulty": "Beginner",
1513 |       "url": "https://musclewiki.com/cables/male/obliques/cable-half-kneeling-low-to-high-wood-chopper",
1514 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-half-kneeling-low-to-high-wood-chopper-front.mp4",
1515 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-half-kneeling-low-to-high-wood-chopper-side.mp4",
1516 |       "mechanic": "Isolation",
1517 |       "exercise_name_zh": "绳索跪姿高位",
1518 |       "equipment_type": "cables",
1519 |       "equipment_type_zh": "绳索",
1520 |       "muscle_ids": [
1521 |         "Obliques"
1522 |       ]
1523 |     },
1524 |     {
1525 |       "exercise_name": "Cable Half Kneeling Wood Chopper",
1526 |       "secondary_muscles": [],
1527 |       "difficulty": "Beginner",
1528 |       "url": "https://musclewiki.com/cables/male/obliques/cable-half-kneeling-wood-chopper",
1529 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-half-kneeling-wood-chopper-front.mp4",
1530 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-half-kneeling-wood-chopper-side.mp4",
1531 |       "mechanic": "Isolation",
1532 |       "exercise_name_zh": "绳索跪姿",
1533 |       "equipment_type": "cables",
1534 |       "equipment_type_zh": "绳索",
1535 |       "muscle_ids": [
1536 |         "Obliques"
1537 |       ]
1538 |     },
1539 |     {
1540 |       "exercise_name": "Cable Kneeling Low To High Wood Chopper",
1541 |       "secondary_muscles": [],
1542 |       "difficulty": "Beginner",
1543 |       "url": "https://musclewiki.com/cables/male/obliques/cable-kneeling-low-to-high-wood-chopper",
1544 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-kneeling-low-to-high-wood-chopper-front.mp4",
1545 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-kneeling-low-to-high-wood-chopper-side.mp4",
1546 |       "mechanic": "Isolation",
1547 |       "exercise_name_zh": "绳索跪姿高位",
1548 |       "equipment_type": "cables",
1549 |       "equipment_type_zh": "绳索",
1550 |       "muscle_ids": [
1551 |         "Obliques"
1552 |       ]
1553 |     },
1554 |     {
1555 |       "exercise_name": "Cable Kneeling Oblique Crunch",
1556 |       "secondary_muscles": [],
1557 |       "difficulty": "Beginner",
1558 |       "url": "https://musclewiki.com/cables/male/obliques/cable-kneeling-oblique-crunch",
1559 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-kneeling-oblique-crunch-front.mp4",
1560 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-kneeling-oblique-crunch-side.mp4",
1561 |       "mechanic": "Isolation",
1562 |       "exercise_name_zh": "绳索跪姿侧腹卷腹",
1563 |       "equipment_type": "cables",
1564 |       "equipment_type_zh": "绳索",
1565 |       "muscle_ids": [
1566 |         "Obliques"
1567 |       ]
1568 |     },
1569 |     {
1570 |       "exercise_name": "Cable Kneeling Pallof Press",
1571 |       "secondary_muscles": [],
1572 |       "difficulty": "Beginner",
1573 |       "url": "https://musclewiki.com/cables/male/obliques/cable-kneeling-pallof-press",
1574 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-kneeling-pallof-press-front.mp4",
1575 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-kneeling-pallof-press-side.mp4",
1576 |       "mechanic": "Isolation",
1577 |       "exercise_name_zh": "绳索跪姿",
1578 |       "equipment_type": "cables",
1579 |       "equipment_type_zh": "绳索",
1580 |       "muscle_ids": [
1581 |         "Obliques"
1582 |       ]
1583 |     },
1584 |     {
1585 |       "exercise_name": "Cable Kneeling Pallof Press To Wood Chopper",
1586 |       "secondary_muscles": [],
1587 |       "difficulty": "Beginner",
1588 |       "url": "https://musclewiki.com/cables/male/obliques/cable-kneeling-pallof-press-to-wood-chopper",
1589 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-kneeling-pallof-press-to-wood-chopper-front.mp4",
1590 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-kneeling-pallof-press-to-wood-chopper-side.mp4",
1591 |       "mechanic": "Isolation",
1592 |       "exercise_name_zh": "绳索跪姿",
1593 |       "equipment_type": "cables",
1594 |       "equipment_type_zh": "绳索",
1595 |       "muscle_ids": [
1596 |         "Obliques"
1597 |       ]
1598 |     },
1599 |     {
1600 |       "exercise_name": "Cable Kneeling Wood Chopper",
1601 |       "secondary_muscles": [],
1602 |       "difficulty": "Beginner",
1603 |       "url": "https://musclewiki.com/cables/male/obliques/cable-kneeling-wood-chopper",
1604 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-kneeling-wood-chopper-front.mp4",
1605 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-kneeling-wood-chopper-side.mp4",
1606 |       "mechanic": "Isolation",
1607 |       "exercise_name_zh": "绳索跪姿",
1608 |       "equipment_type": "cables",
1609 |       "equipment_type_zh": "绳索",
1610 |       "muscle_ids": [
1611 |         "Obliques"
1612 |       ]
1613 |     },
1614 |     {
1615 |       "exercise_name": "Cable Oblique Pushdown",
1616 |       "secondary_muscles": [],
1617 |       "difficulty": "Beginner",
1618 |       "url": "https://musclewiki.com/cables/male/obliques/cable-oblique-pushdown",
1619 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-oblique-pushdown-front.mp4",
1620 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-oblique-pushdown-side.mp4",
1621 |       "mechanic": "Isolation",
1622 |       "exercise_name_zh": "绳索斜向下压",
1623 |       "equipment_type": "cables",
1624 |       "equipment_type_zh": "绳索",
1625 |       "muscle_ids": [
1626 |         "Obliques"
1627 |       ]
1628 |     },
1629 |     {
1630 |       "exercise_name": "Cable Pallof Press",
1631 |       "secondary_muscles": [],
1632 |       "difficulty": "Beginner",
1633 |       "url": "https://musclewiki.com/cables/male/obliques/cable-pallof-press",
1634 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-pallof-press-front.mp4",
1635 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-pallof-press-side.mp4",
1636 |       "mechanic": "Isolation",
1637 |       "exercise_name_zh": "绳索帕洛夫抗旋转推举",
1638 |       "equipment_type": "cables",
1639 |       "equipment_type_zh": "绳索",
1640 |       "muscle_ids": [
1641 |         "Obliques"
1642 |       ]
1643 |     },
1644 |     {
1645 |       "exercise_name": "Cable Pallof Press Rotation",
1646 |       "secondary_muscles": [],
1647 |       "difficulty": "Beginner",
1648 |       "url": "https://musclewiki.com/cables/male/obliques/cable-pallof-press-rotation",
1649 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-pallof-press-rotation-front.mp4",
1650 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-pallof-press-rotation-side.mp4",
1651 |       "mechanic": "Isolation",
1652 |       "exercise_name_zh": "绳索帕洛夫抗旋转推举（旋转变化式）",
1653 |       "equipment_type": "cables",
1654 |       "equipment_type_zh": "绳索",
1655 |       "muscle_ids": [
1656 |         "Obliques"
1657 |       ]
1658 |     },
1659 |     {
1660 |       "exercise_name": "Cable Side Bend",
1661 |       "secondary_muscles": [],
1662 |       "difficulty": "Beginner",
1663 |       "url": "https://musclewiki.com/cables/male/obliques/cable-side-bend",
1664 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-side-bend-front.mp4",
1665 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-side-bend-side.mp4",
1666 |       "mechanic": "Isolation",
1667 |       "exercise_name_zh": "绳索侧弯",
1668 |       "equipment_type": "cables",
1669 |       "equipment_type_zh": "绳索",
1670 |       "muscle_ids": [
1671 |         "Obliques"
1672 |       ]
1673 |     },
1674 |     {
1675 |       "exercise_name": "Cable Wood Chopper",
1676 |       "secondary_muscles": [],
1677 |       "difficulty": "Beginner",
1678 |       "url": "https://musclewiki.com/cables/male/obliques/cable-wood-chopper",
1679 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-wood-chopper-front.mp4",
1680 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-wood-chopper-side.mp4",
1681 |       "mechanic": "Isolation",
1682 |       "exercise_name_zh": "绳索砍木式旋转",
1683 |       "equipment_type": "cables",
1684 |       "equipment_type_zh": "绳索",
1685 |       "muscle_ids": [
1686 |         "Obliques"
1687 |       ]
1688 |     },
1689 |     {
1690 |       "exercise_name": "Cable Rope Kneeling Face Pull",
1691 |       "secondary_muscles": [],
1692 |       "difficulty": "Beginner",
1693 |       "url": "https://musclewiki.com/cables/male/posterior-deltoid/cable-rope-kneeling-face-pull",
1694 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-kneeling-face-pull-front.mp4",
1695 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-kneeling-face-pull-side.mp4",
1696 |       "mechanic": "Isolation",
1697 |       "exercise_name_zh": "绳索跪姿",
1698 |       "equipment_type": "cables",
1699 |       "equipment_type_zh": "绳索",
1700 |       "muscle_ids": [
1701 |         "Posterior Deltoid"
1702 |       ]
1703 |     },
1704 |     {
1705 |       "exercise_name": "Cable Seated Leg Extension",
1706 |       "exercise_name_zh": "绳索坐姿腿伸展",
1707 |       "secondary_muscles": [],
1708 |       "difficulty": "Beginner",
1709 |       "url": "https://musclewiki.com/cables/male/quads/cable-seated-leg-extension",
1710 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-seated-leg-extension-front.mp4",
1711 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-seated-leg-extension-side.mp4",
1712 |       "mechanic": "Isolation",
1713 |       "equipment_type": "cables",
1714 |       "equipment_type_zh": "绳索",
1715 |       "muscle_ids": [
1716 |         "Quads"
1717 |       ]
1718 |     },
1719 |     {
1720 |       "exercise_name": "Cable Standing Leg Extension",
1721 |       "exercise_name_zh": "绳索站姿",
1722 |       "secondary_muscles": [],
1723 |       "difficulty": "Beginner",
1724 |       "url": "https://musclewiki.com/cables/male/quads/cable-standing-leg-extension",
1725 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-leg-extension-front.mp4",
1726 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-standing-leg-extension-side.mp4",
1727 |       "mechanic": "Isolation",
1728 |       "equipment_type": "cables",
1729 |       "equipment_type_zh": "绳索",
1730 |       "muscle_ids": [
1731 |         "Quads"
1732 |       ]
1733 |     },
1734 |     {
1735 |       "exercise_name": "Cable External Rotation",
1736 |       "secondary_muscles": [],
1737 |       "difficulty": "Beginner",
1738 |       "url": "https://musclewiki.com/cables/male/rear-shoulders/cable-external-rotation",
1739 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-external-rotation-front.mp4",
1740 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-external-rotation-side.mp4",
1741 |       "mechanic": "Isolation",
1742 |       "exercise_name_zh": "绳索外旋",
1743 |       "equipment_type": "cables",
1744 |       "equipment_type_zh": "绳索",
1745 |       "muscle_ids": [
1746 |         "Rear Shoulders"
1747 |       ]
1748 |     },
1749 |     {
1750 |       "exercise_name": "Cable Bar Face Pull",
1751 |       "secondary_muscles": [],
1752 |       "difficulty": "Beginner",
1753 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-bar-face-pull",
1754 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-face-pull-front.mp4",
1755 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-face-pull-side.mp4",
1756 |       "mechanic": "Isolation",
1757 |       "exercise_name_zh": "绳索直杆",
1758 |       "equipment_type": "cables",
1759 |       "equipment_type_zh": "绳索",
1760 |       "muscle_ids": [
1761 |         "Shoulders"
1762 |       ]
1763 |     },
1764 |     {
1765 |       "exercise_name": "Cable Bar Front Raise",
1766 |       "secondary_muscles": [],
1767 |       "difficulty": "Beginner",
1768 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-bar-front-raise",
1769 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-front-raise-front.mp4",
1770 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-front-raise-side.mp4",
1771 |       "mechanic": "Isolation",
1772 |       "exercise_name_zh": "绳索直杆",
1773 |       "equipment_type": "cables",
1774 |       "equipment_type_zh": "绳索",
1775 |       "muscle_ids": [
1776 |         "Shoulders"
1777 |       ]
1778 |     },
1779 |     {
1780 |       "exercise_name": "Cable Behind The Back Lateral Raise",
1781 |       "secondary_muscles": [],
1782 |       "difficulty": "Beginner",
1783 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-behind-the-back-lateral-raise",
1784 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-behind-the-back-lateral-raise-front.mp4",
1785 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-behind-the-back-lateral-raise-side.mp4",
1786 |       "mechanic": "Isolation",
1787 |       "exercise_name_zh": "绳索背后侧平举",
1788 |       "equipment_type": "cables",
1789 |       "equipment_type_zh": "绳索",
1790 |       "muscle_ids": [
1791 |         "Shoulders"
1792 |       ]
1793 |     },
1794 |     {
1795 |       "exercise_name": "Cable High Internally Rotated Reverse Fly",
1796 |       "secondary_muscles": [],
1797 |       "difficulty": "Beginner",
1798 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-high-internally-rotated-reverse-fly",
1799 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-internally-rotated-reverse-fly-front.mp4",
1800 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-internally-rotated-reverse-fly-side.mp4",
1801 |       "mechanic": "Isolation",
1802 |       "exercise_name_zh": "绳索高位反握",
1803 |       "equipment_type": "cables",
1804 |       "equipment_type_zh": "绳索",
1805 |       "muscle_ids": [
1806 |         "Shoulders"
1807 |       ]
1808 |     },
1809 |     {
1810 |       "exercise_name": "Cable High Reverse Fly",
1811 |       "secondary_muscles": [],
1812 |       "difficulty": "Beginner",
1813 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-high-reverse-fly",
1814 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-reverse-fly-front.mp4",
1815 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-reverse-fly-side.mp4",
1816 |       "mechanic": "Isolation",
1817 |       "exercise_name_zh": "绳索高位反握",
1818 |       "equipment_type": "cables",
1819 |       "equipment_type_zh": "绳索",
1820 |       "muscle_ids": [
1821 |         "Shoulders"
1822 |       ]
1823 |     },
1824 |     {
1825 |       "exercise_name": "Cable High Single Arm Rear Delt Fly",
1826 |       "secondary_muscles": [],
1827 |       "difficulty": "Beginner",
1828 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-high-single-arm-rear-delt-fly",
1829 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-single-arm-rear-delt-fly-front.mp4",
1830 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-high-single-arm-rear-delt-fly-side.mp4",
1831 |       "mechanic": "Isolation",
1832 |       "exercise_name_zh": "绳索高位单臂",
1833 |       "equipment_type": "cables",
1834 |       "equipment_type_zh": "绳索",
1835 |       "muscle_ids": [
1836 |         "Shoulders"
1837 |       ]
1838 |     },
1839 |     {
1840 |       "exercise_name": "Cable Low Bilateral Lateral Raise",
1841 |       "secondary_muscles": [],
1842 |       "difficulty": "Beginner",
1843 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-low-bilateral-lateral-raise",
1844 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-low-bilateral-lateral-raise-front.mp4",
1845 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-low-bilateral-lateral-raise-side.mp4",
1846 |       "mechanic": "Isolation",
1847 |       "exercise_name_zh": "绳索低位双侧侧平举",
1848 |       "equipment_type": "cables",
1849 |       "equipment_type_zh": "绳索",
1850 |       "muscle_ids": [
1851 |         "Shoulders"
1852 |       ]
1853 |     },
1854 |     {
1855 |       "exercise_name": "Cable Low Single Arm Lateral Raise",
1856 |       "secondary_muscles": [],
1857 |       "difficulty": "Beginner",
1858 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-low-single-arm-lateral-raise",
1859 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-low-single-arm-lateral-raise-front.mp4",
1860 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-low-single-arm-lateral-raise-side.mp4",
1861 |       "mechanic": "Isolation",
1862 |       "exercise_name_zh": "绳索单臂",
1863 |       "equipment_type": "cables",
1864 |       "equipment_type_zh": "绳索",
1865 |       "muscle_ids": [
1866 |         "Shoulders"
1867 |       ]
1868 |     },
1869 |     {
1870 |       "exercise_name": "Cable Overhead Press",
1871 |       "secondary_muscles": [],
1872 |       "difficulty": "Beginner",
1873 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-overhead-press",
1874 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-overhead-press-front.mp4",
1875 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-overhead-press-side.mp4",
1876 |       "mechanic": "Isolation",
1877 |       "exercise_name_zh": "绳索过头推举",
1878 |       "equipment_type": "cables",
1879 |       "equipment_type_zh": "绳索",
1880 |       "muscle_ids": [
1881 |         "Shoulders"
1882 |       ]
1883 |     },
1884 |     {
1885 |       "exercise_name": "Cable Rope Front Raise",
1886 |       "secondary_muscles": [],
1887 |       "difficulty": "Beginner",
1888 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-rope-front-raise",
1889 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-front-raise-front.mp4",
1890 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-front-raise-side.mp4",
1891 |       "mechanic": "Isolation",
1892 |       "exercise_name_zh": "绳索前平举",
1893 |       "equipment_type": "cables",
1894 |       "equipment_type_zh": "绳索",
1895 |       "muscle_ids": [
1896 |         "Shoulders"
1897 |       ]
1898 |     },
1899 |     {
1900 |       "exercise_name": "Cable Rope Mid Lateral Raise",
1901 |       "secondary_muscles": [],
1902 |       "difficulty": "Beginner",
1903 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-rope-mid-lateral-raise",
1904 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-mid-lateral-raise-front.mp4",
1905 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-mid-lateral-raise-side.mp4",
1906 |       "mechanic": "Isolation",
1907 |       "exercise_name_zh": "绳索中段侧平举",
1908 |       "equipment_type": "cables",
1909 |       "equipment_type_zh": "绳索",
1910 |       "muscle_ids": [
1911 |         "Shoulders"
1912 |       ]
1913 |     },
1914 |     {
1915 |       "exercise_name": "Cable Rope Single Arm Low Lateral Raise",
1916 |       "secondary_muscles": [],
1917 |       "difficulty": "Beginner",
1918 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-rope-single-arm-low-lateral-raise",
1919 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-single-arm-low-lateral-raise-front.mp4",
1920 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-single-arm-low-lateral-raise-side.mp4",
1921 |       "mechanic": "Isolation",
1922 |       "exercise_name_zh": "绳索单臂",
1923 |       "equipment_type": "cables",
1924 |       "equipment_type_zh": "绳索",
1925 |       "muscle_ids": [
1926 |         "Shoulders"
1927 |       ]
1928 |     },
1929 |     {
1930 |       "exercise_name": "Cable Rope Upright Row",
1931 |       "secondary_muscles": [],
1932 |       "difficulty": "Beginner",
1933 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-rope-upright-row",
1934 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-upright-row-front.mp4",
1935 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-upright-row-side.mp4",
1936 |       "mechanic": "Isolation",
1937 |       "exercise_name_zh": "绳索划船",
1938 |       "equipment_type": "cables",
1939 |       "equipment_type_zh": "绳索",
1940 |       "muscle_ids": [
1941 |         "Shoulders"
1942 |       ]
1943 |     },
1944 |     {
1945 |       "exercise_name": "Cable Seated Bar Face Pull",
1946 |       "secondary_muscles": [],
1947 |       "difficulty": "Beginner",
1948 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-seated-bar-face-pull",
1949 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-seated-bar-face-pull-front.mp4",
1950 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-seated-bar-face-pull-side.mp4",
1951 |       "mechanic": "Isolation",
1952 |       "exercise_name_zh": "绳索直杆",
1953 |       "equipment_type": "cables",
1954 |       "equipment_type_zh": "绳索",
1955 |       "muscle_ids": [
1956 |         "Shoulders"
1957 |       ]
1958 |     },
1959 |     {
1960 |       "exercise_name": "Cable Seated Rope Face Pull",
1961 |       "secondary_muscles": [],
1962 |       "difficulty": "Beginner",
1963 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-seated-rope-face-pull",
1964 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-seated-rope-face-pull-front.mp4",
1965 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-seated-rope-face-pull-side.mp4",
1966 |       "mechanic": "Isolation",
1967 |       "exercise_name_zh": "绳索坐姿绳索面拉",
1968 |       "equipment_type": "cables",
1969 |       "equipment_type_zh": "绳索",
1970 |       "muscle_ids": [
1971 |         "Shoulders"
1972 |       ]
1973 |     },
1974 |     {
1975 |       "exercise_name": "Cable Seated Single Arm Face Pull",
1976 |       "secondary_muscles": [],
1977 |       "difficulty": "Beginner",
1978 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-seated-single-arm-face-pull",
1979 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-seated-single-arm-face-pull-front.mp4",
1980 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-seated-single-arm-face-pull-side.mp4",
1981 |       "mechanic": "Isolation",
1982 |       "exercise_name_zh": "绳索单臂",
1983 |       "equipment_type": "cables",
1984 |       "equipment_type_zh": "绳索",
1985 |       "muscle_ids": [
1986 |         "Shoulders"
1987 |       ]
1988 |     },
1989 |     {
1990 |       "exercise_name": "Cable Single Arm Internally Rotated High Reverse Fly",
1991 |       "secondary_muscles": [],
1992 |       "difficulty": "Beginner",
1993 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-single-arm-internally-rotated-high-reverse-fly",
1994 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-internally-rotated-high-reverse-fly-front.mp4",
1995 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-internally-rotated-high-reverse-fly-side.mp4",
1996 |       "mechanic": "Isolation",
1997 |       "exercise_name_zh": "绳索高位单臂反握",
1998 |       "equipment_type": "cables",
1999 |       "equipment_type_zh": "绳索",
2000 |       "muscle_ids": [
2001 |         "Shoulders"
2002 |       ]
2003 |     },
2004 |     {
2005 |       "exercise_name": "Cable Upright Row",
2006 |       "secondary_muscles": [],
2007 |       "difficulty": "Beginner",
2008 |       "url": "https://musclewiki.com/cables/male/shoulders/cable-upright-row",
2009 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-upright-row-front.mp4",
2010 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-upright-row-side.mp4",
2011 |       "mechanic": "Isolation",
2012 |       "exercise_name_zh": "绳索划船",
2013 |       "equipment_type": "cables",
2014 |       "equipment_type_zh": "绳索",
2015 |       "muscle_ids": [
2016 |         "Shoulders"
2017 |       ]
2018 |     },
2019 |     {
2020 |       "exercise_name": "Machine Face Pulls",
2021 |       "secondary_muscles": [],
2022 |       "difficulty": "Beginner",
2023 |       "url": "https://musclewiki.com/cables/male/shoulders/machine-face-pulls",
2024 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-machine-face-pulls-front.mp4",
2025 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-machine-face-pulls-side.mp4",
2026 |       "mechanic": "Isolation",
2027 |       "equipment_type": "cables",
2028 |       "equipment_type_zh": "绳索",
2029 |       "muscle_ids": [
2030 |         "Shoulders"
2031 |       ]
2032 |     },
2033 |     {
2034 |       "exercise_name": "Cable 30 Degree Shrug",
2035 |       "secondary_muscles": [],
2036 |       "difficulty": "Beginner",
2037 |       "url": "https://musclewiki.com/cables/male/traps/cable-30-degree-shrug",
2038 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-30-degree-shrug-front.mp4",
2039 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-30-degree-shrug-side.mp4",
2040 |       "mechanic": "Isolation",
2041 |       "exercise_name_zh": "绳索30 度耸肩",
2042 |       "equipment_type": "cables",
2043 |       "equipment_type_zh": "绳索",
2044 |       "muscle_ids": [
2045 |         "Traps"
2046 |       ]
2047 |     },
2048 |     {
2049 |       "exercise_name": "Cable Single Arm 30 Degree Shrug",
2050 |       "secondary_muscles": [],
2051 |       "difficulty": "Beginner",
2052 |       "url": "https://musclewiki.com/cables/male/traps/cable-single-arm-30-degree-shrug",
2053 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-30-degree-shrug-front.mp4",
2054 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-30-degree-shrug-side.mp4",
2055 |       "mechanic": "Isolation",
2056 |       "exercise_name_zh": "绳索单臂",
2057 |       "equipment_type": "cables",
2058 |       "equipment_type_zh": "绳索",
2059 |       "muscle_ids": [
2060 |         "Traps"
2061 |       ]
2062 |     },
2063 |     {
2064 |       "exercise_name": "Cable Silverback Shrug",
2065 |       "secondary_muscles": [],
2066 |       "difficulty": "Beginner",
2067 |       "url": "https://musclewiki.com/cables/male/traps-middle/cable-silverback-shrug",
2068 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-silverback-shrug-front.mp4",
2069 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-silverback-shrug-side.mp4",
2070 |       "mechanic": "Isolation",
2071 |       "exercise_name_zh": "绳索银背耸肩",
2072 |       "equipment_type": "cables",
2073 |       "equipment_type_zh": "绳索",
2074 |       "muscle_ids": [
2075 |         "Traps Middle"
2076 |       ]
2077 |     },
2078 |     {
2079 |       "exercise_name": "Cable Single Arm Rear Delt Row",
2080 |       "secondary_muscles": [],
2081 |       "difficulty": "Beginner",
2082 |       "url": "https://musclewiki.com/cables/male/traps-middle/cable-single-arm-rear-delt-row",
2083 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-rear-delt-row-front.mp4",
2084 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-rear-delt-row-side.mp4",
2085 |       "mechanic": "Isolation",
2086 |       "exercise_name_zh": "绳索单臂划船",
2087 |       "equipment_type": "cables",
2088 |       "equipment_type_zh": "绳索",
2089 |       "muscle_ids": [
2090 |         "Traps Middle"
2091 |       ]
2092 |     },
2093 |     {
2094 |       "exercise_name": "Cable Bar Pushdown",
2095 |       "secondary_muscles": [],
2096 |       "difficulty": "Beginner",
2097 |       "url": "https://musclewiki.com/cables/male/triceps/cable-bar-pushdown",
2098 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-pushdown-front.mp4",
2099 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-pushdown-side.mp4",
2100 |       "mechanic": "Isolation",
2101 |       "exercise_name_zh": "绳索直杆",
2102 |       "equipment_type": "cables",
2103 |       "equipment_type_zh": "绳索",
2104 |       "muscle_ids": [
2105 |         "Triceps"
2106 |       ]
2107 |     },
2108 |     {
2109 |       "exercise_name": "Cable Bar Reverse Grip Pushdown",
2110 |       "secondary_muscles": [],
2111 |       "difficulty": "Beginner",
2112 |       "url": "https://musclewiki.com/cables/male/triceps/cable-bar-reverse-grip-pushdown",
2113 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-reverse-grip-pushdown-front.mp4",
2114 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-reverse-grip-pushdown-side.mp4",
2115 |       "mechanic": "Isolation",
2116 |       "exercise_name_zh": "绳索反握直杆",
2117 |       "equipment_type": "cables",
2118 |       "equipment_type_zh": "绳索",
2119 |       "muscle_ids": [
2120 |         "Triceps"
2121 |       ]
2122 |     },
2123 |     {
2124 |       "exercise_name": "Cable Bar Skullcrusher",
2125 |       "secondary_muscles": [],
2126 |       "difficulty": "Beginner",
2127 |       "url": "https://musclewiki.com/cables/male/triceps/cable-bar-skullcrusher",
2128 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-skullcrusher-front.mp4",
2129 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bar-skullcrusher-side.mp4",
2130 |       "mechanic": "Isolation",
2131 |       "exercise_name_zh": "绳索直杆",
2132 |       "equipment_type": "cables",
2133 |       "equipment_type_zh": "绳索",
2134 |       "muscle_ids": [
2135 |         "Triceps"
2136 |       ]
2137 |     },
2138 |     {
2139 |       "exercise_name": "Cable Bent Over Single Arm Overhead Tricep Extension",
2140 |       "secondary_muscles": [],
2141 |       "difficulty": "Beginner",
2142 |       "url": "https://musclewiki.com/cables/male/triceps/cable-bent-over-single-arm-overhead-tricep-extension",
2143 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bent-over-single-arm-overhead-tricep-extension-front.mp4",
2144 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-bent-over-single-arm-overhead-tricep-extension-side.mp4",
2145 |       "mechanic": "Isolation",
2146 |       "exercise_name_zh": "绳索单臂",
2147 |       "equipment_type": "cables",
2148 |       "equipment_type_zh": "绳索",
2149 |       "muscle_ids": [
2150 |         "Triceps"
2151 |       ]
2152 |     },
2153 |     {
2154 |       "exercise_name": "Cable Cross Pushdown",
2155 |       "secondary_muscles": [],
2156 |       "difficulty": "Beginner",
2157 |       "url": "https://musclewiki.com/cables/male/triceps/cable-cross-pushdown",
2158 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-cross-pushdown-front.mp4",
2159 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-cross-pushdown-side.mp4",
2160 |       "mechanic": "Isolation",
2161 |       "exercise_name_zh": "绳索交叉下压",
2162 |       "equipment_type": "cables",
2163 |       "equipment_type_zh": "绳索",
2164 |       "muscle_ids": [
2165 |         "Triceps"
2166 |       ]
2167 |     },
2168 |     {
2169 |       "exercise_name": "Cable Leaning Single Arm Skullover",
2170 |       "secondary_muscles": [],
2171 |       "difficulty": "Beginner",
2172 |       "url": "https://musclewiki.com/cables/male/triceps/cable-leaning-single-arm-skullover",
2173 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-leaning-single-arm-skullover-front.mp4",
2174 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-leaning-single-arm-skullover-side.mp4",
2175 |       "mechanic": "Isolation",
2176 |       "exercise_name_zh": "绳索单臂",
2177 |       "equipment_type": "cables",
2178 |       "equipment_type_zh": "绳索",
2179 |       "muscle_ids": [
2180 |         "Triceps"
2181 |       ]
2182 |     },
2183 |     {
2184 |       "exercise_name": "Cable Overhead Tricep Press",
2185 |       "secondary_muscles": [],
2186 |       "difficulty": "Beginner",
2187 |       "url": "https://musclewiki.com/cables/male/triceps/cable-overhead-tricep-press",
2188 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-overhead-tricep-press-front.mp4",
2189 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-overhead-tricep-press-side.mp4",
2190 |       "mechanic": "Isolation",
2191 |       "exercise_name_zh": "绳索过头三头肌推举",
2192 |       "equipment_type": "cables",
2193 |       "equipment_type_zh": "绳索",
2194 |       "muscle_ids": [
2195 |         "Triceps"
2196 |       ]
2197 |     },
2198 |     {
2199 |       "exercise_name": "Cable Rope Overhead Tricep Extension",
2200 |       "secondary_muscles": [],
2201 |       "difficulty": "Beginner",
2202 |       "url": "https://musclewiki.com/cables/male/triceps/cable-rope-overhead-tricep-extension",
2203 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-overhead-tricep-extension-front.mp4",
2204 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-overhead-tricep-extension-side.mp4",
2205 |       "mechanic": "Isolation",
2206 |       "exercise_name_zh": "绳索过头三头肌伸展",
2207 |       "equipment_type": "cables",
2208 |       "equipment_type_zh": "绳索",
2209 |       "muscle_ids": [
2210 |         "Triceps"
2211 |       ]
2212 |     },
2213 |     {
2214 |       "exercise_name": "Cable Rope Pushdown",
2215 |       "secondary_muscles": [],
2216 |       "difficulty": "Beginner",
2217 |       "url": "https://musclewiki.com/cables/male/triceps/cable-rope-pushdown",
2218 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-pushdown-front.mp4",
2219 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-pushdown-side.mp4",
2220 |       "mechanic": "Isolation",
2221 |       "exercise_name_zh": "绳索下压",
2222 |       "equipment_type": "cables",
2223 |       "equipment_type_zh": "绳索",
2224 |       "muscle_ids": [
2225 |         "Triceps"
2226 |       ]
2227 |     },
2228 |     {
2229 |       "exercise_name": "Cable Rope Skullcrusher",
2230 |       "secondary_muscles": [],
2231 |       "difficulty": "Beginner",
2232 |       "url": "https://musclewiki.com/cables/male/triceps/cable-rope-skullcrusher",
2233 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-skullcrusher-front.mp4",
2234 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-rope-skullcrusher-side.mp4",
2235 |       "mechanic": "Isolation",
2236 |       "exercise_name_zh": "绳索仰卧臂屈伸",
2237 |       "equipment_type": "cables",
2238 |       "equipment_type_zh": "绳索",
2239 |       "muscle_ids": [
2240 |         "Triceps"
2241 |       ]
2242 |     },
2243 |     {
2244 |       "exercise_name": "Cable Single Arm Cross Pushdown",
2245 |       "secondary_muscles": [],
2246 |       "difficulty": "Beginner",
2247 |       "url": "https://musclewiki.com/cables/male/triceps/cable-single-arm-cross-pushdown",
2248 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-cross-pushdown-front.mp4",
2249 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-cross-pushdown-side.mp4",
2250 |       "mechanic": "Isolation",
2251 |       "exercise_name_zh": "绳索单臂",
2252 |       "equipment_type": "cables",
2253 |       "equipment_type_zh": "绳索",
2254 |       "muscle_ids": [
2255 |         "Triceps"
2256 |       ]
2257 |     },
2258 |     {
2259 |       "exercise_name": "Cable Single Arm Incline Bench Press",
2260 |       "secondary_muscles": [],
2261 |       "difficulty": "Beginner",
2262 |       "url": "https://musclewiki.com/cables/male/triceps/cable-single-arm-incline-bench-press",
2263 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-incline-bench-press-front.mp4",
2264 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-incline-bench-press-side.mp4",
2265 |       "mechanic": "Isolation",
2266 |       "exercise_name_zh": "绳索上斜单臂卧推",
2267 |       "equipment_type": "cables",
2268 |       "equipment_type_zh": "绳索",
2269 |       "muscle_ids": [
2270 |         "Triceps"
2271 |       ]
2272 |     },
2273 |     {
2274 |       "exercise_name": "Cable Single Arm Overhead Tricep Extension",
2275 |       "secondary_muscles": [],
2276 |       "difficulty": "Beginner",
2277 |       "url": "https://musclewiki.com/cables/male/triceps/cable-single-arm-overhead-tricep-extension",
2278 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-overhead-tricep-extension-front.mp4",
2279 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-overhead-tricep-extension-side.mp4",
2280 |       "mechanic": "Isolation",
2281 |       "exercise_name_zh": "绳索单臂",
2282 |       "equipment_type": "cables",
2283 |       "equipment_type_zh": "绳索",
2284 |       "muscle_ids": [
2285 |         "Triceps"
2286 |       ]
2287 |     },
2288 |     {
2289 |       "exercise_name": "Cable Single Arm Pushdown",
2290 |       "secondary_muscles": [],
2291 |       "difficulty": "Beginner",
2292 |       "url": "https://musclewiki.com/cables/male/triceps/cable-single-arm-pushdown",
2293 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-pushdown-front.mp4",
2294 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-pushdown-side.mp4",
2295 |       "mechanic": "Isolation",
2296 |       "exercise_name_zh": "绳索单臂",
2297 |       "equipment_type": "cables",
2298 |       "equipment_type_zh": "绳索",
2299 |       "muscle_ids": [
2300 |         "Triceps"
2301 |       ]
2302 |     },
2303 |     {
2304 |       "exercise_name": "Cable Single Arm Rope Pushdown",
2305 |       "secondary_muscles": [],
2306 |       "difficulty": "Beginner",
2307 |       "url": "https://musclewiki.com/cables/male/triceps/cable-single-arm-rope-pushdown",
2308 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-rope-pushdown-front.mp4",
2309 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-rope-pushdown-side.mp4",
2310 |       "mechanic": "Isolation",
2311 |       "exercise_name_zh": "绳索单臂",
2312 |       "equipment_type": "cables",
2313 |       "equipment_type_zh": "绳索",
2314 |       "muscle_ids": [
2315 |         "Triceps"
2316 |       ]
2317 |     },
2318 |     {
2319 |       "exercise_name": "Cable Single Arm Skullcrusher",
2320 |       "secondary_muscles": [],
2321 |       "difficulty": "Beginner",
2322 |       "url": "https://musclewiki.com/cables/male/triceps/cable-single-arm-skullcrusher",
2323 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-skullcrusher-front.mp4",
2324 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-single-arm-skullcrusher-side.mp4",
2325 |       "mechanic": "Isolation",
2326 |       "exercise_name_zh": "绳索单臂",
2327 |       "equipment_type": "cables",
2328 |       "equipment_type_zh": "绳索",
2329 |       "muscle_ids": [
2330 |         "Triceps"
2331 |       ]
2332 |     },
2333 |     {
2334 |       "exercise_name": "Cable Tricep Kickback",
2335 |       "secondary_muscles": [],
2336 |       "difficulty": "Beginner",
2337 |       "url": "https://musclewiki.com/cables/male/triceps/cable-tricep-kickback",
2338 |       "url-video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-tricep-kickback-front.mp4",
2339 |       "url-video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Cables-cable-tricep-kickback-side.mp4",
2340 |       "mechanic": "Isolation",
2341 |       "exercise_name_zh": "绳索三头肌后踢",
2342 |       "equipment_type": "cables",
2343 |       "equipment_type_zh": "绳索",
2344 |       "muscle_ids": [
2345 |         "Triceps"
2346 |       ]
2347 |     }
2348 |   ]
2349 | }
</content>
</file>
</files>
<environment_details>
# VSCode Visible Files
frontend\src\features\report\components\WorkoutReportModal.tsx,frontend\src\features\anatomy\constants\musclePaths.ts

# VSCode Open Tabs
../Users/Leo X1/.gemini/antigravity/brain/a7136be9-9ecc-4838-9eee-047d05bb0d4e/task.md,../Users/Leo X1/.gemini/antigravity/brain/a7136be9-9ecc-4838-9eee-047d05bb0d4e/walkthrough.md,../Users/Leo X1/.gemini/antigravity/brain/a49a8412-842a-4531-8408-31a3134b7fcb/walkthrough.md,../Users/Leo X1/.gemini/antigravity/brain/b9772538-bba1-4012-b82f-394ff47bc64e/walkthrough.md,../Users/Leo X1/.gemini/antigravity/brain/a49a8412-842a-4531-8408-31a3134b7fcb/implementation_plan.md,components/RoutineBuilder.tsx,services/RoutineAIService.ts,json.d.ts,data/comprehensive_exercises.ts,../Users/Leo X1/.gemini/antigravity/brain/b98bc365-3dbc-4cc3-a6b4-298fb960c167/implementation_plan.md,../Users/Leo X1/.gemini/antigravity/brain/b98bc365-3dbc-4cc3-a6b4-298fb960c167/walkthrough.md,../Users/Leo X1/.gemini/antigravity/brain/86adafe1-02b3-4d87-b107-18d8efbe8475/implementation_plan.md,components/SwipeableCard.tsx,../Users/Leo X1/.gemini/antigravity/brain/14133304-7a83-4026-b3b4-0db98619114b/walkthrough.md,services/SVGExportService.ts,services/VectorPDFExportService.ts,services/PNGExportService.ts,hooks/useAdaptiveHeight.ts,components/AdaptiveHeightContainer.tsx,docs/FUNCTIONALITY_TEST_REPORT.md

# Actively Running Terminals
## Terminal 1 (Active)
### Working Directory: `c:\zenfit`
### Original command: `cd frontend && npm run dev`
## Terminal 2 (Active)
### Working Directory: `c:\zenfit`
### Original command: `cd frontend && npm run dev 2>&1 | findstr /C:"Loaded" /C:"Total exercises"`

# Current Time
Current time in ISO 8601 UTC format: 2025-12-28T12:44:21.171Z
User time zone: Asia/Hong_Kong, UTC+8:00

# Current Cost
$0.00

# Current Mode
<slug>code</slug>
<name>Code</name>
<model>claude-sonnet-4-5-20250929</model>
<tool_format>xml</tool_format>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

我找到问题了！cables-final-video.json文件的数据结构与其他文件不同：

**关键差异：**
1. 其他文件使用 `data` 字段存储练习数组
2. cables文件使用 `exercises` 字段存储练习数组
3. **最重要的是：cables文件中缺少 `muscle_module_en` 字段！**

看第970-983行的例子：
```json
{
  "exercise_name": "Cable Braced Wrist Curl",
  "secondary_muscles": [],
  "difficulty": "Beginner",
  ...
  "exercise_name_zh": "绳索支撑腕弯举",
  "equipment_type": "cables",
  "equipment_type_zh": "绳索",
  "muscle_ids": ["Forearms"]
}
```

注意：**没有 `muscle_module_en` 字段**！

而ExerciseNameMappingService.ts的第82行要求：
```typescript
if (exercise.exercise_name_zh && exercise.muscle_module_en) {
```

这就是为什么cables文件加载了0个映射的根因！

现在我需要比较一个正常工作的文件来确认。让我读取barbell文件的一小部分来验证：

<read_file>
<args>
  <file>
    <path>frontend/public/Library/barbell-final-video.json</path>
  </file>
</args>
</read_file>

---

**User:**

[read_file for 'frontend/public/Library/barbell-final-video.json'. Reading multiple files at once is more efficient for the LLM. If other files are relevant to your current task, please read them simultaneously.] Result:
<files>
<file><path>frontend/public/Library/barbell-final-video.json</path>
<content lines="1-4322">
   1 | {
   2 |     "total_exercise_count": 174,
   3 |     "data": [
   4 |         {
   5 |             "original_url": "https://musclewiki.com/exercise/barbell-bent-over-row",
   6 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-bent-over-row",
   7 |             "exercise_name_zh": "杠铃俯身划船",
   8 |             "muscle_module_zh": "背阔肌",
   9 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-bent-over-row-front.jpg",
  10 |             "muscle_module_en": "Barbell Bent Over Row",
  11 |             "muscle_ids": [
  12 |                 "forearms",
  13 |                 "biceps",
  14 |                 "lats"
  15 |             ],
  16 |             "muscle_ids_zh": [
  17 |                 "前臂肌群",
  18 |                 "肱二头肌",
  19 |                 "背阔肌"
  20 |             ],
  21 |             "mechanic": "复合动作",
  22 |             "mechanic_raw": "复合动作",
  23 |             "mechanic_source": "from_dt:机制",
  24 |             "difficulty": "中级",
  25 |             "notes": "fallback",
  26 |             "equipment_type": "barbell",
  27 |             "equipment_type_zh": "杠铃",
  28 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-bent-over-row-front.mp4",
  29 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-bent-over-row-side.mp4"
  30 |         },
  31 |         {
  32 |             "original_url": "https://musclewiki.com/exercise/barbell-supinated-pendlay-row",
  33 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-supinated-pendlay-row",
  34 |             "exercise_name_zh": "杠铃反手Pendlay划船",
  35 |             "muscle_module_zh": "背阔肌",
  36 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-supinated-pendlay-row-front.jpg",
  37 |             "muscle_module_en": "Pendlay",
  38 |             "muscle_ids": [
  39 |                 "biceps",
  40 |                 "lats"
  41 |             ],
  42 |             "muscle_ids_zh": [
  43 |                 "肱二头肌",
  44 |                 "背阔肌"
  45 |             ],
  46 |             "mechanic": "复合动作",
  47 |             "mechanic_raw": "复合动作",
  48 |             "mechanic_source": "from_dt:机制",
  49 |             "difficulty": "高级",
  50 |             "notes": "fallback",
  51 |             "equipment_type": "barbell",
  52 |             "equipment_type_zh": "杠铃",
  53 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-supinated-pendlay-row-front.mp4",
  54 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-supinated-pendlay-row-side.mp4"
  55 |         },
  56 |         {
  57 |             "original_url": "https://musclewiki.com/exercise/landmine-sit-up",
  58 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-sit-up",
  59 |             "exercise_name_zh": "地雷式仰卧起坐",
  60 |             "muscle_module_zh": "腹肌",
  61 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-sit-up-side.jpg",
  62 |             "muscle_module_en": "Landmine Sit Up",
  63 |             "muscle_ids": [
  64 |                 "abdominals"
  65 |             ],
  66 |             "muscle_ids_zh": [
  67 |                 "腹直肌"
  68 |             ],
  69 |             "mechanic": "孤立动作",
  70 |             "mechanic_raw": "孤立动作",
  71 |             "mechanic_source": "from_dt:机制",
  72 |             "difficulty": "中级",
  73 |             "notes": "fallback",
  74 |             "equipment_type": "barbell",
  75 |             "equipment_type_zh": "杠铃",
  76 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-sit-up-front.mp4",
  77 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-sit-up-side.mp4"
  78 |         },
  79 |         {
  80 |             "original_url": "https://musclewiki.com/exercise/barbell-pronated-row",
  81 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-pronated-row",
  82 |             "exercise_name_zh": "杠铃俯身划船（正握）",
  83 |             "muscle_module_zh": "背阔肌",
  84 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-pronated-row-front.jpg",
  85 |             "muscle_module_en": "Barbell Pronated Row",
  86 |             "muscle_ids": [
  87 |                 "forearms",
  88 |                 "biceps",
  89 |                 "lats"
  90 |             ],
  91 |             "muscle_ids_zh": [
  92 |                 "前臂肌群",
  93 |                 "肱二头肌",
  94 |                 "背阔肌"
  95 |             ],
  96 |             "mechanic": "复合动作",
  97 |             "mechanic_raw": "复合动作",
  98 |             "mechanic_source": "from_dt:机制",
  99 |             "difficulty": "中级",
 100 |             "notes": "fallback",
 101 |             "equipment_type": "barbell",
 102 |             "equipment_type_zh": "杠铃",
 103 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-pronated-row-front.mp4",
 104 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-pronated-row-side.mp4"
 105 |         },
 106 |         {
 107 |             "original_url": "https://musclewiki.com/exercise/barbell-block-conventional-deadlift",
 108 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-block-conventional-deadlift",
 109 |             "exercise_name_zh": "杠铃高位常规硬拉",
 110 |             "muscle_module_zh": "下背部",
 111 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-block-conventional-deadlift-side.jpg",
 112 |             "muscle_module_en": "Barbell Block Conventional Deadlift",
 113 |             "muscle_ids": [
 114 |                 "glutes"
 115 |             ],
 116 |             "muscle_ids_zh": [
 117 |                 "臀大肌"
 118 |             ],
 119 |             "mechanic": "复合动作",
 120 |             "mechanic_raw": "复合动作",
 121 |             "mechanic_source": "from_dt:机制",
 122 |             "difficulty": "中级",
 123 |             "notes": "fallback",
 124 |             "equipment_type": "barbell",
 125 |             "equipment_type_zh": "杠铃",
 126 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-block-conventional-deadlift-front.mp4",
 127 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-block-conventional-deadlift-side.mp4"
 128 |         },
 129 |         {
 130 |             "original_url": "https://musclewiki.com/exercise/landmine-t-bar-rows",
 131 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-t-bar-rows",
 132 |             "exercise_name_zh": "Landmine T杠划船",
 133 |             "muscle_module_zh": "背阔肌",
 134 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-t-bar-rows-side.jpg",
 135 |             "muscle_module_en": "Landmine T",
 136 |             "muscle_ids": [
 137 |                 "biceps",
 138 |                 "lats"
 139 |             ],
 140 |             "muscle_ids_zh": [
 141 |                 "肱二头肌",
 142 |                 "背阔肌"
 143 |             ],
 144 |             "mechanic": "复合动作",
 145 |             "mechanic_raw": "复合动作",
 146 |             "mechanic_source": "from_dt:机制",
 147 |             "difficulty": "初学者",
 148 |             "notes": "fallback",
 149 |             "equipment_type": "barbell",
 150 |             "equipment_type_zh": "杠铃",
 151 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-t-bar-rows-front.mp4",
 152 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-t-bar-rows-side.mp4"
 153 |         },
 154 |         {
 155 |             "original_url": "https://musclewiki.com/exercise/barbell-rack-pull",
 156 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-rack-pull",
 157 |             "exercise_name_zh": "Barbell Rack Pull",
 158 |             "muscle_module_zh": "斜方肌（中背）",
 159 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-rack-pull-front.jpg",
 160 |             "muscle_module_en": "Barbell Rack Pull",
 161 |             "muscle_ids": [
 162 |                 "lats",
 163 |                 "biceps"
 164 |             ],
 165 |             "muscle_ids_zh": [],
 166 |             "mechanic": "复合动作",
 167 |             "mechanic_raw": "复合动作",
 168 |             "mechanic_source": "from_dt:机制",
 169 |             "difficulty": "初学者",
 170 |             "notes": "fallback",
 171 |             "equipment_type": "barbell",
 172 |             "equipment_type_zh": "杠铃",
 173 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-rack-pull-front.mp4",
 174 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-rack-pull-side.mp4"
 175 |         },
 176 |         {
 177 |             "original_url": "https://musclewiki.com/exercise/barbell-drag-curl",
 178 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-drag-curl",
 179 |             "exercise_name_zh": "杠铃拖式弯举",
 180 |             "muscle_module_zh": "二头肌",
 181 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-drag-curl-side.jpg",
 182 |             "muscle_module_en": "Barbell Drag Curl",
 183 |             "muscle_ids": [
 184 |                 "biceps"
 185 |             ],
 186 |             "muscle_ids_zh": [
 187 |                 "肱二头肌"
 188 |             ],
 189 |             "mechanic": "孤立动作",
 190 |             "mechanic_raw": "孤立动作",
 191 |             "mechanic_source": "from_dt:机制",
 192 |             "difficulty": "中级",
 193 |             "notes": "fallback",
 194 |             "equipment_type": "barbell",
 195 |             "equipment_type_zh": "杠铃",
 196 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-drag-curl-front.mp4",
 197 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-drag-curl-side.mp4"
 198 |         },
 199 |         {
 200 |             "original_url": "https://musclewiki.com/exercise/barbell-landmine-row",
 201 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-landmine-row",
 202 |             "exercise_name_zh": "杠铃地雷划船",
 203 |             "muscle_module_zh": "斜方肌（中背）",
 204 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-landmine-row-front.jpg",
 205 |             "muscle_module_en": "Barbell Landmine Row",
 206 |             "muscle_ids": [
 207 |                 "lats",
 208 |                 "biceps",
 209 |                 "traps-middle"
 210 |             ],
 211 |             "muscle_ids_zh": [],
 212 |             "mechanic": "复合动作",
 213 |             "mechanic_raw": "复合动作",
 214 |             "mechanic_source": "from_dt:机制",
 215 |             "difficulty": "中级",
 216 |             "notes": "fallback",
 217 |             "equipment_type": "barbell",
 218 |             "equipment_type_zh": "杠铃",
 219 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-landmine-row-front.mp4",
 220 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-landmine-row-side.mp4"
 221 |         },
 222 |         {
 223 |             "original_url": "https://musclewiki.com/exercise/ez-bar-reverse-preacher-curl",
 224 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/ez-bar-reverse-preacher-curl",
 225 |             "exercise_name_zh": "EZ杆反手牧师凳弯举",
 226 |             "muscle_module_zh": "二头肌",
 227 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-ez-bar-reverse-preacher-curl-front.jpg",
 228 |             "muscle_module_en": "EZ",
 229 |             "muscle_ids": [
 230 |                 "forearms",
 231 |                 "biceps"
 232 |             ],
 233 |             "muscle_ids_zh": [
 234 |                 "前臂肌群",
 235 |                 "肱二头肌"
 236 |             ],
 237 |             "mechanic": "孤立动作",
 238 |             "mechanic_raw": "孤立动作",
 239 |             "mechanic_source": "from_dt:机制",
 240 |             "difficulty": "新手",
 241 |             "notes": "fallback",
 242 |             "equipment_type": "barbell",
 243 |             "equipment_type_zh": "杠铃",
 244 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-ez-bar-reverse-preacher-curl-front.mp4",
 245 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-ez-bar-reverse-preacher-curl-side.mp4"
 246 |         },
 247 |         {
 248 |             "original_url": "https://musclewiki.com/exercise/barbell-banded-deadlift",
 249 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-banded-deadlift",
 250 |             "exercise_name_zh": "Barbell Banded Deadlift",
 251 |             "muscle_module_zh": "臀部",
 252 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-banded-deadlift-front.jpg",
 253 |             "muscle_module_en": "Barbell Banded Deadlift",
 254 |             "muscle_ids": [
 255 |                 "glutes"
 256 |             ],
 257 |             "muscle_ids_zh": [
 258 |                 "臀大肌"
 259 |             ],
 260 |             "mechanic": "复合动作",
 261 |             "mechanic_raw": "复合动作",
 262 |             "mechanic_source": "from_dt:机制",
 263 |             "difficulty": "中级",
 264 |             "notes": "fallback",
 265 |             "equipment_type": "barbell",
 266 |             "equipment_type_zh": "杠铃",
 267 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-banded-deadlift-front.mp4",
 268 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-banded-deadlift-side.mp4"
 269 |         },
 270 |         {
 271 |             "original_url": "https://musclewiki.com/exercise/barbell-power-snatch",
 272 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-power-snatch",
 273 |             "exercise_name_zh": "杠铃力量抓举",
 274 |             "muscle_module_zh": "下背部",
 275 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-power-snatch-side.jpg",
 276 |             "muscle_module_en": "Barbell Power Snatch",
 277 |             "muscle_ids": [
 278 |                 "glutes"
 279 |             ],
 280 |             "muscle_ids_zh": [
 281 |                 "臀大肌"
 282 |             ],
 283 |             "mechanic": "复合动作",
 284 |             "mechanic_raw": "复合动作",
 285 |             "mechanic_source": "from_dt:机制",
 286 |             "difficulty": "中级",
 287 |             "notes": "fallback",
 288 |             "equipment_type": "barbell",
 289 |             "equipment_type_zh": "杠铃",
 290 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-power-snatch-front.mp4",
 291 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-power-snatch-side.mp4"
 292 |         },
 293 |         {
 294 |             "original_url": "https://musclewiki.com/exercise/barbell-zercher-good-morning",
 295 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-zercher-good-morning",
 296 |             "exercise_name_zh": "肘窝抱杠挺背",
 297 |             "muscle_module_zh": "臀部",
 298 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-zercher-good-morning-front.jpg",
 299 |             "muscle_module_en": "Barbell Zercher Good Morning",
 300 |             "muscle_ids": [
 301 |                 "hamstrings",
 302 |                 "glutes"
 303 |             ],
 304 |             "muscle_ids_zh": [
 305 |                 "腘绳肌",
 306 |                 "臀大肌"
 307 |             ],
 308 |             "mechanic": "复合动作",
 309 |             "mechanic_raw": "复合动作",
 310 |             "mechanic_source": "from_dt:机制",
 311 |             "difficulty": "高级",
 312 |             "notes": "fallback",
 313 |             "equipment_type": "barbell",
 314 |             "equipment_type_zh": "杠铃",
 315 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-zercher-good-morning-front.mp4",
 316 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-zercher-good-morning-side.mp4"
 317 |         },
 318 |         {
 319 |             "original_url": "https://musclewiki.com/exercise/ez-bar-preacher-curl",
 320 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/ez-bar-preacher-curl",
 321 |             "exercise_name_zh": "EZ杆牧师凳弯举",
 322 |             "muscle_module_zh": "二头肌",
 323 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-ez-bar-preacher-curl-side.jpg",
 324 |             "muscle_module_en": "EZ",
 325 |             "muscle_ids": [
 326 |                 "biceps"
 327 |             ],
 328 |             "muscle_ids_zh": [
 329 |                 "肱二头肌"
 330 |             ],
 331 |             "mechanic": "孤立动作",
 332 |             "mechanic_raw": "孤立动作",
 333 |             "mechanic_source": "from_dt:机制",
 334 |             "difficulty": "新手",
 335 |             "notes": "fallback",
 336 |             "equipment_type": "barbell",
 337 |             "equipment_type_zh": "杠铃",
 338 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-ez-bar-preacher-curl-front.mp4",
 339 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-ez-bar-preacher-curl-side.mp4"
 340 |         },
 341 |         {
 342 |             "original_url": "https://musclewiki.com/exercise/barbell-reverse-deadlift",
 343 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-reverse-deadlift",
 344 |             "exercise_name_zh": "杠铃反握硬拉",
 345 |             "muscle_module_zh": "股四头肌",
 346 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-reverse-deadlift-front.jpg",
 347 |             "muscle_module_en": "Barbell Reverse Deadlift",
 348 |             "muscle_ids": [
 349 |                 "quads",
 350 |                 "glutes"
 351 |             ],
 352 |             "muscle_ids_zh": [
 353 |                 "股四头肌",
 354 |                 "臀大肌"
 355 |             ],
 356 |             "mechanic": "复合动作",
 357 |             "mechanic_raw": "复合动作",
 358 |             "mechanic_source": "from_dt:机制",
 359 |             "difficulty": "高级",
 360 |             "notes": "fallback",
 361 |             "equipment_type": "barbell",
 362 |             "equipment_type_zh": "杠铃",
 363 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-reverse-deadlift-front.mp4",
 364 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-reverse-deadlift-side.mp4"
 365 |         },
 366 |         {
 367 |             "original_url": "https://musclewiki.com/exercise/barbell-single-leg-deadlift",
 368 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-single-leg-deadlift",
 369 |             "exercise_name_zh": "Barbell Single Leg Deadlift",
 370 |             "muscle_module_zh": "臀部",
 371 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-single-leg-deadlift-side.jpg",
 372 |             "muscle_module_en": "Barbell Single Leg Deadlift",
 373 |             "muscle_ids": [
 374 |                 "hamstrings",
 375 |                 "glutes"
 376 |             ],
 377 |             "muscle_ids_zh": [
 378 |                 "腘绳肌",
 379 |                 "臀大肌"
 380 |             ],
 381 |             "mechanic": "复合动作",
 382 |             "mechanic_raw": "复合动作",
 383 |             "mechanic_source": "from_dt:机制",
 384 |             "difficulty": "高级",
 385 |             "notes": "fallback",
 386 |             "equipment_type": "barbell",
 387 |             "equipment_type_zh": "杠铃",
 388 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-single-leg-deadlift-front.mp4",
 389 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-single-leg-deadlift-side.mp4"
 390 |         },
 391 |         {
 392 |             "original_url": "https://musclewiki.com/exercise/barbell-front-squat-olympic",
 393 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-front-squat-olympic",
 394 |             "exercise_name_zh": "奥林匹克杠铃前蹲",
 395 |             "muscle_module_zh": "臀部",
 396 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-front-squat-olympic-side.jpg",
 397 |             "muscle_module_en": "Barbell Front Squat Olympic",
 398 |             "muscle_ids": [
 399 |                 "quads",
 400 |                 "abdominals",
 401 |                 "glutes"
 402 |             ],
 403 |             "muscle_ids_zh": [
 404 |                 "股四头肌",
 405 |                 "腹直肌",
 406 |                 "臀大肌"
 407 |             ],
 408 |             "mechanic": "复合动作",
 409 |             "mechanic_raw": "复合动作",
 410 |             "mechanic_source": "from_dt:机制",
 411 |             "difficulty": "高级",
 412 |             "notes": "fallback",
 413 |             "equipment_type": "barbell",
 414 |             "equipment_type_zh": "杠铃",
 415 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-front-squat-olympic-front.mp4",
 416 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-front-squat-olympic-side.mp4"
 417 |         },
 418 |         {
 419 |             "original_url": "https://musclewiki.com/exercise/barbell-zercher-squat",
 420 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-zercher-squat",
 421 |             "exercise_name_zh": "杠铃Zercher深蹲",
 422 |             "muscle_module_zh": "臀部",
 423 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-zercher-squat-front.jpg",
 424 |             "muscle_module_en": "Zercher",
 425 |             "muscle_ids": [
 426 |                 "quads",
 427 |                 "glutes"
 428 |             ],
 429 |             "muscle_ids_zh": [
 430 |                 "股四头肌",
 431 |                 "臀大肌"
 432 |             ],
 433 |             "mechanic": "复合动作",
 434 |             "mechanic_raw": "复合动作",
 435 |             "mechanic_source": "from_dt:机制",
 436 |             "difficulty": "高级",
 437 |             "notes": "fallback",
 438 |             "equipment_type": "barbell",
 439 |             "equipment_type_zh": "杠铃",
 440 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-zercher-squat-front.mp4",
 441 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-zercher-squat-side.mp4"
 442 |         },
 443 |         {
 444 |             "original_url": "https://musclewiki.com/exercise/barbell-hang-clean-and-press",
 445 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-hang-clean-and-press",
 446 |             "exercise_name_zh": "Barbell Hang Clean And Press",
 447 |             "muscle_module_zh": "下背部",
 448 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-hang-clean-and-press-front.jpg",
 449 |             "muscle_module_en": "Barbell Hang Clean And Press",
 450 |             "muscle_ids": [
 451 |                 "glutes"
 452 |             ],
 453 |             "muscle_ids_zh": [
 454 |                 "臀大肌"
 455 |             ],
 456 |             "mechanic": "复合动作",
 457 |             "mechanic_raw": "复合动作",
 458 |             "mechanic_source": "from_dt:机制",
 459 |             "difficulty": "高级",
 460 |             "notes": "fallback",
 461 |             "equipment_type": "barbell",
 462 |             "equipment_type_zh": "杠铃",
 463 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-hang-clean-and-press-front.mp4",
 464 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-hang-clean-and-press-side.mp4"
 465 |         },
 466 |         {
 467 |             "original_url": "https://musclewiki.com/exercise/barbell-meadows-row",
 468 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-meadows-row",
 469 |             "exercise_name_zh": "梅多斯杠铃划船",
 470 |             "muscle_module_zh": "背阔肌",
 471 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-meadows-row-side.jpg",
 472 |             "muscle_module_en": "Barbell Meadows Row",
 473 |             "muscle_ids": [
 474 |                 "forearms",
 475 |                 "biceps",
 476 |                 "lats"
 477 |             ],
 478 |             "muscle_ids_zh": [
 479 |                 "前臂肌群",
 480 |                 "肱二头肌",
 481 |                 "背阔肌"
 482 |             ],
 483 |             "mechanic": "复合动作",
 484 |             "mechanic_raw": "复合动作",
 485 |             "mechanic_source": "from_dt:机制",
 486 |             "difficulty": "中级",
 487 |             "notes": "fallback",
 488 |             "equipment_type": "barbell",
 489 |             "equipment_type_zh": "杠铃",
 490 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-meadows-row-front.mp4",
 491 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-meadows-row-side.mp4"
 492 |         },
 493 |         {
 494 |             "original_url": "https://musclewiki.com/exercise/barbell-clean-and-jerk",
 495 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-clean-and-jerk",
 496 |             "exercise_name_zh": "杠铃挺举",
 497 |             "muscle_module_zh": "下背部",
 498 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-clean-and-jerk-front.jpg",
 499 |             "muscle_module_en": "Barbell Clean And Jerk",
 500 |             "muscle_ids": [
 501 |                 "glutes"
 502 |             ],
 503 |             "muscle_ids_zh": [
 504 |                 "臀大肌"
 505 |             ],
 506 |             "mechanic": "复合动作",
 507 |             "mechanic_raw": "复合动作",
 508 |             "mechanic_source": "from_dt:机制",
 509 |             "difficulty": "高级",
 510 |             "notes": "fallback",
 511 |             "equipment_type": "barbell",
 512 |             "equipment_type_zh": "杠铃",
 513 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-clean-and-jerk-front.mp4",
 514 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-clean-and-jerk-side.mp4"
 515 |         },
 516 |         {
 517 |             "original_url": "https://musclewiki.com/exercise/barbell-suitcase-deadlift",
 518 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-suitcase-deadlift",
 519 |             "exercise_name_zh": "杠铃手提箱式硬拉",
 520 |             "muscle_module_zh": "臀部",
 521 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-suitcase-deadlift-front.jpg",
 522 |             "muscle_module_en": "Barbell Suitcase Deadlift",
 523 |             "muscle_ids": [
 524 |                 "obliques",
 525 |                 "forearms",
 526 |                 "hamstrings",
 527 |                 "glutes"
 528 |             ],
 529 |             "muscle_ids_zh": [
 530 |                 "腹外斜肌",
 531 |                 "前臂肌群",
 532 |                 "腘绳肌",
 533 |                 "臀大肌"
 534 |             ],
 535 |             "mechanic": "复合动作",
 536 |             "mechanic_raw": "复合动作",
 537 |             "mechanic_source": "from_dt:机制",
 538 |             "difficulty": "高级",
 539 |             "notes": "fallback",
 540 |             "equipment_type": "barbell",
 541 |             "equipment_type_zh": "杠铃",
 542 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-suitcase-deadlift-front.mp4",
 543 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-suitcase-deadlift-side.mp4"
 544 |         },
 545 |         {
 546 |             "original_url": "https://musclewiki.com/exercise/barbell-muscle-snatch",
 547 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-muscle-snatch",
 548 |             "exercise_name_zh": "杠铃肌力抓举",
 549 |             "muscle_module_zh": "下背部",
 550 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-muscle-snatch-front.jpg",
 551 |             "muscle_module_en": "Barbell Muscle Snatch",
 552 |             "muscle_ids": [
 553 |                 "glutes"
 554 |             ],
 555 |             "muscle_ids_zh": [
 556 |                 "臀大肌"
 557 |             ],
 558 |             "mechanic": "复合动作",
 559 |             "mechanic_raw": "复合动作",
 560 |             "mechanic_source": "from_dt:机制",
 561 |             "difficulty": "中级",
 562 |             "notes": "fallback",
 563 |             "equipment_type": "barbell",
 564 |             "equipment_type_zh": "杠铃",
 565 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-muscle-snatch-front.mp4",
 566 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-muscle-snatch-side.mp4"
 567 |         },
 568 |         {
 569 |             "original_url": "https://musclewiki.com/exercise/barbell-zercher-deficit-lunge",
 570 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-zercher-deficit-lunge",
 571 |             "exercise_name_zh": "杠铃Zercher缺口弓步",
 572 |             "muscle_module_zh": "臀部",
 573 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-zercher-deficit-lunge-front.jpg",
 574 |             "muscle_module_en": "Zercher",
 575 |             "muscle_ids": [
 576 |                 "quads",
 577 |                 "glutes"
 578 |             ],
 579 |             "muscle_ids_zh": [
 580 |                 "股四头肌",
 581 |                 "臀大肌"
 582 |             ],
 583 |             "mechanic": "复合动作",
 584 |             "mechanic_raw": "复合动作",
 585 |             "mechanic_source": "from_dt:机制",
 586 |             "difficulty": "高级",
 587 |             "notes": "fallback",
 588 |             "equipment_type": "barbell",
 589 |             "equipment_type_zh": "杠铃",
 590 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-zercher-deficit-lunge-front.mp4",
 591 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-zercher-deficit-lunge-side.mp4"
 592 |         },
 593 |         {
 594 |             "original_url": "https://musclewiki.com/exercise/landmine-staggered-romanian-deadlift",
 595 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-staggered-romanian-deadlift",
 596 |             "exercise_name_zh": "Landmine交错站姿罗马尼亚硬拉",
 597 |             "muscle_module_zh": "臀部",
 598 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-staggered-romanian-deadlift-front.jpg",
 599 |             "muscle_module_en": "Landmine",
 600 |             "muscle_ids": [
 601 |                 "hamstrings",
 602 |                 "glutes"
 603 |             ],
 604 |             "muscle_ids_zh": [
 605 |                 "腘绳肌",
 606 |                 "臀大肌"
 607 |             ],
 608 |             "mechanic": "复合动作",
 609 |             "mechanic_raw": "复合动作",
 610 |             "mechanic_source": "from_dt:机制",
 611 |             "difficulty": "高级",
 612 |             "notes": "fallback",
 613 |             "equipment_type": "barbell",
 614 |             "equipment_type_zh": "杠铃",
 615 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-staggered-romanian-deadlift-front.mp4",
 616 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-staggered-romanian-deadlift-side.mp4"
 617 |         },
 618 |         {
 619 |             "original_url": "https://musclewiki.com/exercise/barbell-deficit-conventional-deadlift",
 620 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-deficit-conventional-deadlift",
 621 |             "exercise_name_zh": "杠铃赤字常规硬拉",
 622 |             "muscle_module_zh": "下背部",
 623 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-deficit-conventional-deadlift-front.jpg",
 624 |             "muscle_module_en": "Barbell Deficit Conventional Deadlift",
 625 |             "muscle_ids": [
 626 |                 "glutes"
 627 |             ],
 628 |             "muscle_ids_zh": [
 629 |                 "臀大肌"
 630 |             ],
 631 |             "mechanic": "复合动作",
 632 |             "mechanic_raw": "复合动作",
 633 |             "mechanic_source": "from_dt:机制",
 634 |             "difficulty": "中级",
 635 |             "notes": "fallback",
 636 |             "equipment_type": "barbell",
 637 |             "equipment_type_zh": "杠铃",
 638 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-deficit-conventional-deadlift-front.mp4",
 639 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-deficit-conventional-deadlift-side.mp4"
 640 |         },
 641 |         {
 642 |             "original_url": "https://musclewiki.com/exercise/barbell-hooklying-bench-press",
 643 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-hooklying-bench-press",
 644 |             "exercise_name_zh": "杠铃屈膝卧推",
 645 |             "muscle_module_zh": "胸部",
 646 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-hooklying-bench-press-front.jpg",
 647 |             "muscle_module_en": "Barbell Hooklying Bench Press",
 648 |             "muscle_ids": [
 649 |                 "abdominals",
 650 |                 "chest",
 651 |                 "triceps"
 652 |             ],
 653 |             "muscle_ids_zh": [
 654 |                 "腹直肌",
 655 |                 "胸大肌",
 656 |                 "肱三头肌"
 657 |             ],
 658 |             "mechanic": "复合动作",
 659 |             "mechanic_raw": "复合动作",
 660 |             "mechanic_source": "from_dt:机制",
 661 |             "difficulty": "高级",
 662 |             "notes": "fallback",
 663 |             "equipment_type": "barbell",
 664 |             "equipment_type_zh": "杠铃",
 665 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-hooklying-bench-press-front.mp4",
 666 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-hooklying-bench-press-side.mp4"
 667 |         },
 668 |         {
 669 |             "original_url": "https://musclewiki.com/exercise/landmine-single-leg-romanian-deadlift",
 670 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-single-leg-romanian-deadlift",
 671 |             "exercise_name_zh": "Landmine 单腿罗马尼亚硬拉",
 672 |             "muscle_module_zh": "臀部",
 673 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-single-leg-romanian-deadlift-front.jpg",
 674 |             "muscle_module_en": "Landmine",
 675 |             "muscle_ids": [
 676 |                 "hamstrings",
 677 |                 "glutes"
 678 |             ],
 679 |             "muscle_ids_zh": [
 680 |                 "腘绳肌",
 681 |                 "臀大肌"
 682 |             ],
 683 |             "mechanic": "复合动作",
 684 |             "mechanic_raw": "复合动作",
 685 |             "mechanic_source": "from_dt:机制",
 686 |             "difficulty": "中级",
 687 |             "notes": "fallback",
 688 |             "equipment_type": "barbell",
 689 |             "equipment_type_zh": "杠铃",
 690 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-single-leg-romanian-deadlift-front.mp4",
 691 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-single-leg-romanian-deadlift-side.mp4"
 692 |         },
 693 |         {
 694 |             "original_url": "https://musclewiki.com/exercise/barbell-high-bar-good-morning",
 695 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-high-bar-good-morning",
 696 |             "exercise_name_zh": "杠铃高位早安",
 697 |             "muscle_module_zh": "臀部",
 698 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-high-bar-good-morning-front.jpg",
 699 |             "muscle_module_en": "Barbell High Bar Good Morning",
 700 |             "muscle_ids": [
 701 |                 "hamstrings",
 702 |                 "glutes"
 703 |             ],
 704 |             "muscle_ids_zh": [
 705 |                 "腘绳肌",
 706 |                 "臀大肌"
 707 |             ],
 708 |             "mechanic": "复合动作",
 709 |             "mechanic_raw": "复合动作",
 710 |             "mechanic_source": "from_dt:机制",
 711 |             "difficulty": "高级",
 712 |             "notes": "fallback",
 713 |             "equipment_type": "barbell",
 714 |             "equipment_type_zh": "杠铃",
 715 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-high-bar-good-morning-front.mp4",
 716 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-high-bar-good-morning-side.mp4"
 717 |         },
 718 |         {
 719 |             "original_url": "https://musclewiki.com/exercise/landmine-concentration-curl",
 720 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-concentration-curl",
 721 |             "exercise_name_zh": "单臂地雷集中弯举",
 722 |             "muscle_module_zh": "二头肌",
 723 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-concentration-curl-side.jpg",
 724 |             "muscle_module_en": "Landmine Concentration Curl",
 725 |             "muscle_ids": [
 726 |                 "biceps"
 727 |             ],
 728 |             "muscle_ids_zh": [
 729 |                 "肱二头肌"
 730 |             ],
 731 |             "mechanic": "孤立动作",
 732 |             "mechanic_raw": "孤立动作",
 733 |             "mechanic_source": "from_dt:机制",
 734 |             "difficulty": "中级",
 735 |             "notes": "fallback",
 736 |             "equipment_type": "barbell",
 737 |             "equipment_type_zh": "杠铃",
 738 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-concentration-curl-front.mp4",
 739 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-concentration-curl-side.mp4"
 740 |         },
 741 |         {
 742 |             "original_url": "https://musclewiki.com/exercise/barbell-clean-and-press",
 743 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-clean-and-press",
 744 |             "exercise_name_zh": "Barbell Clean And Press",
 745 |             "muscle_module_zh": "下背部",
 746 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-clean-and-press-side.jpg",
 747 |             "muscle_module_en": "Barbell Clean And Press",
 748 |             "muscle_ids": [
 749 |                 "glutes"
 750 |             ],
 751 |             "muscle_ids_zh": [
 752 |                 "臀大肌"
 753 |             ],
 754 |             "mechanic": "复合动作",
 755 |             "mechanic_raw": "复合动作",
 756 |             "mechanic_source": "from_dt:机制",
 757 |             "difficulty": "高级",
 758 |             "notes": "fallback",
 759 |             "equipment_type": "barbell",
 760 |             "equipment_type_zh": "杠铃",
 761 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-clean-and-press-front.mp4",
 762 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-clean-and-press-side.mp4"
 763 |         },
 764 |         {
 765 |             "original_url": "https://musclewiki.com/exercise/barbell-sumo-pause-deadlift",
 766 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-sumo-pause-deadlift",
 767 |             "exercise_name_zh": "杠铃相扑式停顿硬拉",
 768 |             "muscle_module_zh": "下背部",
 769 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-sumo-pause-deadlift-side.jpg",
 770 |             "muscle_module_en": "Barbell Sumo Pause Deadlift",
 771 |             "muscle_ids": [
 772 |                 "glutes"
 773 |             ],
 774 |             "muscle_ids_zh": [
 775 |                 "臀大肌"
 776 |             ],
 777 |             "mechanic": "复合动作",
 778 |             "mechanic_raw": "复合动作",
 779 |             "mechanic_source": "from_dt:机制",
 780 |             "difficulty": "中级",
 781 |             "notes": "fallback",
 782 |             "equipment_type": "barbell",
 783 |             "equipment_type_zh": "杠铃",
 784 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-sumo-pause-deadlift-front.mp4",
 785 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-sumo-pause-deadlift-side.mp4"
 786 |         },
 787 |         {
 788 |             "original_url": "https://musclewiki.com/exercise/barbell-snatch-grip-deadlift",
 789 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-snatch-grip-deadlift",
 790 |             "exercise_name_zh": "杠铃抓举宽握硬拉",
 791 |             "muscle_module_zh": "臀部",
 792 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-snatch-grip-deadlift-front.jpg",
 793 |             "muscle_module_en": "Barbell Snatch Grip Deadlift",
 794 |             "muscle_ids": [
 795 |                 "hamstrings",
 796 |                 "glutes"
 797 |             ],
 798 |             "muscle_ids_zh": [
 799 |                 "腘绳肌",
 800 |                 "臀大肌"
 801 |             ],
 802 |             "mechanic": "复合动作",
 803 |             "mechanic_raw": "复合动作",
 804 |             "mechanic_source": "from_dt:机制",
 805 |             "difficulty": "高级",
 806 |             "notes": "fallback",
 807 |             "equipment_type": "barbell",
 808 |             "equipment_type_zh": "杠铃",
 809 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-snatch-grip-deadlift-front.mp4",
 810 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-snatch-grip-deadlift-side.mp4"
 811 |         },
 812 |         {
 813 |             "original_url": "https://musclewiki.com/exercise/barbell-snatch",
 814 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-snatch",
 815 |             "exercise_name_zh": "杠铃抓举",
 816 |             "muscle_module_zh": "下背部",
 817 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-snatch-side.jpg",
 818 |             "muscle_module_en": "Barbell Snatch",
 819 |             "muscle_ids": [
 820 |                 "glutes"
 821 |             ],
 822 |             "muscle_ids_zh": [
 823 |                 "臀大肌"
 824 |             ],
 825 |             "mechanic": "复合动作",
 826 |             "mechanic_raw": "复合动作",
 827 |             "mechanic_source": "from_dt:机制",
 828 |             "difficulty": "高级",
 829 |             "notes": "fallback",
 830 |             "equipment_type": "barbell",
 831 |             "equipment_type_zh": "杠铃",
 832 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-snatch-front.mp4",
 833 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-snatch-side.mp4"
 834 |         },
 835 |         {
 836 |             "original_url": "https://musclewiki.com/exercise/barbell-curtsy-lunge",
 837 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-curtsy-lunge",
 838 |             "exercise_name_zh": "杠铃礼式弓步",
 839 |             "muscle_module_zh": "臀部",
 840 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-curtsy-lunge-side.jpg",
 841 |             "muscle_module_en": "Barbell Curtsy Lunge",
 842 |             "muscle_ids": [
 843 |                 "quads",
 844 |                 "glutes"
 845 |             ],
 846 |             "muscle_ids_zh": [
 847 |                 "股四头肌",
 848 |                 "臀大肌"
 849 |             ],
 850 |             "mechanic": "复合动作",
 851 |             "mechanic_raw": "复合动作",
 852 |             "mechanic_source": "from_dt:机制",
 853 |             "difficulty": "高级",
 854 |             "notes": "fallback",
 855 |             "equipment_type": "barbell",
 856 |             "equipment_type_zh": "杠铃",
 857 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-curtsy-lunge-front.mp4",
 858 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-curtsy-lunge-side.mp4"
 859 |         },
 860 |         {
 861 |             "original_url": "https://musclewiki.com/exercise/barbell-toes-up-calf-raise",
 862 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-toes-up-calf-raise",
 863 |             "exercise_name_zh": "杠铃脚尖朝上提踵",
 864 |             "muscle_module_zh": "小腿",
 865 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-toes-up-calf-raise-front.jpg",
 866 |             "muscle_module_en": "Barbell Toes Up Calf Raise",
 867 |             "muscle_ids": [
 868 |                 "calves"
 869 |             ],
 870 |             "muscle_ids_zh": [
 871 |                 "小腿三头肌"
 872 |             ],
 873 |             "mechanic": "孤立动作",
 874 |             "mechanic_raw": "孤立动作",
 875 |             "mechanic_source": "from_dt:机制",
 876 |             "difficulty": "初学者",
 877 |             "notes": "fallback",
 878 |             "equipment_type": "barbell",
 879 |             "equipment_type_zh": "杠铃",
 880 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-toes-up-calf-raise-front.mp4",
 881 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-toes-up-calf-raise-side.mp4"
 882 |         },
 883 |         {
 884 |             "original_url": "https://musclewiki.com/exercise/barbell-pause-box-squat",
 885 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-pause-box-squat",
 886 |             "exercise_name_zh": "杠铃暂停箱式深蹲",
 887 |             "muscle_module_zh": "臀部",
 888 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-pause-box-squat-front.jpg",
 889 |             "muscle_module_en": "Barbell Pause Box Squat",
 890 |             "muscle_ids": [
 891 |                 "quads",
 892 |                 "glutes"
 893 |             ],
 894 |             "muscle_ids_zh": [
 895 |                 "股四头肌",
 896 |                 "臀大肌"
 897 |             ],
 898 |             "mechanic": "复合动作",
 899 |             "mechanic_raw": "复合动作",
 900 |             "mechanic_source": "from_dt:机制",
 901 |             "difficulty": "高级",
 902 |             "notes": "fallback",
 903 |             "equipment_type": "barbell",
 904 |             "equipment_type_zh": "杠铃",
 905 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-pause-box-squat-front.mp4",
 906 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-pause-box-squat-side.mp4"
 907 |         },
 908 |         {
 909 |             "original_url": "https://musclewiki.com/exercise/barbell-wrist-extension",
 910 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-wrist-extension",
 911 |             "exercise_name_zh": "杠铃反向腕弯举",
 912 |             "muscle_module_zh": "前臂",
 913 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-wrist-extension-front.jpg",
 914 |             "muscle_module_en": "Barbell Wrist Extension",
 915 |             "muscle_ids": [
 916 |                 "forearms"
 917 |             ],
 918 |             "muscle_ids_zh": [
 919 |                 "前臂肌群"
 920 |             ],
 921 |             "mechanic": "孤立动作",
 922 |             "mechanic_raw": "孤立动作",
 923 |             "mechanic_source": "from_dt:机制",
 924 |             "difficulty": "新手",
 925 |             "notes": "fallback",
 926 |             "equipment_type": "barbell",
 927 |             "equipment_type_zh": "杠铃",
 928 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-wrist-extension-front.mp4",
 929 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-wrist-extension-side.mp4"
 930 |         },
 931 |         {
 932 |             "original_url": "https://musclewiki.com/exercise/landmine-romanian-deadlift",
 933 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-romanian-deadlift",
 934 |             "exercise_name_zh": "Landmine 罗马尼亚硬拉",
 935 |             "muscle_module_zh": "臀部",
 936 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-romanian-deadlift-side.jpg",
 937 |             "muscle_module_en": "Landmine",
 938 |             "muscle_ids": [
 939 |                 "hamstrings",
 940 |                 "glutes"
 941 |             ],
 942 |             "muscle_ids_zh": [
 943 |                 "腘绳肌",
 944 |                 "臀大肌"
 945 |             ],
 946 |             "mechanic": "复合动作",
 947 |             "mechanic_raw": "复合动作",
 948 |             "mechanic_source": "from_dt:机制",
 949 |             "difficulty": "中级",
 950 |             "notes": "fallback",
 951 |             "equipment_type": "barbell",
 952 |             "equipment_type_zh": "杠铃",
 953 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-romanian-deadlift-front.mp4",
 954 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-romanian-deadlift-side.mp4"
 955 |         },
 956 |         {
 957 |             "original_url": "https://musclewiki.com/exercise/landmine-snatch",
 958 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-snatch",
 959 |             "exercise_name_zh": "单端杠铃抓举",
 960 |             "muscle_module_zh": "臀部",
 961 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-snatch-front.jpg",
 962 |             "muscle_module_en": "Landmine Snatch",
 963 |             "muscle_ids": [
 964 |                 "front-shoulders",
 965 |                 "glutes",
 966 |                 "rear-shoulders"
 967 |             ],
 968 |             "muscle_ids_zh": [
 969 |                 "三角肌前束",
 970 |                 "臀大肌",
 971 |                 "三角肌后束"
 972 |             ],
 973 |             "mechanic": "复合动作",
 974 |             "mechanic_raw": "复合动作",
 975 |             "mechanic_source": "from_dt:机制",
 976 |             "difficulty": "中级",
 977 |             "notes": "fallback",
 978 |             "equipment_type": "barbell",
 979 |             "equipment_type_zh": "杠铃",
 980 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-snatch-front.mp4",
 981 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-snatch-side.mp4"
 982 |         },
 983 |         {
 984 |             "original_url": "https://musclewiki.com/exercise/standing-tibialis-raise",
 985 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/standing-tibialis-raise",
 986 |             "exercise_name_zh": "站姿胫前肌抬举",
 987 |             "muscle_module_zh": "胫骨前肌",
 988 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-standing-tibialis-raise-side.jpg",
 989 |             "muscle_module_en": "Standing Tibialis Raise",
 990 |             "muscle_ids": [
 991 |                 "shoulders"
 992 |             ],
 993 |             "muscle_ids_zh": [],
 994 |             "mechanic": "孤立动作",
 995 |             "mechanic_raw": "孤立动作",
 996 |             "mechanic_source": "from_dt:机制",
 997 |             "difficulty": "初学者",
 998 |             "notes": "fallback",
 999 |             "equipment_type": "barbell",
1000 |             "equipment_type_zh": "杠铃",
1001 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-standing-tibialis-raise-front.mp4",
1002 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-standing-tibialis-raise-side.mp4"
1003 |         },
1004 |         {
1005 |             "original_url": "https://musclewiki.com/exercise/barbell-long-landmine-row",
1006 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-long-landmine-row",
1007 |             "exercise_name_zh": "长杠地雷划船",
1008 |             "muscle_module_zh": "背阔肌",
1009 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-long-landmine-row-front.jpg",
1010 |             "muscle_module_en": "Barbell Long Landmine Row",
1011 |             "muscle_ids": [
1012 |                 "forearms",
1013 |                 "biceps",
1014 |                 "lats"
1015 |             ],
1016 |             "muscle_ids_zh": [
1017 |                 "前臂肌群",
1018 |                 "肱二头肌",
1019 |                 "背阔肌"
1020 |             ],
1021 |             "mechanic": "复合动作",
1022 |             "mechanic_raw": "复合动作",
1023 |             "mechanic_source": "from_dt:机制",
1024 |             "difficulty": "高级",
1025 |             "notes": "fallback",
1026 |             "equipment_type": "barbell",
1027 |             "equipment_type_zh": "杠铃",
1028 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-long-landmine-row-front.mp4",
1029 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-long-landmine-row-side.mp4"
1030 |         },
1031 |         {
1032 |             "original_url": "https://musclewiki.com/exercise/landmine-hollow-hold",
1033 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-hollow-hold",
1034 |             "exercise_name_zh": "Landmine 空心支撑",
1035 |             "muscle_module_zh": "腹肌",
1036 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-hollow-hold-side.jpg",
1037 |             "muscle_module_en": "Landmine",
1038 |             "muscle_ids": [
1039 |                 "abdominals",
1040 |                 "front-shoulders",
1041 |                 "rear-shoulders"
1042 |             ],
1043 |             "muscle_ids_zh": [
1044 |                 "腹直肌",
1045 |                 "三角肌前束",
1046 |                 "三角肌后束"
1047 |             ],
1048 |             "mechanic": "孤立动作",
1049 |             "mechanic_raw": "孤立动作",
1050 |             "mechanic_source": "from_dt:机制",
1051 |             "difficulty": "高级",
1052 |             "notes": "fallback",
1053 |             "equipment_type": "barbell",
1054 |             "equipment_type_zh": "杠铃",
1055 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-hollow-hold-front.mp4",
1056 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-hollow-hold-side.mp4"
1057 |         },
1058 |         {
1059 |             "original_url": "https://musclewiki.com/exercise/barbell-spinal-jefferson-curl",
1060 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-spinal-jefferson-curl",
1061 |             "exercise_name_zh": "Barbell Spinal Jefferson Curl",
1062 |             "muscle_module_zh": "下背部",
1063 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-spinal-jefferson-curl-side.jpg",
1064 |             "muscle_module_en": "Barbell Spinal Jefferson Curl",
1065 |             "muscle_ids": [
1066 |                 "biceps"
1067 |             ],
1068 |             "muscle_ids_zh": [],
1069 |             "mechanic": "孤立动作",
1070 |             "mechanic_raw": "孤立动作",
1071 |             "mechanic_source": "from_dt:机制",
1072 |             "difficulty": "中级",
1073 |             "notes": "fallback",
1074 |             "equipment_type": "barbell",
1075 |             "equipment_type_zh": "杠铃",
1076 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-spinal-jefferson-curl-front.mp4",
1077 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-spinal-jefferson-curl-side.mp4"
1078 |         },
1079 |         {
1080 |             "original_url": "https://musclewiki.com/exercise/barbell-jefferson-deadlift",
1081 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-jefferson-deadlift",
1082 |             "exercise_name_zh": "杠铃杰斐逊硬拉",
1083 |             "muscle_module_zh": "下背部",
1084 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-jefferson-deadlift-front.jpg",
1085 |             "muscle_module_en": "Barbell Jefferson Deadlift",
1086 |             "muscle_ids": [
1087 |                 "glutes"
1088 |             ],
1089 |             "muscle_ids_zh": [
1090 |                 "臀大肌"
1091 |             ],
1092 |             "mechanic": "复合动作",
1093 |             "mechanic_raw": "复合动作",
1094 |             "mechanic_source": "from_dt:机制",
1095 |             "difficulty": "高级",
1096 |             "notes": "fallback",
1097 |             "equipment_type": "barbell",
1098 |             "equipment_type_zh": "杠铃",
1099 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-jefferson-deadlift-front.mp4",
1100 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-jefferson-deadlift-side.mp4"
1101 |         },
1102 |         {
1103 |             "original_url": "https://musclewiki.com/exercise/barbell-forward-lunge",
1104 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-forward-lunge",
1105 |             "exercise_name_zh": "杠铃前弓步",
1106 |             "muscle_module_zh": "臀部",
1107 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-forward-lunge-front.jpg",
1108 |             "muscle_module_en": "Barbell Forward Lunge",
1109 |             "muscle_ids": [
1110 |                 "quads",
1111 |                 "glutes"
1112 |             ],
1113 |             "muscle_ids_zh": [
1114 |                 "股四头肌",
1115 |                 "臀大肌"
1116 |             ],
1117 |             "mechanic": "复合动作",
1118 |             "mechanic_raw": "复合动作",
1119 |             "mechanic_source": "from_dt:机制",
1120 |             "difficulty": "高级",
1121 |             "notes": "fallback",
1122 |             "equipment_type": "barbell",
1123 |             "equipment_type_zh": "杠铃",
1124 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-forward-lunge-front.mp4",
1125 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-forward-lunge-side.mp4"
1126 |         },
1127 |         {
1128 |             "original_url": "https://musclewiki.com/exercise/barbell-snatch-grip-high-pull",
1129 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-snatch-grip-high-pull",
1130 |             "exercise_name_zh": "杠铃抓举握距高拉",
1131 |             "muscle_module_zh": "斜方肌（中背）",
1132 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-snatch-grip-high-pull-side.jpg",
1133 |             "muscle_module_en": "Barbell Snatch Grip High Pull",
1134 |             "muscle_ids": [
1135 |                 "lats",
1136 |                 "biceps"
1137 |             ],
1138 |             "muscle_ids_zh": [],
1139 |             "mechanic": "复合动作",
1140 |             "mechanic_raw": "复合动作",
1141 |             "mechanic_source": "from_dt:机制",
1142 |             "difficulty": "中级",
1143 |             "notes": "fallback",
1144 |             "equipment_type": "barbell",
1145 |             "equipment_type_zh": "杠铃",
1146 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-snatch-grip-high-pull-front.mp4",
1147 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-snatch-grip-high-pull-side.mp4"
1148 |         },
1149 |         {
1150 |             "original_url": "https://musclewiki.com/exercise/barbell-reverse-curl",
1151 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-reverse-curl",
1152 |             "exercise_name_zh": "反手杠铃弯举",
1153 |             "muscle_module_zh": "二头肌",
1154 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-reverse-curl-front.jpg",
1155 |             "muscle_module_en": "Barbell Reverse Curl",
1156 |             "muscle_ids": [
1157 |                 "forearms",
1158 |                 "biceps"
1159 |             ],
1160 |             "muscle_ids_zh": [
1161 |                 "前臂肌群",
1162 |                 "肱二头肌"
1163 |             ],
1164 |             "mechanic": "孤立动作",
1165 |             "mechanic_raw": "孤立动作",
1166 |             "mechanic_source": "from_dt:机制",
1167 |             "difficulty": "高级",
1168 |             "notes": "fallback",
1169 |             "equipment_type": "barbell",
1170 |             "equipment_type_zh": "杠铃",
1171 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-reverse-curl-front.mp4",
1172 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-reverse-curl-side.mp4"
1173 |         },
1174 |         {
1175 |             "original_url": "https://musclewiki.com/exercise/landmine-calf-raise",
1176 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-calf-raise",
1177 |             "exercise_name_zh": "单端杠铃提踵",
1178 |             "muscle_module_zh": "小腿",
1179 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-calf-raise-side.jpg",
1180 |             "muscle_module_en": "Landmine Calf Raise",
1181 |             "muscle_ids": [
1182 |                 "calves"
1183 |             ],
1184 |             "muscle_ids_zh": [
1185 |                 "小腿三头肌"
1186 |             ],
1187 |             "mechanic": "孤立动作",
1188 |             "mechanic_raw": "孤立动作",
1189 |             "mechanic_source": "from_dt:机制",
1190 |             "difficulty": "中级",
1191 |             "notes": "fallback",
1192 |             "equipment_type": "barbell",
1193 |             "equipment_type_zh": "杠铃",
1194 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-calf-raise-front.mp4",
1195 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-calf-raise-side.mp4"
1196 |         },
1197 |         {
1198 |             "original_url": "https://musclewiki.com/exercise/barbell-pronated-pendlay-row",
1199 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-pronated-pendlay-row",
1200 |             "exercise_name_zh": "Pendlay式杠铃正握划船",
1201 |             "muscle_module_zh": "背阔肌",
1202 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-pronated-pendlay-row-front.jpg",
1203 |             "muscle_module_en": "Pendlay",
1204 |             "muscle_ids": [
1205 |                 "biceps",
1206 |                 "lats"
1207 |             ],
1208 |             "muscle_ids_zh": [
1209 |                 "肱二头肌",
1210 |                 "背阔肌"
1211 |             ],
1212 |             "mechanic": "复合动作",
1213 |             "mechanic_raw": "复合动作",
1214 |             "mechanic_source": "from_dt:机制",
1215 |             "difficulty": "高级",
1216 |             "notes": "fallback",
1217 |             "equipment_type": "barbell",
1218 |             "equipment_type_zh": "杠铃",
1219 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-pronated-pendlay-row-front.mp4",
1220 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-pronated-pendlay-row-side.mp4"
1221 |         },
1222 |         {
1223 |             "original_url": "https://musclewiki.com/exercise/barbell-calf-jump",
1224 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-calf-jump",
1225 |             "exercise_name_zh": "杠铃提踵跳",
1226 |             "muscle_module_zh": "小腿",
1227 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-calf-jump-front.jpg",
1228 |             "muscle_module_en": "Barbell Calf Jump",
1229 |             "muscle_ids": [
1230 |                 "calves"
1231 |             ],
1232 |             "muscle_ids_zh": [
1233 |                 "小腿三头肌"
1234 |             ],
1235 |             "mechanic": "孤立动作",
1236 |             "mechanic_raw": "孤立动作",
1237 |             "mechanic_source": "from_dt:机制",
1238 |             "difficulty": "高级",
1239 |             "notes": "fallback",
1240 |             "equipment_type": "barbell",
1241 |             "equipment_type_zh": "杠铃",
1242 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-calf-jump-front.mp4",
1243 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-calf-jump-side.mp4"
1244 |         },
1245 |         {
1246 |             "original_url": "https://musclewiki.com/exercise/barbell-pause-squat",
1247 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-pause-squat",
1248 |             "exercise_name_zh": "杠铃暂停深蹲",
1249 |             "muscle_module_zh": "臀部",
1250 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-pause-box-squat-front_GEhqEjs.jpg",
1251 |             "muscle_module_en": "Barbell Pause Squat",
1252 |             "muscle_ids": [
1253 |                 "quads",
1254 |                 "glutes"
1255 |             ],
1256 |             "muscle_ids_zh": [
1257 |                 "股四头肌",
1258 |                 "臀大肌"
1259 |             ],
1260 |             "mechanic": "复合动作",
1261 |             "mechanic_raw": "复合动作",
1262 |             "mechanic_source": "from_dt:机制",
1263 |             "difficulty": "中级",
1264 |             "notes": "fallback",
1265 |             "equipment_type": "barbell",
1266 |             "equipment_type_zh": "杠铃",
1267 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-pause-box-squat-front.mp4",
1268 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-pause-box-squat-side.mp4"
1269 |         },
1270 |         {
1271 |             "original_url": "https://musclewiki.com/exercise/barbell-calf-raises",
1272 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-calf-raises",
1273 |             "exercise_name_zh": "杠铃提踵",
1274 |             "muscle_module_zh": "小腿",
1275 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-calf-raises-side.jpg",
1276 |             "muscle_module_en": "Barbell Calf Raises",
1277 |             "muscle_ids": [
1278 |                 "calves"
1279 |             ],
1280 |             "muscle_ids_zh": [
1281 |                 "小腿三头肌"
1282 |             ],
1283 |             "mechanic": "孤立动作",
1284 |             "mechanic_raw": "孤立动作",
1285 |             "mechanic_source": "from_dt:机制",
1286 |             "difficulty": "中级",
1287 |             "notes": "fallback",
1288 |             "equipment_type": "barbell",
1289 |             "equipment_type_zh": "杠铃",
1290 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-calf-raises-front.mp4",
1291 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-calf-raises-side.mp4"
1292 |         },
1293 |         {
1294 |             "original_url": "https://musclewiki.com/exercise/barbell-supinated-row",
1295 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-supinated-row",
1296 |             "exercise_name_zh": "杠铃反握划船",
1297 |             "muscle_module_zh": "背阔肌",
1298 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-supinated-row-front.jpg",
1299 |             "muscle_module_en": "Barbell Supinated Row",
1300 |             "muscle_ids": [
1301 |                 "biceps",
1302 |                 "lats"
1303 |             ],
1304 |             "muscle_ids_zh": [
1305 |                 "肱二头肌",
1306 |                 "背阔肌"
1307 |             ],
1308 |             "mechanic": "复合动作",
1309 |             "mechanic_raw": "复合动作",
1310 |             "mechanic_source": "from_dt:机制",
1311 |             "difficulty": "高级",
1312 |             "notes": "fallback",
1313 |             "equipment_type": "barbell",
1314 |             "equipment_type_zh": "杠铃",
1315 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-supinated-row-front.mp4",
1316 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-supinated-row-side.mp4"
1317 |         },
1318 |         {
1319 |             "original_url": "https://musclewiki.com/exercise/barbell-seated-calf-raise",
1320 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-seated-calf-raise",
1321 |             "exercise_name_zh": "杠铃坐姿提踵",
1322 |             "muscle_module_zh": "小腿",
1323 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-seated-calf-raise-front.jpg",
1324 |             "muscle_module_en": "Barbell Seated Calf Raise",
1325 |             "muscle_ids": [
1326 |                 "calves"
1327 |             ],
1328 |             "muscle_ids_zh": [
1329 |                 "小腿三头肌"
1330 |             ],
1331 |             "mechanic": "孤立动作",
1332 |             "mechanic_raw": "孤立动作",
1333 |             "mechanic_source": "from_dt:机制",
1334 |             "difficulty": "初学者",
1335 |             "notes": "fallback",
1336 |             "equipment_type": "barbell",
1337 |             "equipment_type_zh": "杠铃",
1338 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-seated-calf-raise-front.mp4",
1339 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-seated-calf-raise-side.mp4"
1340 |         },
1341 |         {
1342 |             "original_url": "https://musclewiki.com/exercise/barbell-suitcase-carry",
1343 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-suitcase-carry",
1344 |             "exercise_name_zh": "杠铃单侧行李箱式行走",
1345 |             "muscle_module_zh": "臀部",
1346 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-suitcase-carry-side.jpg",
1347 |             "muscle_module_en": "Barbell Suitcase Carry",
1348 |             "muscle_ids": [
1349 |                 "obliques",
1350 |                 "forearms",
1351 |                 "hamstrings",
1352 |                 "glutes"
1353 |             ],
1354 |             "muscle_ids_zh": [
1355 |                 "腹外斜肌",
1356 |                 "前臂肌群",
1357 |                 "腘绳肌",
1358 |                 "臀大肌"
1359 |             ],
1360 |             "mechanic": "复合动作",
1361 |             "mechanic_raw": "复合动作",
1362 |             "mechanic_source": "from_dt:机制",
1363 |             "difficulty": "高级",
1364 |             "notes": "fallback",
1365 |             "equipment_type": "barbell",
1366 |             "equipment_type_zh": "杠铃",
1367 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-suitcase-carry-front.mp4",
1368 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-suitcase-carry-side.mp4"
1369 |         },
1370 |         {
1371 |             "original_url": "https://musclewiki.com/exercise/barbell-banded-romanian-deadlift",
1372 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-banded-romanian-deadlift",
1373 |             "exercise_name_zh": "Barbell Banded Romanian Deadlift",
1374 |             "muscle_module_zh": "臀部",
1375 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-banded-romanian-deadlift-front.jpg",
1376 |             "muscle_module_en": "Barbell Banded Romanian Deadlift",
1377 |             "muscle_ids": [
1378 |                 "hamstrings",
1379 |                 "glutes"
1380 |             ],
1381 |             "muscle_ids_zh": [
1382 |                 "腘绳肌",
1383 |                 "臀大肌"
1384 |             ],
1385 |             "mechanic": "复合动作",
1386 |             "mechanic_raw": "复合动作",
1387 |             "mechanic_source": "from_dt:机制",
1388 |             "difficulty": "中级",
1389 |             "notes": "fallback",
1390 |             "equipment_type": "barbell",
1391 |             "equipment_type_zh": "杠铃",
1392 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-banded-romanian-deadlift-front.mp4",
1393 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-banded-romanian-deadlift-side.mp4"
1394 |         },
1395 |         {
1396 |             "original_url": "https://musclewiki.com/exercise/barbell-conventional-pause-deadlift",
1397 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-conventional-pause-deadlift",
1398 |             "exercise_name_zh": "杠铃常规停顿硬拉",
1399 |             "muscle_module_zh": "下背部",
1400 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-conventional-pause-deadlift-side.jpg",
1401 |             "muscle_module_en": "Barbell Conventional Pause Deadlift",
1402 |             "muscle_ids": [
1403 |                 "glutes"
1404 |             ],
1405 |             "muscle_ids_zh": [
1406 |                 "臀大肌"
1407 |             ],
1408 |             "mechanic": "复合动作",
1409 |             "mechanic_raw": "复合动作",
1410 |             "mechanic_source": "from_dt:机制",
1411 |             "difficulty": "中级",
1412 |             "notes": "fallback",
1413 |             "equipment_type": "barbell",
1414 |             "equipment_type_zh": "杠铃",
1415 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-conventional-pause-deadlift-front.mp4",
1416 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-conventional-pause-deadlift-side.mp4"
1417 |         },
1418 |         {
1419 |             "original_url": "https://musclewiki.com/exercise/barbell-larsen-bench-press",
1420 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-larsen-bench-press",
1421 |             "exercise_name_zh": "杠铃拉森卧推",
1422 |             "muscle_module_zh": "胸部",
1423 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-larsen-bench-press-front.jpg",
1424 |             "muscle_module_en": "Barbell Larsen Bench Press",
1425 |             "muscle_ids": [
1426 |                 "abdominals",
1427 |                 "chest",
1428 |                 "triceps"
1429 |             ],
1430 |             "muscle_ids_zh": [
1431 |                 "腹直肌",
1432 |                 "胸大肌",
1433 |                 "肱三头肌"
1434 |             ],
1435 |             "mechanic": "复合动作",
1436 |             "mechanic_raw": "复合动作",
1437 |             "mechanic_source": "from_dt:机制",
1438 |             "difficulty": "高级",
1439 |             "notes": "fallback",
1440 |             "equipment_type": "barbell",
1441 |             "equipment_type_zh": "杠铃",
1442 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-larsen-bench-press-front.mp4",
1443 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-larsen-bench-press-side.mp4"
1444 |         },
1445 |         {
1446 |             "original_url": "https://musclewiki.com/exercise/barbell-staggered-deadlift",
1447 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-staggered-deadlift",
1448 |             "exercise_name_zh": "Barbell Staggered Deadlift",
1449 |             "muscle_module_zh": "臀部",
1450 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-staggered-deadlift-side.jpg",
1451 |             "muscle_module_en": "Barbell Staggered Deadlift",
1452 |             "muscle_ids": [
1453 |                 "hamstrings",
1454 |                 "glutes"
1455 |             ],
1456 |             "muscle_ids_zh": [
1457 |                 "腘绳肌",
1458 |                 "臀大肌"
1459 |             ],
1460 |             "mechanic": "复合动作",
1461 |             "mechanic_raw": "复合动作",
1462 |             "mechanic_source": "from_dt:机制",
1463 |             "difficulty": "高级",
1464 |             "notes": "fallback",
1465 |             "equipment_type": "barbell",
1466 |             "equipment_type_zh": "杠铃",
1467 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-staggered-deadlift-front.mp4",
1468 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-staggered-deadlift-side.mp4"
1469 |         },
1470 |         {
1471 |             "original_url": "https://musclewiki.com/exercise/landmine-bicep-curl",
1472 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-bicep-curl",
1473 |             "exercise_name_zh": "Landmine 二头肌弯举",
1474 |             "muscle_module_zh": "二头肌",
1475 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-bicep-curl-front.jpg",
1476 |             "muscle_module_en": "Landmine",
1477 |             "muscle_ids": [
1478 |                 "biceps"
1479 |             ],
1480 |             "muscle_ids_zh": [
1481 |                 "肱二头肌"
1482 |             ],
1483 |             "mechanic": "孤立动作",
1484 |             "mechanic_raw": "孤立动作",
1485 |             "mechanic_source": "from_dt:机制",
1486 |             "difficulty": "中级",
1487 |             "notes": "fallback",
1488 |             "equipment_type": "barbell",
1489 |             "equipment_type_zh": "杠铃",
1490 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-bicep-curl-front.mp4",
1491 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-bicep-curl-side.mp4"
1492 |         },
1493 |         {
1494 |             "original_url": "https://musclewiki.com/exercise/barbell-high-pull",
1495 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-high-pull",
1496 |             "exercise_name_zh": "杠铃高拉",
1497 |             "muscle_module_zh": "斜方肌（中背）",
1498 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-high-pull-front.jpg",
1499 |             "muscle_module_en": "Barbell High Pull",
1500 |             "muscle_ids": [
1501 |                 "lats",
1502 |                 "biceps"
1503 |             ],
1504 |             "muscle_ids_zh": [],
1505 |             "mechanic": "复合动作",
1506 |             "mechanic_raw": "复合动作",
1507 |             "mechanic_source": "from_dt:机制",
1508 |             "difficulty": "中级",
1509 |             "notes": "fallback",
1510 |             "equipment_type": "barbell",
1511 |             "equipment_type_zh": "杠铃",
1512 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-high-pull-front.mp4",
1513 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-high-pull-side.mp4"
1514 |         },
1515 |         {
1516 |             "original_url": "https://musclewiki.com/exercise/landmine-goblet-curtsy-lunge",
1517 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-goblet-curtsy-lunge",
1518 |             "exercise_name_zh": "Landmine 高脚杯式交叉后弓步",
1519 |             "muscle_module_zh": "臀部",
1520 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-goblet-curtsy-lunge-side.jpg",
1521 |             "muscle_module_en": "Landmine",
1522 |             "muscle_ids": [
1523 |                 "quads",
1524 |                 "glutes"
1525 |             ],
1526 |             "muscle_ids_zh": [
1527 |                 "股四头肌",
1528 |                 "臀大肌"
1529 |             ],
1530 |             "mechanic": "复合动作",
1531 |             "mechanic_raw": "复合动作",
1532 |             "mechanic_source": "from_dt:机制",
1533 |             "difficulty": "高级",
1534 |             "notes": "fallback",
1535 |             "equipment_type": "barbell",
1536 |             "equipment_type_zh": "杠铃",
1537 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-goblet-curtsy-lunge-front.mp4",
1538 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-goblet-curtsy-lunge-side.mp4"
1539 |         },
1540 |         {
1541 |             "original_url": "https://musclewiki.com/exercise/barbell-thruster",
1542 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-thruster",
1543 |             "exercise_name_zh": "Barbell Thruster",
1544 |             "muscle_module_zh": "臀部",
1545 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-thruster-front.jpg",
1546 |             "muscle_module_en": "Barbell Thruster",
1547 |             "muscle_ids": [
1548 |                 "quads",
1549 |                 "front-shoulders",
1550 |                 "glutes",
1551 |                 "rear-shoulders"
1552 |             ],
1553 |             "muscle_ids_zh": [
1554 |                 "股四头肌",
1555 |                 "三角肌前束",
1556 |                 "臀大肌",
1557 |                 "三角肌后束"
1558 |             ],
1559 |             "mechanic": "复合动作",
1560 |             "mechanic_raw": "复合动作",
1561 |             "mechanic_source": "from_dt:机制",
1562 |             "difficulty": "中级",
1563 |             "notes": "fallback",
1564 |             "equipment_type": "barbell",
1565 |             "equipment_type_zh": "杠铃",
1566 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-thruster-front.mp4",
1567 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-thruster-side.mp4"
1568 |         },
1569 |         {
1570 |             "original_url": "https://musclewiki.com/exercise/barbell-landmine-sissy-squat",
1571 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-landmine-sissy-squat",
1572 |             "exercise_name_zh": "杠铃地雷Sissy深蹲",
1573 |             "muscle_module_zh": "股四头肌",
1574 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-sissy-squat-side.jpg",
1575 |             "muscle_module_en": "Sissy",
1576 |             "muscle_ids": [
1577 |                 "quads"
1578 |             ],
1579 |             "muscle_ids_zh": [
1580 |                 "股四头肌"
1581 |             ],
1582 |             "mechanic": "孤立动作",
1583 |             "mechanic_raw": "孤立动作",
1584 |             "mechanic_source": "from_dt:机制",
1585 |             "difficulty": "高级",
1586 |             "notes": "fallback",
1587 |             "equipment_type": "barbell",
1588 |             "equipment_type_zh": "杠铃",
1589 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-sissy-squat-front.mp4",
1590 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-sissy-squat-side.mp4"
1591 |         },
1592 |         {
1593 |             "original_url": "https://musclewiki.com/exercise/barbell-heels-elevated-hip-thrust",
1594 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-heels-elevated-hip-thrust",
1595 |             "exercise_name_zh": "杠铃臀桥（脚跟抬高）",
1596 |             "muscle_module_zh": "臀部",
1597 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-heels-elevated-hip-thrust-front.jpg",
1598 |             "muscle_module_en": "Barbell Heels Elevated Hip Thrust",
1599 |             "muscle_ids": [
1600 |                 "glutes"
1601 |             ],
1602 |             "muscle_ids_zh": [
1603 |                 "臀大肌"
1604 |             ],
1605 |             "mechanic": "复合动作",
1606 |             "mechanic_raw": "复合动作",
1607 |             "mechanic_source": "from_dt:机制",
1608 |             "difficulty": "初学者",
1609 |             "notes": "fallback",
1610 |             "equipment_type": "barbell",
1611 |             "equipment_type_zh": "杠铃",
1612 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-heels-elevated-hip-thrust-front.mp4",
1613 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-heels-elevated-hip-thrust-side.mp4"
1614 |         },
1615 |         {
1616 |             "original_url": "https://musclewiki.com/exercise/barbell-guillotine-incline-bench-press",
1617 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-guillotine-incline-bench-press",
1618 |             "exercise_name_zh": "Barbell Guillotine Incline Bench Press",
1619 |             "muscle_module_zh": "胸部",
1620 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-guillotine-incline-bench-press-front.jpg",
1621 |             "muscle_module_en": "Barbell Guillotine Incline Bench Press",
1622 |             "muscle_ids": [
1623 |                 "chest",
1624 |                 "triceps"
1625 |             ],
1626 |             "muscle_ids_zh": [
1627 |                 "胸大肌",
1628 |                 "肱三头肌"
1629 |             ],
1630 |             "mechanic": "复合动作",
1631 |             "mechanic_raw": "复合动作",
1632 |             "mechanic_source": "from_dt:机制",
1633 |             "difficulty": "高级",
1634 |             "notes": "fallback",
1635 |             "equipment_type": "barbell",
1636 |             "equipment_type_zh": "杠铃",
1637 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-guillotine-incline-bench-press-front.mp4",
1638 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-guillotine-incline-bench-press-side.mp4"
1639 |         },
1640 |         {
1641 |             "original_url": "https://musclewiki.com/exercise/landmine-squat",
1642 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-squat",
1643 |             "exercise_name_zh": "地雷深蹲",
1644 |             "muscle_module_zh": "臀部",
1645 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-squat-side.jpg",
1646 |             "muscle_module_en": "Landmine Squat",
1647 |             "muscle_ids": [
1648 |                 "quads",
1649 |                 "glutes"
1650 |             ],
1651 |             "muscle_ids_zh": [
1652 |                 "股四头肌",
1653 |                 "臀大肌"
1654 |             ],
1655 |             "mechanic": "复合动作",
1656 |             "mechanic_raw": "复合动作",
1657 |             "mechanic_source": "from_dt:机制",
1658 |             "difficulty": "初学者",
1659 |             "notes": "fallback",
1660 |             "equipment_type": "barbell",
1661 |             "equipment_type_zh": "杠铃",
1662 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-squat-front.mp4",
1663 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-squat-side.mp4"
1664 |         },
1665 |         {
1666 |             "original_url": "https://musclewiki.com/exercise/barbell-figure-four-hip-thrust",
1667 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-figure-four-hip-thrust",
1668 |             "exercise_name_zh": "杠铃四字臀推",
1669 |             "muscle_module_zh": "臀部",
1670 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-figure-four-hip-thrust-front.jpg",
1671 |             "muscle_module_en": "Barbell Figure Four Hip Thrust",
1672 |             "muscle_ids": [
1673 |                 "glutes"
1674 |             ],
1675 |             "muscle_ids_zh": [
1676 |                 "臀大肌"
1677 |             ],
1678 |             "mechanic": "复合动作",
1679 |             "mechanic_raw": "复合动作",
1680 |             "mechanic_source": "from_dt:机制",
1681 |             "difficulty": "中级",
1682 |             "notes": "fallback",
1683 |             "equipment_type": "barbell",
1684 |             "equipment_type_zh": "杠铃",
1685 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-figure-four-hip-thrust-front.mp4",
1686 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-figure-four-hip-thrust-side.mp4"
1687 |         },
1688 |         {
1689 |             "original_url": "https://musclewiki.com/exercise/barbell-pullover",
1690 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-pullover",
1691 |             "exercise_name_zh": "Barbell Pullover",
1692 |             "muscle_module_zh": "背阔肌",
1693 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-pullover-front.jpg",
1694 |             "muscle_module_en": "Barbell Pullover",
1695 |             "muscle_ids": [
1696 |                 "lats"
1697 |             ],
1698 |             "muscle_ids_zh": [
1699 |                 "背阔肌"
1700 |             ],
1701 |             "mechanic": "孤立动作",
1702 |             "mechanic_raw": "孤立动作",
1703 |             "mechanic_source": "from_dt:机制",
1704 |             "difficulty": "中级",
1705 |             "notes": "fallback",
1706 |             "equipment_type": "barbell",
1707 |             "equipment_type_zh": "杠铃",
1708 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-pullover-front.mp4",
1709 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-pullover-side.mp4"
1710 |         },
1711 |         {
1712 |             "original_url": "https://musclewiki.com/exercise/landmine-alternating-lunge-and-twist",
1713 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-alternating-lunge-and-twist",
1714 |             "exercise_name_zh": "Landmine 交替弓步扭转",
1715 |             "muscle_module_zh": "腹斜肌",
1716 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-alternating-lunge-and-twist-side.jpg",
1717 |             "muscle_module_en": "Landmine",
1718 |             "muscle_ids": [
1719 |                 "quads",
1720 |                 "obliques",
1721 |                 "glutes"
1722 |             ],
1723 |             "muscle_ids_zh": [
1724 |                 "股四头肌",
1725 |                 "腹外斜肌",
1726 |                 "臀大肌"
1727 |             ],
1728 |             "mechanic": "复合动作",
1729 |             "mechanic_raw": "复合动作",
1730 |             "mechanic_source": "from_dt:机制",
1731 |             "difficulty": "高级",
1732 |             "notes": "fallback",
1733 |             "equipment_type": "barbell",
1734 |             "equipment_type_zh": "杠铃",
1735 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-alternating-lunge-and-twist-front.mp4",
1736 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-alternating-lunge-and-twist-side.mp4"
1737 |         },
1738 |         {
1739 |             "original_url": "https://musclewiki.com/exercise/barbell-feet-elevated-figure-four-glute-bridge",
1740 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-feet-elevated-figure-four-glute-bridge",
1741 |             "exercise_name_zh": "杠铃脚部抬高四字臀桥",
1742 |             "muscle_module_zh": "臀部",
1743 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-feet-elevated-figure-four-glute-bridge-front.jpg",
1744 |             "muscle_module_en": "Barbell Feet Elevated Figure Four Glute Bridge",
1745 |             "muscle_ids": [
1746 |                 "glutes"
1747 |             ],
1748 |             "muscle_ids_zh": [
1749 |                 "臀大肌"
1750 |             ],
1751 |             "mechanic": "复合动作",
1752 |             "mechanic_raw": "复合动作",
1753 |             "mechanic_source": "from_dt:机制",
1754 |             "difficulty": "中级",
1755 |             "notes": "fallback",
1756 |             "equipment_type": "barbell",
1757 |             "equipment_type_zh": "杠铃",
1758 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-feet-elevated-figure-four-glute-bridge-front.mp4",
1759 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-feet-elevated-figure-four-glute-bridge-side.mp4"
1760 |         },
1761 |         {
1762 |             "original_url": "https://musclewiki.com/exercise/barbell-behind-the-neck-seated-overhead-press",
1763 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-behind-the-neck-seated-overhead-press",
1764 |             "exercise_name_zh": "坐姿颈后杠铃推举",
1765 |             "muscle_module_zh": "肩部",
1766 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-behind-the-neck-seated-overhead-press-front.jpg",
1767 |             "muscle_module_en": "Barbell Behind The Neck Seated Overhead Press",
1768 |             "muscle_ids": [
1769 |                 "front-shoulders",
1770 |                 "triceps",
1771 |                 "rear-shoulders"
1772 |             ],
1773 |             "muscle_ids_zh": [
1774 |                 "三角肌前束",
1775 |                 "肱三头肌",
1776 |                 "三角肌后束"
1777 |             ],
1778 |             "mechanic": "复合动作",
1779 |             "mechanic_raw": "复合动作",
1780 |             "mechanic_source": "from_dt:机制",
1781 |             "difficulty": "高级",
1782 |             "notes": "fallback",
1783 |             "equipment_type": "barbell",
1784 |             "equipment_type_zh": "杠铃",
1785 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-behind-the-neck-seated-overhead-press-front.mp4",
1786 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-behind-the-neck-seated-overhead-press-side.mp4"
1787 |         },
1788 |         {
1789 |             "original_url": "https://musclewiki.com/exercise/landmine-lunge",
1790 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-lunge",
1791 |             "exercise_name_zh": "地雷弓步",
1792 |             "muscle_module_zh": "臀部",
1793 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-lunge-side.jpg",
1794 |             "muscle_module_en": "Landmine Lunge",
1795 |             "muscle_ids": [
1796 |                 "quads",
1797 |                 "glutes"
1798 |             ],
1799 |             "muscle_ids_zh": [
1800 |                 "股四头肌",
1801 |                 "臀大肌"
1802 |             ],
1803 |             "mechanic": "复合动作",
1804 |             "mechanic_raw": "复合动作",
1805 |             "mechanic_source": "from_dt:机制",
1806 |             "difficulty": "中级",
1807 |             "notes": "fallback",
1808 |             "equipment_type": "barbell",
1809 |             "equipment_type_zh": "杠铃",
1810 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-lunge-front.mp4",
1811 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-lunge-side.mp4"
1812 |         },
1813 |         {
1814 |             "original_url": "https://musclewiki.com/exercise/barbell-banded-front-squat",
1815 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-banded-front-squat",
1816 |             "exercise_name_zh": "Barbell Banded Front Squat",
1817 |             "muscle_module_zh": "臀部",
1818 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-banded-front-squat-front.jpg",
1819 |             "muscle_module_en": "Barbell Banded Front Squat",
1820 |             "muscle_ids": [
1821 |                 "quads",
1822 |                 "abdominals",
1823 |                 "glutes"
1824 |             ],
1825 |             "muscle_ids_zh": [
1826 |                 "股四头肌",
1827 |                 "腹直肌",
1828 |                 "臀大肌"
1829 |             ],
1830 |             "mechanic": "复合动作",
1831 |             "mechanic_raw": "复合动作",
1832 |             "mechanic_source": "from_dt:机制",
1833 |             "difficulty": "高级",
1834 |             "notes": "fallback",
1835 |             "equipment_type": "barbell",
1836 |             "equipment_type_zh": "杠铃",
1837 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-banded-front-squat-front.mp4",
1838 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-banded-front-squat-side.mp4"
1839 |         },
1840 |         {
1841 |             "original_url": "https://musclewiki.com/exercise/barbell-glute-bridge",
1842 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-glute-bridge",
1843 |             "exercise_name_zh": "杠铃臀桥",
1844 |             "muscle_module_zh": "臀部",
1845 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-glute-bridge-front.jpg",
1846 |             "muscle_module_en": "Barbell Glute Bridge",
1847 |             "muscle_ids": [
1848 |                 "glutes"
1849 |             ],
1850 |             "muscle_ids_zh": [
1851 |                 "臀大肌"
1852 |             ],
1853 |             "mechanic": "复合动作",
1854 |             "mechanic_raw": "复合动作",
1855 |             "mechanic_source": "from_dt:机制",
1856 |             "difficulty": "初学者",
1857 |             "notes": "fallback",
1858 |             "equipment_type": "barbell",
1859 |             "equipment_type_zh": "杠铃",
1860 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-glute-bridge-front.mp4",
1861 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-glute-bridge-side.mp4"
1862 |         },
1863 |         {
1864 |             "original_url": "https://musclewiki.com/exercise/barbell-banded-split-squat",
1865 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-banded-split-squat",
1866 |             "exercise_name_zh": "Barbell Banded Split Squat",
1867 |             "muscle_module_zh": "臀部",
1868 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-banded-split-squat-front.jpg",
1869 |             "muscle_module_en": "Barbell Banded Split Squat",
1870 |             "muscle_ids": [
1871 |                 "quads",
1872 |                 "glutes"
1873 |             ],
1874 |             "muscle_ids_zh": [
1875 |                 "股四头肌",
1876 |                 "臀大肌"
1877 |             ],
1878 |             "mechanic": "复合动作",
1879 |             "mechanic_raw": "复合动作",
1880 |             "mechanic_source": "from_dt:机制",
1881 |             "difficulty": "中级",
1882 |             "notes": "fallback",
1883 |             "equipment_type": "barbell",
1884 |             "equipment_type_zh": "杠铃",
1885 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-banded-split-squat-front.mp4",
1886 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-banded-split-squat-side.mp4"
1887 |         },
1888 |         {
1889 |             "original_url": "https://musclewiki.com/exercise/landmine-stationary-twist",
1890 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-stationary-twist",
1891 |             "exercise_name_zh": "Landmine 站姿扭转",
1892 |             "muscle_module_zh": "腹斜肌",
1893 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-stationary-twist-side.jpg",
1894 |             "muscle_module_en": "Landmine",
1895 |             "muscle_ids": [
1896 |                 "obliques"
1897 |             ],
1898 |             "muscle_ids_zh": [
1899 |                 "腹外斜肌"
1900 |             ],
1901 |             "mechanic": "孤立动作",
1902 |             "mechanic_raw": "孤立动作",
1903 |             "mechanic_source": "from_dt:机制",
1904 |             "difficulty": "中级",
1905 |             "notes": "fallback",
1906 |             "equipment_type": "barbell",
1907 |             "equipment_type_zh": "杠铃",
1908 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-stationary-twist-front.mp4",
1909 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-stationary-twist-side.mp4"
1910 |         },
1911 |         {
1912 |             "original_url": "https://musclewiki.com/exercise/barbell-z-press",
1913 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-z-press",
1914 |             "exercise_name_zh": "杠铃Z推",
1915 |             "muscle_module_zh": "肩部",
1916 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-z-press-front.jpg",
1917 |             "muscle_module_en": "Barbell Z Press",
1918 |             "muscle_ids": [
1919 |                 "front-shoulders",
1920 |                 "traps",
1921 |                 "triceps",
1922 |                 "traps-middle",
1923 |                 "rear-shoulders"
1924 |             ],
1925 |             "muscle_ids_zh": [
1926 |                 "三角肌前束",
1927 |                 "斜方肌上束",
1928 |                 "肱三头肌",
1929 |                 "斜方肌中束",
1930 |                 "三角肌后束"
1931 |             ],
1932 |             "mechanic": "复合动作",
1933 |             "mechanic_raw": "复合动作",
1934 |             "mechanic_source": "from_dt:机制",
1935 |             "difficulty": "高级",
1936 |             "notes": "fallback",
1937 |             "equipment_type": "barbell",
1938 |             "equipment_type_zh": "杠铃",
1939 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-z-press-front.mp4",
1940 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-z-press-side.mp4"
1941 |         },
1942 |         {
1943 |             "original_url": "https://musclewiki.com/exercise/landmine-kneeling-overhead-press",
1944 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-kneeling-overhead-press",
1945 |             "exercise_name_zh": "跪姿地雷过顶推举",
1946 |             "muscle_module_zh": "肩部",
1947 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-kneeling-overhead-press-side.jpg",
1948 |             "muscle_module_en": "Landmine Kneeling Overhead Press",
1949 |             "muscle_ids": [
1950 |                 "front-shoulders",
1951 |                 "triceps",
1952 |                 "rear-shoulders"
1953 |             ],
1954 |             "muscle_ids_zh": [
1955 |                 "三角肌前束",
1956 |                 "肱三头肌",
1957 |                 "三角肌后束"
1958 |             ],
1959 |             "mechanic": "复合动作",
1960 |             "mechanic_raw": "复合动作",
1961 |             "mechanic_source": "from_dt:机制",
1962 |             "difficulty": "中级",
1963 |             "notes": "fallback",
1964 |             "equipment_type": "barbell",
1965 |             "equipment_type_zh": "杠铃",
1966 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-kneeling-overhead-press-front.mp4",
1967 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-kneeling-overhead-press-side.mp4"
1968 |         },
1969 |         {
1970 |             "original_url": "https://musclewiki.com/exercise/landmine-single-arm-chest-press",
1971 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-single-arm-chest-press",
1972 |             "exercise_name_zh": "Landmine 单臂卧推",
1973 |             "muscle_module_zh": "胸部",
1974 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-single-arm-chest-press-front.jpg",
1975 |             "muscle_module_en": "Landmine",
1976 |             "muscle_ids": [
1977 |                 "chest",
1978 |                 "triceps"
1979 |             ],
1980 |             "muscle_ids_zh": [
1981 |                 "胸大肌",
1982 |                 "肱三头肌"
1983 |             ],
1984 |             "mechanic": "复合动作",
1985 |             "mechanic_raw": "复合动作",
1986 |             "mechanic_source": "from_dt:机制",
1987 |             "difficulty": "中级",
1988 |             "notes": "fallback",
1989 |             "equipment_type": "barbell",
1990 |             "equipment_type_zh": "杠铃",
1991 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-single-arm-chest-press-front.mp4",
1992 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-single-arm-chest-press-side.mp4"
1993 |         },
1994 |         {
1995 |             "original_url": "https://musclewiki.com/exercise/barbell-feet-elevated-glute-bridge",
1996 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-feet-elevated-glute-bridge",
1997 |             "exercise_name_zh": "杠铃双脚抬高臀桥",
1998 |             "muscle_module_zh": "臀部",
1999 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-feet-elevated-glute-bridge-front.jpg",
2000 |             "muscle_module_en": "Barbell Feet Elevated Glute Bridge",
2001 |             "muscle_ids": [
2002 |                 "glutes"
2003 |             ],
2004 |             "muscle_ids_zh": [
2005 |                 "臀大肌"
2006 |             ],
2007 |             "mechanic": "复合动作",
2008 |             "mechanic_raw": "复合动作",
2009 |             "mechanic_source": "from_dt:机制",
2010 |             "difficulty": "中级",
2011 |             "notes": "fallback",
2012 |             "equipment_type": "barbell",
2013 |             "equipment_type_zh": "杠铃",
2014 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-feet-elevated-glute-bridge-front.mp4",
2015 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-feet-elevated-glute-bridge-side.mp4"
2016 |         },
2017 |         {
2018 |             "original_url": "https://musclewiki.com/exercise/barbell-shrug",
2019 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-shrug",
2020 |             "exercise_name_zh": "杠铃耸肩",
2021 |             "muscle_module_zh": "斜方肌",
2022 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-shrug-front.jpg",
2023 |             "muscle_module_en": "Barbell Shrug",
2024 |             "muscle_ids": [
2025 |                 "traps",
2026 |                 "traps-middle"
2027 |             ],
2028 |             "muscle_ids_zh": [
2029 |                 "斜方肌上束",
2030 |                 "斜方肌中束"
2031 |             ],
2032 |             "mechanic": "孤立动作",
2033 |             "mechanic_raw": "孤立动作",
2034 |             "mechanic_source": "from_dt:机制",
2035 |             "difficulty": "初学者",
2036 |             "notes": "fallback",
2037 |             "equipment_type": "barbell",
2038 |             "equipment_type_zh": "杠铃",
2039 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-shrug-front.mp4",
2040 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-shrug-side.mp4"
2041 |         },
2042 |         {
2043 |             "original_url": "https://musclewiki.com/exercise/landmine-goblet-lateral-lunge",
2044 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-goblet-lateral-lunge",
2045 |             "exercise_name_zh": "地雷式高脚杯侧弓步",
2046 |             "muscle_module_zh": "臀部",
2047 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-goblet-lateral-lunge-side.jpg",
2048 |             "muscle_module_en": "Landmine Goblet Lateral Lunge",
2049 |             "muscle_ids": [
2050 |                 "quads",
2051 |                 "glutes"
2052 |             ],
2053 |             "muscle_ids_zh": [
2054 |                 "股四头肌",
2055 |                 "臀大肌"
2056 |             ],
2057 |             "mechanic": "复合动作",
2058 |             "mechanic_raw": "复合动作",
2059 |             "mechanic_source": "from_dt:机制",
2060 |             "difficulty": "高级",
2061 |             "notes": "fallback",
2062 |             "equipment_type": "barbell",
2063 |             "equipment_type_zh": "杠铃",
2064 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-goblet-lateral-lunge-front.mp4",
2065 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-goblet-lateral-lunge-side.mp4"
2066 |         },
2067 |         {
2068 |             "original_url": "https://musclewiki.com/exercise/landmine-lying-tricep-extension",
2069 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-lying-tricep-extension",
2070 |             "exercise_name_zh": "地雷仰卧三头肌伸展",
2071 |             "muscle_module_zh": "三头肌",
2072 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-lying-tricep-extension-front.jpg",
2073 |             "muscle_module_en": "Landmine Lying Tricep Extension",
2074 |             "muscle_ids": [
2075 |                 "triceps"
2076 |             ],
2077 |             "muscle_ids_zh": [
2078 |                 "肱三头肌"
2079 |             ],
2080 |             "mechanic": "孤立动作",
2081 |             "mechanic_raw": "孤立动作",
2082 |             "mechanic_source": "from_dt:机制",
2083 |             "difficulty": "中级",
2084 |             "notes": "fallback",
2085 |             "equipment_type": "barbell",
2086 |             "equipment_type_zh": "杠铃",
2087 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-lying-tricep-extension-front.mp4",
2088 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-lying-tricep-extension-side.mp4"
2089 |         },
2090 |         {
2091 |             "original_url": "https://musclewiki.com/exercise/barbell-tricep-guillotine-press",
2092 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-tricep-guillotine-press",
2093 |             "exercise_name_zh": "杠铃三头肌断头台卧推",
2094 |             "muscle_module_zh": "三头肌",
2095 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-tricep-guillotine-press-side.jpg",
2096 |             "muscle_module_en": "Barbell Tricep Guillotine Press",
2097 |             "muscle_ids": [
2098 |                 "triceps"
2099 |             ],
2100 |             "muscle_ids_zh": [
2101 |                 "肱三头肌"
2102 |             ],
2103 |             "mechanic": "孤立动作",
2104 |             "mechanic_raw": "孤立动作",
2105 |             "mechanic_source": "from_dt:机制",
2106 |             "difficulty": "中级",
2107 |             "notes": "fallback",
2108 |             "equipment_type": "barbell",
2109 |             "equipment_type_zh": "杠铃",
2110 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-tricep-guillotine-press-front.mp4",
2111 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-tricep-guillotine-press-side.mp4"
2112 |         },
2113 |         {
2114 |             "original_url": "https://musclewiki.com/exercise/landmine-seated-overhead-press",
2115 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-seated-overhead-press",
2116 |             "exercise_name_zh": "坐姿单端杠铃过顶推举",
2117 |             "muscle_module_zh": "肩部",
2118 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-seated-overhead-press-side.jpg",
2119 |             "muscle_module_en": "Landmine Seated Overhead Press",
2120 |             "muscle_ids": [
2121 |                 "front-shoulders",
2122 |                 "triceps",
2123 |                 "rear-shoulders"
2124 |             ],
2125 |             "muscle_ids_zh": [
2126 |                 "三角肌前束",
2127 |                 "肱三头肌",
2128 |                 "三角肌后束"
2129 |             ],
2130 |             "mechanic": "复合动作",
2131 |             "mechanic_raw": "复合动作",
2132 |             "mechanic_source": "from_dt:机制",
2133 |             "difficulty": "中级",
2134 |             "notes": "fallback",
2135 |             "equipment_type": "barbell",
2136 |             "equipment_type_zh": "杠铃",
2137 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-seated-overhead-press-front.mp4",
2138 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-seated-overhead-press-side.mp4"
2139 |         },
2140 |         {
2141 |             "original_url": "https://musclewiki.com/exercise/barbell-split-jerk",
2142 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-split-jerk",
2143 |             "exercise_name_zh": "杠铃分腿挺举",
2144 |             "muscle_module_zh": "前肩",
2145 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-split-jerk-front.jpg",
2146 |             "muscle_module_en": "Barbell Split Jerk",
2147 |             "muscle_ids": [],
2148 |             "muscle_ids_zh": [],
2149 |             "mechanic": "复合动作",
2150 |             "mechanic_raw": "复合动作",
2151 |             "mechanic_source": "from_dt:机制",
2152 |             "difficulty": "中级",
2153 |             "notes": "fallback",
2154 |             "equipment_type": "barbell",
2155 |             "equipment_type_zh": "杠铃",
2156 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-split-jerk-front.mp4",
2157 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-split-jerk-side.mp4"
2158 |         },
2159 |         {
2160 |             "original_url": "https://musclewiki.com/exercise/barbell-split-squat",
2161 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-split-squat",
2162 |             "exercise_name_zh": "杠铃分腿蹲",
2163 |             "muscle_module_zh": "臀部",
2164 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-split-squat-front.jpg",
2165 |             "muscle_module_en": "Barbell Split Squat",
2166 |             "muscle_ids": [
2167 |                 "quads",
2168 |                 "glutes"
2169 |             ],
2170 |             "muscle_ids_zh": [
2171 |                 "股四头肌",
2172 |                 "臀大肌"
2173 |             ],
2174 |             "mechanic": "复合动作",
2175 |             "mechanic_raw": "复合动作",
2176 |             "mechanic_source": "from_dt:机制",
2177 |             "difficulty": "中级",
2178 |             "notes": "fallback",
2179 |             "equipment_type": "barbell",
2180 |             "equipment_type_zh": "杠铃",
2181 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-split-squat-front.mp4",
2182 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-split-squat-side.mp4"
2183 |         },
2184 |         {
2185 |             "original_url": "https://musclewiki.com/exercise/landmine-lunge-to-overhead-press",
2186 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-lunge-to-overhead-press",
2187 |             "exercise_name_zh": "单端杠箭步至头顶推举",
2188 |             "muscle_module_zh": "肩部",
2189 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-lunge-to-overhead-press-side.jpg",
2190 |             "muscle_module_en": "Landmine Lunge To Overhead Press",
2191 |             "muscle_ids": [
2192 |                 "quads",
2193 |                 "front-shoulders",
2194 |                 "glutes",
2195 |                 "rear-shoulders"
2196 |             ],
2197 |             "muscle_ids_zh": [
2198 |                 "股四头肌",
2199 |                 "三角肌前束",
2200 |                 "臀大肌",
2201 |                 "三角肌后束"
2202 |             ],
2203 |             "mechanic": "复合动作",
2204 |             "mechanic_raw": "复合动作",
2205 |             "mechanic_source": "from_dt:机制",
2206 |             "difficulty": "高级",
2207 |             "notes": "fallback",
2208 |             "equipment_type": "barbell",
2209 |             "equipment_type_zh": "杠铃",
2210 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-lunge-to-overhead-press-front.mp4",
2211 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-lunge-to-overhead-press-side.mp4"
2212 |         },
2213 |         {
2214 |             "original_url": "https://musclewiki.com/exercise/barbell-banded-back-squat",
2215 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-banded-back-squat",
2216 |             "exercise_name_zh": "Barbell Banded Back Squat",
2217 |             "muscle_module_zh": "股四头肌",
2218 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-banded-back-squat-front.jpg",
2219 |             "muscle_module_en": "Barbell Banded Back Squat",
2220 |             "muscle_ids": [
2221 |                 "quads",
2222 |                 "glutes"
2223 |             ],
2224 |             "muscle_ids_zh": [
2225 |                 "股四头肌",
2226 |                 "臀大肌"
2227 |             ],
2228 |             "mechanic": "复合动作",
2229 |             "mechanic_raw": "复合动作",
2230 |             "mechanic_source": "from_dt:机制",
2231 |             "difficulty": "中级",
2232 |             "notes": "fallback",
2233 |             "equipment_type": "barbell",
2234 |             "equipment_type_zh": "杠铃",
2235 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-banded-back-squat-front.mp4",
2236 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-banded-back-squat-side.mp4"
2237 |         },
2238 |         {
2239 |             "original_url": "https://musclewiki.com/exercise/landmine-hack-squat",
2240 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-hack-squat",
2241 |             "exercise_name_zh": "Landmine 哈克深蹲",
2242 |             "muscle_module_zh": "臀部",
2243 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-hack-squat-side.jpg",
2244 |             "muscle_module_en": "Landmine",
2245 |             "muscle_ids": [
2246 |                 "quads",
2247 |                 "glutes"
2248 |             ],
2249 |             "muscle_ids_zh": [
2250 |                 "股四头肌",
2251 |                 "臀大肌"
2252 |             ],
2253 |             "mechanic": "复合动作",
2254 |             "mechanic_raw": "复合动作",
2255 |             "mechanic_source": "from_dt:机制",
2256 |             "difficulty": "高级",
2257 |             "notes": "fallback",
2258 |             "equipment_type": "barbell",
2259 |             "equipment_type_zh": "杠铃",
2260 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-hack-squat-front.mp4",
2261 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-hack-squat-side.mp4"
2262 |         },
2263 |         {
2264 |             "original_url": "https://musclewiki.com/exercise/barbell-front-squat-with-straps",
2265 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-front-squat-with-straps",
2266 |             "exercise_name_zh": "杠铃前蹲（带绑带）",
2267 |             "muscle_module_zh": "臀部",
2268 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-front-squat-with-straps-side.jpg",
2269 |             "muscle_module_en": "Barbell Front Squat With Straps",
2270 |             "muscle_ids": [
2271 |                 "quads",
2272 |                 "abdominals",
2273 |                 "glutes"
2274 |             ],
2275 |             "muscle_ids_zh": [
2276 |                 "股四头肌",
2277 |                 "腹直肌",
2278 |                 "臀大肌"
2279 |             ],
2280 |             "mechanic": "复合动作",
2281 |             "mechanic_raw": "复合动作",
2282 |             "mechanic_source": "from_dt:机制",
2283 |             "difficulty": "中级",
2284 |             "notes": "fallback",
2285 |             "equipment_type": "barbell",
2286 |             "equipment_type_zh": "杠铃",
2287 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-front-squat-with-straps-front.mp4",
2288 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-front-squat-with-straps-side.mp4"
2289 |         },
2290 |         {
2291 |             "original_url": "https://musclewiki.com/exercise/landmine-single-arm-push-press",
2292 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-single-arm-push-press",
2293 |             "exercise_name_zh": "单臂地雷推举",
2294 |             "muscle_module_zh": "肩部",
2295 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-single-arm-push-press-side.jpg",
2296 |             "muscle_module_en": "Landmine Single Arm Push Press",
2297 |             "muscle_ids": [
2298 |                 "front-shoulders",
2299 |                 "triceps",
2300 |                 "rear-shoulders"
2301 |             ],
2302 |             "muscle_ids_zh": [
2303 |                 "三角肌前束",
2304 |                 "肱三头肌",
2305 |                 "三角肌后束"
2306 |             ],
2307 |             "mechanic": "复合动作",
2308 |             "mechanic_raw": "复合动作",
2309 |             "mechanic_source": "from_dt:机制",
2310 |             "difficulty": "中级",
2311 |             "notes": "fallback",
2312 |             "equipment_type": "barbell",
2313 |             "equipment_type_zh": "杠铃",
2314 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-single-arm-push-press-front.mp4",
2315 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-single-arm-push-press-side.mp4"
2316 |         },
2317 |         {
2318 |             "original_url": "https://musclewiki.com/exercise/barbell-reverse-lunge",
2319 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-reverse-lunge",
2320 |             "exercise_name_zh": "杠铃后撤弓步",
2321 |             "muscle_module_zh": "股四头肌",
2322 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-reverse-lunge-front.jpg",
2323 |             "muscle_module_en": "Barbell Reverse Lunge",
2324 |             "muscle_ids": [
2325 |                 "quads",
2326 |                 "glutes"
2327 |             ],
2328 |             "muscle_ids_zh": [
2329 |                 "股四头肌",
2330 |                 "臀大肌"
2331 |             ],
2332 |             "mechanic": "复合动作",
2333 |             "mechanic_raw": "复合动作",
2334 |             "mechanic_source": "from_dt:机制",
2335 |             "difficulty": "中级",
2336 |             "notes": "fallback",
2337 |             "equipment_type": "barbell",
2338 |             "equipment_type_zh": "杠铃",
2339 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-reverse-lunge-front.mp4",
2340 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-reverse-lunge-side.mp4"
2341 |         },
2342 |         {
2343 |             "original_url": "https://musclewiki.com/exercise/barbell-behind-the-back-shrug",
2344 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-behind-the-back-shrug",
2345 |             "exercise_name_zh": "Barbell Behind The Back Shrug",
2346 |             "muscle_module_zh": "斜方肌",
2347 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-behind-the-back-shrug-side.jpg",
2348 |             "muscle_module_en": "Barbell Behind The Back Shrug",
2349 |             "muscle_ids": [
2350 |                 "traps",
2351 |                 "traps-middle"
2352 |             ],
2353 |             "muscle_ids_zh": [
2354 |                 "斜方肌上束",
2355 |                 "斜方肌中束"
2356 |             ],
2357 |             "mechanic": "孤立动作",
2358 |             "mechanic_raw": "孤立动作",
2359 |             "mechanic_source": "from_dt:机制",
2360 |             "difficulty": "初学者",
2361 |             "notes": "fallback",
2362 |             "equipment_type": "barbell",
2363 |             "equipment_type_zh": "杠铃",
2364 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-behind-the-back-shrug-front.mp4",
2365 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-behind-the-back-shrug-side.mp4"
2366 |         },
2367 |         {
2368 |             "original_url": "https://musclewiki.com/exercise/barbell-single-leg-hip-thrust",
2369 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-single-leg-hip-thrust",
2370 |             "exercise_name_zh": "单腿杠铃臀桥",
2371 |             "muscle_module_zh": "臀部",
2372 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-single-leg-hip-thrust-front.jpg",
2373 |             "muscle_module_en": "Barbell Single Leg Hip Thrust",
2374 |             "muscle_ids": [
2375 |                 "glutes"
2376 |             ],
2377 |             "muscle_ids_zh": [
2378 |                 "臀大肌"
2379 |             ],
2380 |             "mechanic": "复合动作",
2381 |             "mechanic_raw": "复合动作",
2382 |             "mechanic_source": "from_dt:机制",
2383 |             "difficulty": "初学者",
2384 |             "notes": "fallback",
2385 |             "equipment_type": "barbell",
2386 |             "equipment_type_zh": "杠铃",
2387 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-single-leg-hip-thrust-front.mp4",
2388 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-single-leg-hip-thrust-side.mp4"
2389 |         },
2390 |         {
2391 |             "original_url": "https://musclewiki.com/exercise/landmine-kneeling-alternating-overhead-press",
2392 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-kneeling-alternating-overhead-press",
2393 |             "exercise_name_zh": "跪姿单端杠交替过顶推举",
2394 |             "muscle_module_zh": "肩部",
2395 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-kneeling-alternating-overhead-press-side.jpg",
2396 |             "muscle_module_en": "Landmine Kneeling Alternating Overhead Press",
2397 |             "muscle_ids": [
2398 |                 "front-shoulders",
2399 |                 "triceps",
2400 |                 "rear-shoulders"
2401 |             ],
2402 |             "muscle_ids_zh": [
2403 |                 "三角肌前束",
2404 |                 "肱三头肌",
2405 |                 "三角肌后束"
2406 |             ],
2407 |             "mechanic": "复合动作",
2408 |             "mechanic_raw": "复合动作",
2409 |             "mechanic_source": "from_dt:机制",
2410 |             "difficulty": "中级",
2411 |             "notes": "fallback",
2412 |             "equipment_type": "barbell",
2413 |             "equipment_type_zh": "杠铃",
2414 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-kneeling-alternating-overhead-press-front.mp4",
2415 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-kneeling-alternating-overhead-press-side.mp4"
2416 |         },
2417 |         {
2418 |             "original_url": "https://musclewiki.com/exercise/landmine-single-leg-glute-bridge",
2419 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-single-leg-glute-bridge",
2420 |             "exercise_name_zh": "地雷单腿臀桥",
2421 |             "muscle_module_zh": "臀部",
2422 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-single-leg-glute-bridge-front.jpg",
2423 |             "muscle_module_en": "Landmine Single Leg Glute Bridge",
2424 |             "muscle_ids": [
2425 |                 "glutes"
2426 |             ],
2427 |             "muscle_ids_zh": [
2428 |                 "臀大肌"
2429 |             ],
2430 |             "mechanic": "复合动作",
2431 |             "mechanic_raw": "复合动作",
2432 |             "mechanic_source": "from_dt:机制",
2433 |             "difficulty": "高级",
2434 |             "notes": "fallback",
2435 |             "equipment_type": "barbell",
2436 |             "equipment_type_zh": "杠铃",
2437 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-single-leg-glute-bridge-front.mp4",
2438 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-single-leg-glute-bridge-side.mp4"
2439 |         },
2440 |         {
2441 |             "original_url": "https://musclewiki.com/exercise/barbell-kickstand-squat",
2442 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-kickstand-squat",
2443 |             "exercise_name_zh": "杠铃后脚踮地分腿深蹲",
2444 |             "muscle_module_zh": "臀部",
2445 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-kickstand-squat-front.jpg",
2446 |             "muscle_module_en": "Barbell Kickstand Squat",
2447 |             "muscle_ids": [
2448 |                 "quads",
2449 |                 "glutes"
2450 |             ],
2451 |             "muscle_ids_zh": [
2452 |                 "股四头肌",
2453 |                 "臀大肌"
2454 |             ],
2455 |             "mechanic": "复合动作",
2456 |             "mechanic_raw": "复合动作",
2457 |             "mechanic_source": "from_dt:机制",
2458 |             "difficulty": "高级",
2459 |             "notes": "fallback",
2460 |             "equipment_type": "barbell",
2461 |             "equipment_type_zh": "杠铃",
2462 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-kickstand-squat-front.mp4",
2463 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-kickstand-squat-side.mp4"
2464 |         },
2465 |         {
2466 |             "original_url": "https://musclewiki.com/exercise/barbell-high-incline-bench-press",
2467 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-high-incline-bench-press",
2468 |             "exercise_name_zh": "上斜杠铃卧推",
2469 |             "muscle_module_zh": "胸部",
2470 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-high-incline-bench-press-front.jpg",
2471 |             "muscle_module_en": "Barbell High Incline Bench Press",
2472 |             "muscle_ids": [
2473 |                 "front-shoulders",
2474 |                 "chest",
2475 |                 "triceps",
2476 |                 "rear-shoulders"
2477 |             ],
2478 |             "muscle_ids_zh": [
2479 |                 "三角肌前束",
2480 |                 "胸大肌",
2481 |                 "肱三头肌",
2482 |                 "三角肌后束"
2483 |             ],
2484 |             "mechanic": "复合动作",
2485 |             "mechanic_raw": "复合动作",
2486 |             "mechanic_source": "from_dt:机制",
2487 |             "difficulty": "中级",
2488 |             "notes": "fallback",
2489 |             "equipment_type": "barbell",
2490 |             "equipment_type_zh": "杠铃",
2491 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-high-incline-bench-press-front.mp4",
2492 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-high-incline-bench-press-side.mp4"
2493 |         },
2494 |         {
2495 |             "original_url": "https://musclewiki.com/exercise/barbell-guillotine-high-incline-bench-press",
2496 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-guillotine-high-incline-bench-press",
2497 |             "exercise_name_zh": "Barbell Guillotine High Incline Bench Press",
2498 |             "muscle_module_zh": "胸部",
2499 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-guillotine-high-incline-bench-press-side.jpg",
2500 |             "muscle_module_en": "Barbell Guillotine High Incline Bench Press",
2501 |             "muscle_ids": [
2502 |                 "chest",
2503 |                 "triceps"
2504 |             ],
2505 |             "muscle_ids_zh": [
2506 |                 "胸大肌",
2507 |                 "肱三头肌"
2508 |             ],
2509 |             "mechanic": "复合动作",
2510 |             "mechanic_raw": "复合动作",
2511 |             "mechanic_source": "from_dt:机制",
2512 |             "difficulty": "高级",
2513 |             "notes": "fallback",
2514 |             "equipment_type": "barbell",
2515 |             "equipment_type_zh": "杠铃",
2516 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-guillotine-high-incline-bench-press-front.mp4",
2517 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-guillotine-high-incline-bench-press-side.mp4"
2518 |         },
2519 |         {
2520 |             "original_url": "https://musclewiki.com/exercise/landmine-half-kneeling-single-arm-overhead-press",
2521 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-half-kneeling-single-arm-overhead-press",
2522 |             "exercise_name_zh": "单端杠半跪单臂过顶推举",
2523 |             "muscle_module_zh": "肩部",
2524 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-half-kneeling-single-arm-overhead-press-side.jpg",
2525 |             "muscle_module_en": "Landmine Half Kneeling Single Arm Overhead Press",
2526 |             "muscle_ids": [
2527 |                 "front-shoulders",
2528 |                 "triceps",
2529 |                 "rear-shoulders"
2530 |             ],
2531 |             "muscle_ids_zh": [
2532 |                 "三角肌前束",
2533 |                 "肱三头肌",
2534 |                 "三角肌后束"
2535 |             ],
2536 |             "mechanic": "孤立动作",
2537 |             "mechanic_raw": "孤立动作",
2538 |             "mechanic_source": "from_dt:机制",
2539 |             "difficulty": "中级",
2540 |             "notes": "fallback",
2541 |             "equipment_type": "barbell",
2542 |             "equipment_type_zh": "杠铃",
2543 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-half-kneeling-single-arm-overhead-press-front.mp4",
2544 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-half-kneeling-single-arm-overhead-press-side.mp4"
2545 |         },
2546 |         {
2547 |             "original_url": "https://musclewiki.com/exercise/barbell-reverse-grip-bench-press",
2548 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-reverse-grip-bench-press",
2549 |             "exercise_name_zh": "反握杠铃卧推",
2550 |             "muscle_module_zh": "胸部",
2551 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-reverse-grip-bench-press-front.jpg",
2552 |             "muscle_module_en": "Barbell Reverse Grip Bench Press",
2553 |             "muscle_ids": [
2554 |                 "chest",
2555 |                 "triceps"
2556 |             ],
2557 |             "muscle_ids_zh": [
2558 |                 "胸大肌",
2559 |                 "肱三头肌"
2560 |             ],
2561 |             "mechanic": "复合动作",
2562 |             "mechanic_raw": "复合动作",
2563 |             "mechanic_source": "from_dt:机制",
2564 |             "difficulty": "中级",
2565 |             "notes": "fallback",
2566 |             "equipment_type": "barbell",
2567 |             "equipment_type_zh": "杠铃",
2568 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-reverse-grip-bench-press-front.mp4",
2569 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-reverse-grip-bench-press-side.mp4"
2570 |         },
2571 |         {
2572 |             "original_url": "https://musclewiki.com/exercise/barbell-seated-full-front-raise",
2573 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-seated-full-front-raise",
2574 |             "exercise_name_zh": "坐姿杠铃全幅前平举",
2575 |             "muscle_module_zh": "肩部",
2576 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-seated-full-front-raise-side.jpg",
2577 |             "muscle_module_en": "Barbell Seated Full Front Raise",
2578 |             "muscle_ids": [
2579 |                 "front-shoulders",
2580 |                 "rear-shoulders"
2581 |             ],
2582 |             "muscle_ids_zh": [
2583 |                 "三角肌前束",
2584 |                 "三角肌后束"
2585 |             ],
2586 |             "mechanic": "孤立动作",
2587 |             "mechanic_raw": "孤立动作",
2588 |             "mechanic_source": "from_dt:机制",
2589 |             "difficulty": "高级",
2590 |             "notes": "fallback",
2591 |             "equipment_type": "barbell",
2592 |             "equipment_type_zh": "杠铃",
2593 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-seated-full-front-raise-front.mp4",
2594 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-seated-full-front-raise-side.mp4"
2595 |         },
2596 |         {
2597 |             "original_url": "https://musclewiki.com/exercise/landmine-russian-twist",
2598 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-russian-twist",
2599 |             "exercise_name_zh": "地雷杆俄罗斯转体",
2600 |             "muscle_module_zh": "腹斜肌",
2601 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-russian-twist-side.jpg",
2602 |             "muscle_module_en": "Landmine Russian Twist",
2603 |             "muscle_ids": [
2604 |                 "obliques"
2605 |             ],
2606 |             "muscle_ids_zh": [
2607 |                 "腹外斜肌"
2608 |             ],
2609 |             "mechanic": "孤立动作",
2610 |             "mechanic_raw": "孤立动作",
2611 |             "mechanic_source": "from_dt:机制",
2612 |             "difficulty": "中级",
2613 |             "notes": "fallback",
2614 |             "equipment_type": "barbell",
2615 |             "equipment_type_zh": "杠铃",
2616 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-russian-twist-front.mp4",
2617 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-russian-twist-side.mp4"
2618 |         },
2619 |         {
2620 |             "original_url": "https://musclewiki.com/exercise/barbell-single-leg-heels-elevated-hip-thrust",
2621 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-single-leg-heels-elevated-hip-thrust",
2622 |             "exercise_name_zh": "杠铃单腿臀桥（脚跟抬高）",
2623 |             "muscle_module_zh": "臀部",
2624 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-single-leg-heels-elevated-hip-thrust-front.jpg",
2625 |             "muscle_module_en": "Barbell Single Leg Heels Elevated Hip Thrust",
2626 |             "muscle_ids": [
2627 |                 "glutes"
2628 |             ],
2629 |             "muscle_ids_zh": [
2630 |                 "臀大肌"
2631 |             ],
2632 |             "mechanic": "复合动作",
2633 |             "mechanic_raw": "复合动作",
2634 |             "mechanic_source": "from_dt:机制",
2635 |             "difficulty": "高级",
2636 |             "notes": "fallback",
2637 |             "equipment_type": "barbell",
2638 |             "equipment_type_zh": "杠铃",
2639 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-single-leg-heels-elevated-hip-thrust-front.mp4",
2640 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-single-leg-heels-elevated-hip-thrust-side.mp4"
2641 |         },
2642 |         {
2643 |             "original_url": "https://musclewiki.com/exercise/barbell-figure-four-heels-elevated-hip-thrust",
2644 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-figure-four-heels-elevated-hip-thrust",
2645 |             "exercise_name_zh": "杠铃四字式（脚跟抬高）臀推",
2646 |             "muscle_module_zh": "臀部",
2647 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-figure-four-heels-elevated-hip-thrust-front.jpg",
2648 |             "muscle_module_en": "Barbell Figure Four Heels Elevated Hip Thrust",
2649 |             "muscle_ids": [
2650 |                 "glutes"
2651 |             ],
2652 |             "muscle_ids_zh": [
2653 |                 "臀大肌"
2654 |             ],
2655 |             "mechanic": "复合动作",
2656 |             "mechanic_raw": "复合动作",
2657 |             "mechanic_source": "from_dt:机制",
2658 |             "difficulty": "高级",
2659 |             "notes": "fallback",
2660 |             "equipment_type": "barbell",
2661 |             "equipment_type_zh": "杠铃",
2662 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-figure-four-heels-elevated-hip-thrust-front.mp4",
2663 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-figure-four-heels-elevated-hip-thrust-side.mp4"
2664 |         },
2665 |         {
2666 |             "original_url": "https://musclewiki.com/exercise/barbell-behind-the-back-30-degree-shrug",
2667 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-behind-the-back-30-degree-shrug",
2668 |             "exercise_name_zh": "Barbell Behind The Back 30 Degree Shrug",
2669 |             "muscle_module_zh": "斜方肌",
2670 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-behind-the-back-30-degree-shrug-front.jpg",
2671 |             "muscle_module_en": "Barbell Behind The Back",
2672 |             "muscle_ids": [
2673 |                 "traps",
2674 |                 "traps-middle"
2675 |             ],
2676 |             "muscle_ids_zh": [
2677 |                 "斜方肌上束",
2678 |                 "斜方肌中束"
2679 |             ],
2680 |             "mechanic": "孤立动作",
2681 |             "mechanic_raw": "孤立动作",
2682 |             "mechanic_source": "from_dt:机制",
2683 |             "difficulty": "初学者",
2684 |             "notes": "fallback",
2685 |             "equipment_type": "barbell",
2686 |             "equipment_type_zh": "杠铃",
2687 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-behind-the-back-30-degree-shrug-front.mp4",
2688 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-behind-the-back-30-degree-shrug-side.mp4"
2689 |         },
2690 |         {
2691 |             "original_url": "https://musclewiki.com/exercise/landmine-split-jerk",
2692 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-split-jerk",
2693 |             "exercise_name_zh": "单端杠分腿挺举",
2694 |             "muscle_module_zh": "肩部",
2695 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-split-jerk-side.jpg",
2696 |             "muscle_module_en": "Landmine Split Jerk",
2697 |             "muscle_ids": [
2698 |                 "front-shoulders",
2699 |                 "rear-shoulders"
2700 |             ],
2701 |             "muscle_ids_zh": [
2702 |                 "三角肌前束",
2703 |                 "三角肌后束"
2704 |             ],
2705 |             "mechanic": "复合动作",
2706 |             "mechanic_raw": "复合动作",
2707 |             "mechanic_source": "from_dt:机制",
2708 |             "difficulty": "高级",
2709 |             "notes": "fallback",
2710 |             "equipment_type": "barbell",
2711 |             "equipment_type_zh": "杠铃",
2712 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-split-jerk-front.mp4",
2713 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-split-jerk-side.mp4"
2714 |         },
2715 |         {
2716 |             "original_url": "https://musclewiki.com/exercise/barbell-deficit-lunge",
2717 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-deficit-lunge",
2718 |             "exercise_name_zh": "杠铃缺口弓步",
2719 |             "muscle_module_zh": "臀部",
2720 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-deficit-lunge-side.jpg",
2721 |             "muscle_module_en": "Barbell Deficit Lunge",
2722 |             "muscle_ids": [
2723 |                 "quads",
2724 |                 "glutes"
2725 |             ],
2726 |             "muscle_ids_zh": [
2727 |                 "股四头肌",
2728 |                 "臀大肌"
2729 |             ],
2730 |             "mechanic": "复合动作",
2731 |             "mechanic_raw": "复合动作",
2732 |             "mechanic_source": "from_dt:机制",
2733 |             "difficulty": "高级",
2734 |             "notes": "fallback",
2735 |             "equipment_type": "barbell",
2736 |             "equipment_type_zh": "杠铃",
2737 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-deficit-lunge-front.mp4",
2738 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-deficit-lunge-side.mp4"
2739 |         },
2740 |         {
2741 |             "original_url": "https://musclewiki.com/exercise/barbell-heels-up-front-squat",
2742 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-heels-up-front-squat",
2743 |             "exercise_name_zh": "杠铃前蹲（脚跟抬高）",
2744 |             "muscle_module_zh": "臀部",
2745 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-heels-up-front-squat-front.jpg",
2746 |             "muscle_module_en": "Barbell Heels Up Front Squat",
2747 |             "muscle_ids": [
2748 |                 "quads",
2749 |                 "glutes"
2750 |             ],
2751 |             "muscle_ids_zh": [
2752 |                 "股四头肌",
2753 |                 "臀大肌"
2754 |             ],
2755 |             "mechanic": "复合动作",
2756 |             "mechanic_raw": "复合动作",
2757 |             "mechanic_source": "from_dt:机制",
2758 |             "difficulty": "高级",
2759 |             "notes": "fallback",
2760 |             "equipment_type": "barbell",
2761 |             "equipment_type_zh": "杠铃",
2762 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-heels-up-front-squat-front.mp4",
2763 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-heels-up-front-squat-side.mp4"
2764 |         },
2765 |         {
2766 |             "original_url": "https://musclewiki.com/exercise/barbell-tap-pause-squat",
2767 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-tap-pause-squat",
2768 |             "exercise_name_zh": "杠铃触底暂停深蹲",
2769 |             "muscle_module_zh": "臀部",
2770 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-tap-box-squat-front.jpg",
2771 |             "muscle_module_en": "Barbell Tap Pause Squat",
2772 |             "muscle_ids": [
2773 |                 "quads",
2774 |                 "glutes"
2775 |             ],
2776 |             "muscle_ids_zh": [
2777 |                 "股四头肌",
2778 |                 "臀大肌"
2779 |             ],
2780 |             "mechanic": "复合动作",
2781 |             "mechanic_raw": "复合动作",
2782 |             "mechanic_source": "from_dt:机制",
2783 |             "difficulty": "中级",
2784 |             "notes": "fallback",
2785 |             "equipment_type": "barbell",
2786 |             "equipment_type_zh": "杠铃",
2787 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-tap-box-squat-front.mp4",
2788 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-tap-box-squat-side.mp4"
2789 |         },
2790 |         {
2791 |             "original_url": "https://musclewiki.com/exercise/barbell-landmine-side-bend",
2792 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-landmine-side-bend",
2793 |             "exercise_name_zh": "杠铃地雷侧弯",
2794 |             "muscle_module_zh": "腹斜肌",
2795 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-landmine-side-bend-front.jpg",
2796 |             "muscle_module_en": "Barbell Landmine Side Bend",
2797 |             "muscle_ids": [
2798 |                 "obliques"
2799 |             ],
2800 |             "muscle_ids_zh": [
2801 |                 "腹外斜肌"
2802 |             ],
2803 |             "mechanic": "孤立动作",
2804 |             "mechanic_raw": "孤立动作",
2805 |             "mechanic_source": "from_dt:机制",
2806 |             "difficulty": "中级",
2807 |             "notes": "fallback",
2808 |             "equipment_type": "barbell",
2809 |             "equipment_type_zh": "杠铃",
2810 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-landmine-side-bend-front.mp4",
2811 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-landmine-side-bend-side.mp4"
2812 |         },
2813 |         {
2814 |             "original_url": "https://musclewiki.com/exercise/barbell-spoto-press",
2815 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-spoto-press",
2816 |             "exercise_name_zh": "杠铃Spoto卧推",
2817 |             "muscle_module_zh": "胸部",
2818 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-spoto-press-front.jpg",
2819 |             "muscle_module_en": "Spoto",
2820 |             "muscle_ids": [
2821 |                 "chest",
2822 |                 "triceps"
2823 |             ],
2824 |             "muscle_ids_zh": [
2825 |                 "胸大肌",
2826 |                 "肱三头肌"
2827 |             ],
2828 |             "mechanic": "复合动作",
2829 |             "mechanic_raw": "复合动作",
2830 |             "mechanic_source": "from_dt:机制",
2831 |             "difficulty": "高级",
2832 |             "notes": "fallback",
2833 |             "equipment_type": "barbell",
2834 |             "equipment_type_zh": "杠铃",
2835 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-spoto-press-front.mp4",
2836 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-spoto-press-side.mp4"
2837 |         },
2838 |         {
2839 |             "original_url": "https://musclewiki.com/exercise/landmine-alternating-single-arm-press",
2840 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-alternating-single-arm-press",
2841 |             "exercise_name_zh": "Landmine交替单臂推举",
2842 |             "muscle_module_zh": "肩部",
2843 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-alternating-single-arm-press-side.jpg",
2844 |             "muscle_module_en": "Landmine",
2845 |             "muscle_ids": [
2846 |                 "front-shoulders",
2847 |                 "triceps",
2848 |                 "rear-shoulders"
2849 |             ],
2850 |             "muscle_ids_zh": [
2851 |                 "三角肌前束",
2852 |                 "肱三头肌",
2853 |                 "三角肌后束"
2854 |             ],
2855 |             "mechanic": "孤立动作",
2856 |             "mechanic_raw": "孤立动作",
2857 |             "mechanic_source": "from_dt:机制",
2858 |             "difficulty": "中级",
2859 |             "notes": "fallback",
2860 |             "equipment_type": "barbell",
2861 |             "equipment_type_zh": "杠铃",
2862 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-alternating-single-arm-press-front.mp4",
2863 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-alternating-single-arm-press-side.mp4"
2864 |         },
2865 |         {
2866 |             "original_url": "https://musclewiki.com/exercise/barbell-j-m-press",
2867 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-j-m-press",
2868 |             "exercise_name_zh": "Barbell J M Press",
2869 |             "muscle_module_zh": "三头肌",
2870 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-j-m-press-front.jpg",
2871 |             "muscle_module_en": "Barbell J M Press",
2872 |             "muscle_ids": [
2873 |                 "chest",
2874 |                 "triceps"
2875 |             ],
2876 |             "muscle_ids_zh": [
2877 |                 "胸大肌",
2878 |                 "肱三头肌"
2879 |             ],
2880 |             "mechanic": "复合动作",
2881 |             "mechanic_raw": "复合动作",
2882 |             "mechanic_source": "from_dt:机制",
2883 |             "difficulty": "中级",
2884 |             "notes": "fallback",
2885 |             "equipment_type": "barbell",
2886 |             "equipment_type_zh": "杠铃",
2887 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-j-m-press-front.mp4",
2888 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-j-m-press-side.mp4"
2889 |         },
2890 |         {
2891 |             "original_url": "https://musclewiki.com/exercise/barbell-front-rack-deficit-lunge",
2892 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-front-rack-deficit-lunge",
2893 |             "exercise_name_zh": "杠铃前架台阶弓步",
2894 |             "muscle_module_zh": "臀部",
2895 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-front-rack-deficit-lunge-front.jpg",
2896 |             "muscle_module_en": "Barbell Front Rack Deficit Lunge",
2897 |             "muscle_ids": [
2898 |                 "quads",
2899 |                 "glutes"
2900 |             ],
2901 |             "muscle_ids_zh": [
2902 |                 "股四头肌",
2903 |                 "臀大肌"
2904 |             ],
2905 |             "mechanic": "复合动作",
2906 |             "mechanic_raw": "复合动作",
2907 |             "mechanic_source": "from_dt:机制",
2908 |             "difficulty": "高级",
2909 |             "notes": "fallback",
2910 |             "equipment_type": "barbell",
2911 |             "equipment_type_zh": "杠铃",
2912 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-front-rack-deficit-lunge-front.mp4",
2913 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-front-rack-deficit-lunge-side.mp4"
2914 |         },
2915 |         {
2916 |             "original_url": "https://musclewiki.com/exercise/landmine-rotational-lift-to-press",
2917 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-rotational-lift-to-press",
2918 |             "exercise_name_zh": "Landmine 旋转提举并推举",
2919 |             "muscle_module_zh": "肩部",
2920 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-rotational-lift-to-press-side.jpg",
2921 |             "muscle_module_en": "Landmine",
2922 |             "muscle_ids": [
2923 |                 "quads",
2924 |                 "obliques",
2925 |                 "front-shoulders",
2926 |                 "glutes",
2927 |                 "rear-shoulders"
2928 |             ],
2929 |             "muscle_ids_zh": [
2930 |                 "股四头肌",
2931 |                 "腹外斜肌",
2932 |                 "三角肌前束",
2933 |                 "臀大肌",
2934 |                 "三角肌后束"
2935 |             ],
2936 |             "mechanic": "复合动作",
2937 |             "mechanic_raw": "复合动作",
2938 |             "mechanic_source": "from_dt:机制",
2939 |             "difficulty": "高级",
2940 |             "notes": "fallback",
2941 |             "equipment_type": "barbell",
2942 |             "equipment_type_zh": "杠铃",
2943 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-rotational-lift-to-press-front.mp4",
2944 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-rotational-lift-to-press-side.mp4"
2945 |         },
2946 |         {
2947 |             "original_url": "https://musclewiki.com/exercise/barbell-feet-elevated-single-leg-glute-bridge",
2948 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-feet-elevated-single-leg-glute-bridge",
2949 |             "exercise_name_zh": "杠铃单腿抬高臀桥",
2950 |             "muscle_module_zh": "臀部",
2951 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-feet-elevated-single-leg-glute-bridge-front.jpg",
2952 |             "muscle_module_en": "Barbell Feet Elevated Single Leg Glute Bridge",
2953 |             "muscle_ids": [
2954 |                 "glutes"
2955 |             ],
2956 |             "muscle_ids_zh": [
2957 |                 "臀大肌"
2958 |             ],
2959 |             "mechanic": "复合动作",
2960 |             "mechanic_raw": "复合动作",
2961 |             "mechanic_source": "from_dt:机制",
2962 |             "difficulty": "高级",
2963 |             "notes": "fallback",
2964 |             "equipment_type": "barbell",
2965 |             "equipment_type_zh": "杠铃",
2966 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-feet-elevated-single-leg-glute-bridge-front.mp4",
2967 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-feet-elevated-single-leg-glute-bridge-side.mp4"
2968 |         },
2969 |         {
2970 |             "original_url": "https://musclewiki.com/exercise/landmine-kneeling-twist",
2971 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-kneeling-twist",
2972 |             "exercise_name_zh": "跪姿杠铃转体",
2973 |             "muscle_module_zh": "腹斜肌",
2974 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-kneeling-twist-side.jpg",
2975 |             "muscle_module_en": "Landmine Kneeling Twist",
2976 |             "muscle_ids": [
2977 |                 "obliques"
2978 |             ],
2979 |             "muscle_ids_zh": [
2980 |                 "腹外斜肌"
2981 |             ],
2982 |             "mechanic": "孤立动作",
2983 |             "mechanic_raw": "孤立动作",
2984 |             "mechanic_source": "from_dt:机制",
2985 |             "difficulty": "中级",
2986 |             "notes": "fallback",
2987 |             "equipment_type": "barbell",
2988 |             "equipment_type_zh": "杠铃",
2989 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-kneeling-twist-front.mp4",
2990 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-kneeling-twist-side.mp4"
2991 |         },
2992 |         {
2993 |             "original_url": "https://musclewiki.com/exercise/barbell-shoulder-extension",
2994 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-shoulder-extension",
2995 |             "exercise_name_zh": "Barbell Shoulder Extension",
2996 |             "muscle_module_zh": "背阔肌",
2997 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-shoulder-extension-side.jpg",
2998 |             "muscle_module_en": "Barbell Shoulder Extension",
2999 |             "muscle_ids": [
3000 |                 "lats"
3001 |             ],
3002 |             "muscle_ids_zh": [
3003 |                 "背阔肌"
3004 |             ],
3005 |             "mechanic": "孤立动作",
3006 |             "mechanic_raw": "孤立动作",
3007 |             "mechanic_source": "from_dt:机制",
3008 |             "difficulty": "中级",
3009 |             "notes": "fallback",
3010 |             "equipment_type": "barbell",
3011 |             "equipment_type_zh": "杠铃",
3012 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-shoulder-extension-front.mp4",
3013 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-shoulder-extension-side.mp4"
3014 |         },
3015 |         {
3016 |             "original_url": "https://musclewiki.com/exercise/barbell-front-raise",
3017 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-front-raise",
3018 |             "exercise_name_zh": "杠铃前平举",
3019 |             "muscle_module_zh": "肩部",
3020 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-front-raise-front.jpg",
3021 |             "muscle_module_en": "Barbell Front Raise",
3022 |             "muscle_ids": [
3023 |                 "front-shoulders",
3024 |                 "rear-shoulders"
3025 |             ],
3026 |             "muscle_ids_zh": [
3027 |                 "三角肌前束",
3028 |                 "三角肌后束"
3029 |             ],
3030 |             "mechanic": "孤立动作",
3031 |             "mechanic_raw": "孤立动作",
3032 |             "mechanic_source": "from_dt:机制",
3033 |             "difficulty": "中级",
3034 |             "notes": "fallback",
3035 |             "equipment_type": "barbell",
3036 |             "equipment_type_zh": "杠铃",
3037 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-front-raise-front.mp4",
3038 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-front-raise-side.mp4"
3039 |         },
3040 |         {
3041 |             "original_url": "https://musclewiki.com/exercise/landmine-oblique-twist",
3042 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-oblique-twist",
3043 |             "exercise_name_zh": "地雷式侧腹旋转",
3044 |             "muscle_module_zh": "腹斜肌",
3045 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-oblique-twist-side.jpg",
3046 |             "muscle_module_en": "Landmine Oblique Twist",
3047 |             "muscle_ids": [
3048 |                 "obliques"
3049 |             ],
3050 |             "muscle_ids_zh": [
3051 |                 "腹外斜肌"
3052 |             ],
3053 |             "mechanic": "复合动作",
3054 |             "mechanic_raw": "复合动作",
3055 |             "mechanic_source": "from_dt:机制",
3056 |             "difficulty": "高级",
3057 |             "notes": "fallback",
3058 |             "equipment_type": "barbell",
3059 |             "equipment_type_zh": "杠铃",
3060 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-oblique-twist-front.mp4",
3061 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-oblique-twist-side.mp4"
3062 |         },
3063 |         {
3064 |             "original_url": "https://musclewiki.com/exercise/barbell-floor-press",
3065 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-floor-press",
3066 |             "exercise_name_zh": "杠铃地板卧推",
3067 |             "muscle_module_zh": "三头肌",
3068 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-floor-press-side.jpg",
3069 |             "muscle_module_en": "Barbell Floor Press",
3070 |             "muscle_ids": [
3071 |                 "chest",
3072 |                 "triceps"
3073 |             ],
3074 |             "muscle_ids_zh": [
3075 |                 "胸大肌",
3076 |                 "肱三头肌"
3077 |             ],
3078 |             "mechanic": "复合动作",
3079 |             "mechanic_raw": "复合动作",
3080 |             "mechanic_source": "from_dt:机制",
3081 |             "difficulty": "高级",
3082 |             "notes": "fallback",
3083 |             "equipment_type": "barbell",
3084 |             "equipment_type_zh": "杠铃",
3085 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-floor-press-front.mp4",
3086 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-floor-press-side.mp4"
3087 |         },
3088 |         {
3089 |             "original_url": "https://musclewiki.com/exercise/landmine-glute-kick-back",
3090 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-glute-kick-back",
3091 |             "exercise_name_zh": "地雷式臀部后踢",
3092 |             "muscle_module_zh": "臀部",
3093 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-glute-kick-back-front.jpg",
3094 |             "muscle_module_en": "Landmine Glute Kick Back",
3095 |             "muscle_ids": [
3096 |                 "glutes"
3097 |             ],
3098 |             "muscle_ids_zh": [
3099 |                 "臀大肌"
3100 |             ],
3101 |             "mechanic": "孤立动作",
3102 |             "mechanic_raw": "孤立动作",
3103 |             "mechanic_source": "from_dt:机制",
3104 |             "difficulty": "中级",
3105 |             "notes": "fallback",
3106 |             "equipment_type": "barbell",
3107 |             "equipment_type_zh": "杠铃",
3108 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-glute-kick-back-front.mp4",
3109 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-glute-kick-back-side.mp4"
3110 |         },
3111 |         {
3112 |             "original_url": "https://musclewiki.com/exercise/barbell-curtsy-deficit-lunge",
3113 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-curtsy-deficit-lunge",
3114 |             "exercise_name_zh": "杠铃台阶交叉弓步",
3115 |             "muscle_module_zh": "臀部",
3116 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-curtsy-deficit-lunge-front.jpg",
3117 |             "muscle_module_en": "Barbell Curtsy Deficit Lunge",
3118 |             "muscle_ids": [
3119 |                 "quads",
3120 |                 "glutes"
3121 |             ],
3122 |             "muscle_ids_zh": [
3123 |                 "股四头肌",
3124 |                 "臀大肌"
3125 |             ],
3126 |             "mechanic": "复合动作",
3127 |             "mechanic_raw": "复合动作",
3128 |             "mechanic_source": "from_dt:机制",
3129 |             "difficulty": "高级",
3130 |             "notes": "fallback",
3131 |             "equipment_type": "barbell",
3132 |             "equipment_type_zh": "杠铃",
3133 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-curtsy-deficit-lunge-front.mp4",
3134 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-curtsy-deficit-lunge-side.mp4"
3135 |         },
3136 |         {
3137 |             "original_url": "https://musclewiki.com/exercise/barbell-behind-the-neck-press",
3138 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-behind-the-neck-press",
3139 |             "exercise_name_zh": "Barbell Behind The Neck Press",
3140 |             "muscle_module_zh": "肩部",
3141 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-behind-the-neck-press-side.jpg",
3142 |             "muscle_module_en": "Barbell Behind The Neck Press",
3143 |             "muscle_ids": [
3144 |                 "front-shoulders",
3145 |                 "triceps",
3146 |                 "rear-shoulders"
3147 |             ],
3148 |             "muscle_ids_zh": [
3149 |                 "三角肌前束",
3150 |                 "肱三头肌",
3151 |                 "三角肌后束"
3152 |             ],
3153 |             "mechanic": "复合动作",
3154 |             "mechanic_raw": "复合动作",
3155 |             "mechanic_source": "from_dt:机制",
3156 |             "difficulty": "中级",
3157 |             "notes": "fallback",
3158 |             "equipment_type": "barbell",
3159 |             "equipment_type_zh": "杠铃",
3160 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-behind-the-neck-press-front.mp4",
3161 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-behind-the-neck-press-side.mp4"
3162 |         },
3163 |         {
3164 |             "original_url": "https://musclewiki.com/exercise/landmine-sumo-deadlift",
3165 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-sumo-deadlift",
3166 |             "exercise_name_zh": "Landmine 相扑硬拉",
3167 |             "muscle_module_zh": "臀部",
3168 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-sumo-deadlift-side.jpg",
3169 |             "muscle_module_en": "Landmine",
3170 |             "muscle_ids": [
3171 |                 "quads",
3172 |                 "glutes"
3173 |             ],
3174 |             "muscle_ids_zh": [
3175 |                 "股四头肌",
3176 |                 "臀大肌"
3177 |             ],
3178 |             "mechanic": "复合动作",
3179 |             "mechanic_raw": "复合动作",
3180 |             "mechanic_source": "from_dt:机制",
3181 |             "difficulty": "初学者",
3182 |             "notes": "fallback",
3183 |             "equipment_type": "barbell",
3184 |             "equipment_type_zh": "杠铃",
3185 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-sumo-deadlift-front.mp4",
3186 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-sumo-deadlift-side.mp4"
3187 |         },
3188 |         {
3189 |             "original_url": "https://musclewiki.com/exercise/landmine-overhead-press",
3190 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-overhead-press",
3191 |             "exercise_name_zh": "地雷头顶推举",
3192 |             "muscle_module_zh": "肩部",
3193 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-overhead-press-front.jpg",
3194 |             "muscle_module_en": "Landmine Overhead Press",
3195 |             "muscle_ids": [
3196 |                 "front-shoulders",
3197 |                 "triceps",
3198 |                 "rear-shoulders"
3199 |             ],
3200 |             "muscle_ids_zh": [
3201 |                 "三角肌前束",
3202 |                 "肱三头肌",
3203 |                 "三角肌后束"
3204 |             ],
3205 |             "mechanic": "复合动作",
3206 |             "mechanic_raw": "复合动作",
3207 |             "mechanic_source": "from_dt:机制",
3208 |             "difficulty": "中级",
3209 |             "notes": "fallback",
3210 |             "equipment_type": "barbell",
3211 |             "equipment_type_zh": "杠铃",
3212 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-overhead-press-front.mp4",
3213 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-overhead-press-side.mp4"
3214 |         },
3215 |         {
3216 |             "original_url": "https://musclewiki.com/exercise/landmine-seated-single-arm-overhead-press",
3217 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-seated-single-arm-overhead-press",
3218 |             "exercise_name_zh": "坐姿单臂Landmine肩上推举",
3219 |             "muscle_module_zh": "肩部",
3220 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-seated-single-arm-overhead-press-side.jpg",
3221 |             "muscle_module_en": "Landmine",
3222 |             "muscle_ids": [
3223 |                 "front-shoulders",
3224 |                 "triceps",
3225 |                 "rear-shoulders"
3226 |             ],
3227 |             "muscle_ids_zh": [
3228 |                 "三角肌前束",
3229 |                 "肱三头肌",
3230 |                 "三角肌后束"
3231 |             ],
3232 |             "mechanic": "复合动作",
3233 |             "mechanic_raw": "复合动作",
3234 |             "mechanic_source": "from_dt:机制",
3235 |             "difficulty": "中级",
3236 |             "notes": "fallback",
3237 |             "equipment_type": "barbell",
3238 |             "equipment_type_zh": "杠铃",
3239 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-seated-single-arm-overhead-press-front.mp4",
3240 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-seated-single-arm-overhead-press-side.mp4"
3241 |         },
3242 |         {
3243 |             "original_url": "https://musclewiki.com/exercise/landmine-curtsy-lunge",
3244 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-curtsy-lunge",
3245 |             "exercise_name_zh": "地雷后交叉弓步",
3246 |             "muscle_module_zh": "臀部",
3247 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-curtsy-lunge-side.jpg",
3248 |             "muscle_module_en": "Landmine Curtsy Lunge",
3249 |             "muscle_ids": [
3250 |                 "quads",
3251 |                 "glutes"
3252 |             ],
3253 |             "muscle_ids_zh": [
3254 |                 "股四头肌",
3255 |                 "臀大肌"
3256 |             ],
3257 |             "mechanic": "复合动作",
3258 |             "mechanic_raw": "复合动作",
3259 |             "mechanic_source": "from_dt:机制",
3260 |             "difficulty": "中级",
3261 |             "notes": "fallback",
3262 |             "equipment_type": "barbell",
3263 |             "equipment_type_zh": "杠铃",
3264 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-curtsy-lunge-front.mp4",
3265 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-curtsy-lunge-side.mp4"
3266 |         },
3267 |         {
3268 |             "original_url": "https://musclewiki.com/exercise/landmine-lateral-lunge",
3269 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-lateral-lunge",
3270 |             "exercise_name_zh": "单端杠铃侧弓步",
3271 |             "muscle_module_zh": "臀部",
3272 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-lateral-lunge-side.jpg",
3273 |             "muscle_module_en": "Landmine Lateral Lunge",
3274 |             "muscle_ids": [
3275 |                 "quads",
3276 |                 "glutes"
3277 |             ],
3278 |             "muscle_ids_zh": [
3279 |                 "股四头肌",
3280 |                 "臀大肌"
3281 |             ],
3282 |             "mechanic": "复合动作",
3283 |             "mechanic_raw": "复合动作",
3284 |             "mechanic_source": "from_dt:机制",
3285 |             "difficulty": "中级",
3286 |             "notes": "fallback",
3287 |             "equipment_type": "barbell",
3288 |             "equipment_type_zh": "杠铃",
3289 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-lateral-lunge-front.mp4",
3290 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-lateral-lunge-side.mp4"
3291 |         },
3292 |         {
3293 |             "original_url": "https://musclewiki.com/exercise/landmine-single-arm-overhead-press",
3294 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-single-arm-overhead-press",
3295 |             "exercise_name_zh": "单臂炮管肩上推举",
3296 |             "muscle_module_zh": "肩部",
3297 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-single-arm-overhead-press-front.jpg",
3298 |             "muscle_module_en": "Landmine Single Arm Overhead Press",
3299 |             "muscle_ids": [
3300 |                 "front-shoulders",
3301 |                 "triceps",
3302 |                 "rear-shoulders"
3303 |             ],
3304 |             "muscle_ids_zh": [
3305 |                 "三角肌前束",
3306 |                 "肱三头肌",
3307 |                 "三角肌后束"
3308 |             ],
3309 |             "mechanic": "复合动作",
3310 |             "mechanic_raw": "复合动作",
3311 |             "mechanic_source": "from_dt:机制",
3312 |             "difficulty": "中级",
3313 |             "notes": "fallback",
3314 |             "equipment_type": "barbell",
3315 |             "equipment_type_zh": "杠铃",
3316 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-single-arm-overhead-press-front.mp4",
3317 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-single-arm-overhead-press-side.mp4"
3318 |         },
3319 |         {
3320 |             "original_url": "https://musclewiki.com/exercise/barbell-heels-up-back-squat",
3321 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-heels-up-back-squat",
3322 |             "exercise_name_zh": "杠铃后深蹲（脚跟垫高）",
3323 |             "muscle_module_zh": "臀部",
3324 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-heels-up-back-squat-front.jpg",
3325 |             "muscle_module_en": "Barbell Heels Up Back Squat",
3326 |             "muscle_ids": [
3327 |                 "quads",
3328 |                 "glutes"
3329 |             ],
3330 |             "muscle_ids_zh": [
3331 |                 "股四头肌",
3332 |                 "臀大肌"
3333 |             ],
3334 |             "mechanic": "复合动作",
3335 |             "mechanic_raw": "复合动作",
3336 |             "mechanic_source": "from_dt:机制",
3337 |             "difficulty": "高级",
3338 |             "notes": "fallback",
3339 |             "equipment_type": "barbell",
3340 |             "equipment_type_zh": "杠铃",
3341 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-heels-up-back-squat-front.mp4",
3342 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-heels-up-back-squat-side.mp4"
3343 |         },
3344 |         {
3345 |             "original_url": "https://musclewiki.com/exercise/landmine-single-arm-staggered-overhead-press",
3346 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-single-arm-staggered-overhead-press",
3347 |             "exercise_name_zh": "Landmine 单臂交错站姿头顶推举",
3348 |             "muscle_module_zh": "肩部",
3349 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-single-arm-staggered-overhead-press-side.jpg",
3350 |             "muscle_module_en": "Landmine",
3351 |             "muscle_ids": [
3352 |                 "front-shoulders",
3353 |                 "triceps",
3354 |                 "rear-shoulders"
3355 |             ],
3356 |             "muscle_ids_zh": [
3357 |                 "三角肌前束",
3358 |                 "肱三头肌",
3359 |                 "三角肌后束"
3360 |             ],
3361 |             "mechanic": "复合动作",
3362 |             "mechanic_raw": "复合动作",
3363 |             "mechanic_source": "from_dt:机制",
3364 |             "difficulty": "中级",
3365 |             "notes": "fallback",
3366 |             "equipment_type": "barbell",
3367 |             "equipment_type_zh": "杠铃",
3368 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-single-arm-staggered-overhead-press-front.mp4",
3369 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-single-arm-staggered-overhead-press-side.mp4"
3370 |         },
3371 |         {
3372 |             "original_url": "https://musclewiki.com/exercise/landmine-thruster",
3373 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-thruster",
3374 |             "exercise_name_zh": "地雷杆推举",
3375 |             "muscle_module_zh": "臀部",
3376 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-thruster-side.jpg",
3377 |             "muscle_module_en": "Landmine Thruster",
3378 |             "muscle_ids": [
3379 |                 "quads",
3380 |                 "front-shoulders",
3381 |                 "glutes",
3382 |                 "rear-shoulders"
3383 |             ],
3384 |             "muscle_ids_zh": [
3385 |                 "股四头肌",
3386 |                 "三角肌前束",
3387 |                 "臀大肌",
3388 |                 "三角肌后束"
3389 |             ],
3390 |             "mechanic": "复合动作",
3391 |             "mechanic_raw": "复合动作",
3392 |             "mechanic_source": "from_dt:机制",
3393 |             "difficulty": "中级",
3394 |             "notes": "fallback",
3395 |             "equipment_type": "barbell",
3396 |             "equipment_type_zh": "杠铃",
3397 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-thruster-front.mp4",
3398 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-thruster-side.mp4"
3399 |         },
3400 |         {
3401 |             "original_url": "https://musclewiki.com/exercise/barbell-quad-stomp",
3402 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-quad-stomp",
3403 |             "exercise_name_zh": "杠铃四头肌踩踏",
3404 |             "muscle_module_zh": "股四头肌",
3405 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-quad-stomp-front.jpg",
3406 |             "muscle_module_en": "Barbell Quad Stomp",
3407 |             "muscle_ids": [
3408 |                 "quads",
3409 |                 "glutes"
3410 |             ],
3411 |             "muscle_ids_zh": [
3412 |                 "股四头肌",
3413 |                 "臀大肌"
3414 |             ],
3415 |             "mechanic": "复合动作",
3416 |             "mechanic_raw": "复合动作",
3417 |             "mechanic_source": "from_dt:机制",
3418 |             "difficulty": "高级",
3419 |             "notes": "fallback",
3420 |             "equipment_type": "barbell",
3421 |             "equipment_type_zh": "杠铃",
3422 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-quad-stomp-front.mp4",
3423 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-quad-stomp-side.mp4"
3424 |         },
3425 |         {
3426 |             "original_url": "https://musclewiki.com/exercise/barbell-full-front-raise",
3427 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-full-front-raise",
3428 |             "exercise_name_zh": "杠铃前平举（全程）",
3429 |             "muscle_module_zh": "肩部",
3430 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-full-front-raise-side.jpg",
3431 |             "muscle_module_en": "Barbell Full Front Raise",
3432 |             "muscle_ids": [
3433 |                 "front-shoulders",
3434 |                 "rear-shoulders"
3435 |             ],
3436 |             "muscle_ids_zh": [
3437 |                 "三角肌前束",
3438 |                 "三角肌后束"
3439 |             ],
3440 |             "mechanic": "孤立动作",
3441 |             "mechanic_raw": "孤立动作",
3442 |             "mechanic_source": "from_dt:机制",
3443 |             "difficulty": "中级",
3444 |             "notes": "fallback",
3445 |             "equipment_type": "barbell",
3446 |             "equipment_type_zh": "杠铃",
3447 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-full-front-raise-front.mp4",
3448 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-full-front-raise-side.mp4"
3449 |         },
3450 |         {
3451 |             "original_url": "https://musclewiki.com/exercise/barbell-bradford-press",
3452 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-bradford-press",
3453 |             "exercise_name_zh": "杠铃布拉德福德推举",
3454 |             "muscle_module_zh": "肩部",
3455 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-bradford-press-side.jpg",
3456 |             "muscle_module_en": "Barbell Bradford Press",
3457 |             "muscle_ids": [
3458 |                 "front-shoulders",
3459 |                 "triceps",
3460 |                 "rear-shoulders"
3461 |             ],
3462 |             "muscle_ids_zh": [
3463 |                 "三角肌前束",
3464 |                 "肱三头肌",
3465 |                 "三角肌后束"
3466 |             ],
3467 |             "mechanic": "复合动作",
3468 |             "mechanic_raw": "复合动作",
3469 |             "mechanic_source": "from_dt:机制",
3470 |             "difficulty": "中级",
3471 |             "notes": "fallback",
3472 |             "equipment_type": "barbell",
3473 |             "equipment_type_zh": "杠铃",
3474 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-bradford-press-front.mp4",
3475 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-bradford-press-side.mp4"
3476 |         },
3477 |         {
3478 |             "original_url": "https://musclewiki.com/exercise/landmine-seated-alternating-overhead-press",
3479 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-seated-alternating-overhead-press",
3480 |             "exercise_name_zh": "坐姿交替Landmine过顶推举",
3481 |             "muscle_module_zh": "肩部",
3482 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-seated-alternating-overhead-press-side.jpg",
3483 |             "muscle_module_en": "Landmine",
3484 |             "muscle_ids": [
3485 |                 "front-shoulders",
3486 |                 "triceps",
3487 |                 "rear-shoulders"
3488 |             ],
3489 |             "muscle_ids_zh": [
3490 |                 "三角肌前束",
3491 |                 "肱三头肌",
3492 |                 "三角肌后束"
3493 |             ],
3494 |             "mechanic": "复合动作",
3495 |             "mechanic_raw": "复合动作",
3496 |             "mechanic_source": "from_dt:机制",
3497 |             "difficulty": "中级",
3498 |             "notes": "fallback",
3499 |             "equipment_type": "barbell",
3500 |             "equipment_type_zh": "杠铃",
3501 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-seated-alternating-overhead-press-front.mp4",
3502 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-seated-alternating-overhead-press-side.mp4"
3503 |         },
3504 |         {
3505 |             "original_url": "https://musclewiki.com/exercise/landmine-lateral-raise",
3506 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-lateral-raise",
3507 |             "exercise_name_zh": "地雷侧平举",
3508 |             "muscle_module_zh": "肩部",
3509 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-lateral-raise-front.jpg",
3510 |             "muscle_module_en": "Landmine Lateral Raise",
3511 |             "muscle_ids": [
3512 |                 "front-shoulders",
3513 |                 "rear-shoulders"
3514 |             ],
3515 |             "muscle_ids_zh": [
3516 |                 "三角肌前束",
3517 |                 "三角肌后束"
3518 |             ],
3519 |             "mechanic": "孤立动作",
3520 |             "mechanic_raw": "孤立动作",
3521 |             "mechanic_source": "from_dt:机制",
3522 |             "difficulty": "中级",
3523 |             "notes": "fallback",
3524 |             "equipment_type": "barbell",
3525 |             "equipment_type_zh": "杠铃",
3526 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-lateral-raise-front.mp4",
3527 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-lateral-raise-side.mp4"
3528 |         },
3529 |         {
3530 |             "original_url": "https://musclewiki.com/exercise/barbell-feet-elevated-staggered-glute-bridge",
3531 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-feet-elevated-staggered-glute-bridge",
3532 |             "exercise_name_zh": "杠铃交错臀桥（脚抬高）",
3533 |             "muscle_module_zh": "臀部",
3534 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-feet-elevated-staggered-glute-bridge-front.jpg",
3535 |             "muscle_module_en": "Barbell Feet Elevated Staggered Glute Bridge",
3536 |             "muscle_ids": [
3537 |                 "glutes"
3538 |             ],
3539 |             "muscle_ids_zh": [
3540 |                 "臀大肌"
3541 |             ],
3542 |             "mechanic": "复合动作",
3543 |             "mechanic_raw": "复合动作",
3544 |             "mechanic_source": "from_dt:机制",
3545 |             "difficulty": "中级",
3546 |             "notes": "fallback",
3547 |             "equipment_type": "barbell",
3548 |             "equipment_type_zh": "杠铃",
3549 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-feet-elevated-staggered-glute-bridge-front.mp4",
3550 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-feet-elevated-staggered-glute-bridge-side.mp4"
3551 |         },
3552 |         {
3553 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-romanian-deadlift",
3554 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-romanian-deadlift",
3555 |             "exercise_name_zh": "杠铃罗马尼亚硬拉",
3556 |             "muscle_module_zh": "臀部",
3557 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-romanian-deadlift-side.jpg",
3558 |             "muscle_module_en": "Barbell Romanian Deadlift",
3559 |             "muscle_ids": [
3560 |                 "hamstrings",
3561 |                 "glutes"
3562 |             ],
3563 |             "muscle_ids_zh": [
3564 |                 "腘绳肌",
3565 |                 "臀大肌"
3566 |             ],
3567 |             "mechanic": "复合动作",
3568 |             "mechanic_raw": "复合动作",
3569 |             "mechanic_source": "from_dt:机制",
3570 |             "difficulty": "中级",
3571 |             "notes": "",
3572 |             "equipment_type": "barbell",
3573 |             "equipment_type_zh": "杠铃",
3574 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-romanian-deadlift-front.mp4",
3575 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-romanian-deadlift-side.mp4"
3576 |         },
3577 |         {
3578 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-low-bar-squat",
3579 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-low-bar-squat",
3580 |             "exercise_name_zh": "杠铃低位深蹲",
3581 |             "muscle_module_zh": "臀部",
3582 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-low-bar-squat-side.jpg",
3583 |             "muscle_module_en": "Barbell Low Bar Squat",
3584 |             "muscle_ids": [
3585 |                 "quads",
3586 |                 "glutes"
3587 |             ],
3588 |             "muscle_ids_zh": [
3589 |                 "股四头肌",
3590 |                 "臀大肌"
3591 |             ],
3592 |             "mechanic": "复合动作",
3593 |             "mechanic_raw": "复合动作",
3594 |             "mechanic_source": "from_dt:机制",
3595 |             "difficulty": "中级",
3596 |             "notes": "",
3597 |             "equipment_type": "barbell",
3598 |             "equipment_type_zh": "杠铃",
3599 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-low-bar-squat-front.mp4",
3600 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-low-bar-squat-side.mp4"
3601 |         },
3602 |         {
3603 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-hip-thrust",
3604 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-hip-thrust",
3605 |             "exercise_name_zh": "杠铃臀桥",
3606 |             "muscle_module_zh": "臀部",
3607 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-hip-thrust-front.jpg",
3608 |             "muscle_module_en": "Barbell Hip Thrust",
3609 |             "muscle_ids": [
3610 |                 "glutes"
3611 |             ],
3612 |             "muscle_ids_zh": [
3613 |                 "臀大肌"
3614 |             ],
3615 |             "mechanic": "复合动作",
3616 |             "mechanic_raw": "复合动作",
3617 |             "mechanic_source": "from_dt:机制",
3618 |             "difficulty": "初学者",
3619 |             "notes": "",
3620 |             "equipment_type": "barbell",
3621 |             "equipment_type_zh": "杠铃",
3622 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-hip-thrust-front.mp4",
3623 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-hip-thrust-side.mp4"
3624 |         },
3625 |         {
3626 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-curl",
3627 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-curl",
3628 |             "exercise_name_zh": "杠铃弯举",
3629 |             "muscle_module_zh": "二头肌",
3630 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-curl-front.jpg",
3631 |             "muscle_module_en": "Barbell Curl",
3632 |             "muscle_ids": [
3633 |                 "biceps"
3634 |             ],
3635 |             "muscle_ids_zh": [
3636 |                 "肱二头肌"
3637 |             ],
3638 |             "mechanic": "孤立动作",
3639 |             "mechanic_raw": "孤立动作",
3640 |             "mechanic_source": "from_dt:机制",
3641 |             "difficulty": "中级",
3642 |             "notes": "",
3643 |             "equipment_type": "barbell",
3644 |             "equipment_type_zh": "杠铃",
3645 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-curl-front.mp4",
3646 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-curl-side.mp4"
3647 |         },
3648 |         {
3649 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-high-bar-squat",
3650 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-high-bar-squat",
3651 |             "exercise_name_zh": "杠铃高杠位深蹲",
3652 |             "muscle_module_zh": "臀部",
3653 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-high-bar-squat-side.jpg",
3654 |             "muscle_module_en": "Barbell High Bar Squat",
3655 |             "muscle_ids": [
3656 |                 "quads",
3657 |                 "glutes"
3658 |             ],
3659 |             "muscle_ids_zh": [
3660 |                 "股四头肌",
3661 |                 "臀大肌"
3662 |             ],
3663 |             "mechanic": "复合动作",
3664 |             "mechanic_raw": "复合动作",
3665 |             "mechanic_source": "from_dt:机制",
3666 |             "difficulty": "初学者",
3667 |             "notes": "",
3668 |             "equipment_type": "barbell",
3669 |             "equipment_type_zh": "杠铃",
3670 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-high-bar-squat-front.mp4",
3671 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-high-bar-squat-side.mp4"
3672 |         },
3673 |         {
3674 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-low-bar-good-morning",
3675 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-low-bar-good-morning",
3676 |             "exercise_name_zh": "杠铃低位挺腰",
3677 |             "muscle_module_zh": "腿后肌群",
3678 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-low-bar-good-morning-side.jpg",
3679 |             "muscle_module_en": "Barbell Low Bar Good Morning",
3680 |             "muscle_ids": [
3681 |                 "hamstrings",
3682 |                 "glutes"
3683 |             ],
3684 |             "muscle_ids_zh": [
3685 |                 "腘绳肌",
3686 |                 "臀大肌"
3687 |             ],
3688 |             "mechanic": "孤立动作",
3689 |             "mechanic_raw": "孤立动作",
3690 |             "mechanic_source": "from_dt:机制",
3691 |             "difficulty": "高级",
3692 |             "notes": "",
3693 |             "equipment_type": "barbell",
3694 |             "equipment_type_zh": "杠铃",
3695 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-low-bar-good-morning-front.mp4",
3696 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-low-bar-good-morning-side.mp4"
3697 |         },
3698 |         {
3699 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-bulgarian-split-squat",
3700 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-bulgarian-split-squat",
3701 |             "exercise_name_zh": "杠铃保加利亚分腿蹲",
3702 |             "muscle_module_zh": "臀部",
3703 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-bulgarian-split-squat-front.jpg",
3704 |             "muscle_module_en": "Barbell Bulgarian Split Squat",
3705 |             "muscle_ids": [
3706 |                 "quads",
3707 |                 "glutes"
3708 |             ],
3709 |             "muscle_ids_zh": [
3710 |                 "股四头肌",
3711 |                 "臀大肌"
3712 |             ],
3713 |             "mechanic": null,
3714 |             "mechanic_raw": null,
3715 |             "mechanic_source": null,
3716 |             "difficulty": "高级",
3717 |             "notes": "mechanic not found; dd candidates: ['高级', '找一个高度大致到膝盖处或低几英寸的箱子或长凳。（箱子越低，对灵活性要求越高。）', '可以把前脚的脚趾或脚背放在箱子上。将前脚朝前或略微向外转，膝盖与髋部同时屈曲。', '目标是让前腿达到与地面平行的深度（大腿后侧与地面平行）或更低。', '前脚越往前，髋部的活动范围（ROM）越大。前脚越往后，膝盖的活动范围（ROM）越大。', '高级']",
3718 |             "equipment_type": "barbell",
3719 |             "equipment_type_zh": "杠铃",
3720 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-bulgarian-split-squat-front.mp4",
3721 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-bulgarian-split-squat-side.mp4"
3722 |         },
3723 |         {
3724 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-roll-outs",
3725 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-roll-outs",
3726 |             "exercise_name_zh": "杠铃滚轮",
3727 |             "muscle_module_zh": "腹肌",
3728 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-roll-outs-front.jpg",
3729 |             "muscle_module_en": "Barbell Roll Outs",
3730 |             "muscle_ids": [
3731 |                 "abdominals"
3732 |             ],
3733 |             "muscle_ids_zh": [
3734 |                 "腹直肌"
3735 |             ],
3736 |             "mechanic": "孤立动作",
3737 |             "mechanic_raw": "孤立动作",
3738 |             "mechanic_source": "from_dt:机制",
3739 |             "difficulty": "高级",
3740 |             "notes": "",
3741 |             "equipment_type": "barbell",
3742 |             "equipment_type_zh": "杠铃",
3743 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-roll-outs-front.mp4",
3744 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-roll-outs-side.mp4"
3745 |         },
3746 |         {
3747 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-behind-the-back-wrist-curl",
3748 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-behind-the-back-wrist-curl",
3749 |             "exercise_name_zh": "杠铃背后手腕弯举",
3750 |             "muscle_module_zh": "前臂",
3751 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-behind-the-back-wrist-curl-front.jpg",
3752 |             "muscle_module_en": "Barbell Behind The Back Wrist Curl",
3753 |             "muscle_ids": [
3754 |                 "forearms"
3755 |             ],
3756 |             "muscle_ids_zh": [
3757 |                 "前臂肌群"
3758 |             ],
3759 |             "mechanic": null,
3760 |             "mechanic_raw": null,
3761 |             "mechanic_source": null,
3762 |             "difficulty": "中级",
3763 |             "notes": "mechanic not found; dd candidates: ['中级', '站直，双手与双脚均与肩同宽，正握将杠铃置于身后。', '缓慢以半圆弧向上卷动手腕。', '在动作最高点停住杠铃，然后缓慢将杠铃降回起始位置。', '中级']",
3764 |             "equipment_type": "barbell",
3765 |             "equipment_type_zh": "杠铃",
3766 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-behind-the-back-wrist-curl-front.mp4",
3767 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-behind-the-back-wrist-curl-side.mp4"
3768 |         },
3769 |         {
3770 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-squat",
3771 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-squat",
3772 |             "exercise_name_zh": "杠铃深蹲",
3773 |             "muscle_module_zh": "股四头肌",
3774 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-squat-side.jpg",
3775 |             "muscle_module_en": "Barbell Squat",
3776 |             "muscle_ids": [
3777 |                 "quads",
3778 |                 "glutes"
3779 |             ],
3780 |             "muscle_ids_zh": [
3781 |                 "股四头肌",
3782 |                 "臀大肌"
3783 |             ],
3784 |             "mechanic": "复合动作",
3785 |             "mechanic_raw": "复合动作",
3786 |             "mechanic_source": "from_dt:机制",
3787 |             "difficulty": "中级",
3788 |             "notes": "",
3789 |             "equipment_type": "barbell",
3790 |             "equipment_type_zh": "杠铃",
3791 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-squat-front.mp4",
3792 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-squat-side.mp4"
3793 |         },
3794 |         {
3795 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-wrist-curl",
3796 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-wrist-curl",
3797 |             "exercise_name_zh": "杠铃腕弯举",
3798 |             "muscle_module_zh": "前臂",
3799 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-wrist-curl-front.jpg",
3800 |             "muscle_module_en": "Barbell Wrist Curl",
3801 |             "muscle_ids": [
3802 |                 "forearms"
3803 |             ],
3804 |             "muscle_ids_zh": [
3805 |                 "前臂肌群"
3806 |             ],
3807 |             "mechanic": null,
3808 |             "mechanic_raw": null,
3809 |             "mechanic_source": null,
3810 |             "difficulty": "新手",
3811 |             "notes": "mechanic not found; dd candidates: ['新手', '用反握（掌心朝上）握住直杆。', '在平凳旁跪下，将前臂放在凳面上，手腕刚好悬在凳边外。', '让杠铃下压你的手腕，直到手腕伸直。', '把杠铃弯举到手腕完全弯曲为止。', '控制下放，然后重复。', '新手']",
3812 |             "equipment_type": "barbell",
3813 |             "equipment_type_zh": "杠铃",
3814 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-wrist-curl-front.mp4",
3815 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-wrist-curl-side.mp4"
3816 |         },
3817 |         {
3818 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-snatch-grip-romanian-deadlift",
3819 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-snatch-grip-romanian-deadlift",
3820 |             "exercise_name_zh": "杠铃抓举握距罗马尼亚硬拉",
3821 |             "muscle_module_zh": "臀部",
3822 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-snatch-grip-romanian-deadlift-front.jpg",
3823 |             "muscle_module_en": "Barbell Snatch Grip Romanian Deadlift",
3824 |             "muscle_ids": [
3825 |                 "hamstrings",
3826 |                 "glutes"
3827 |             ],
3828 |             "muscle_ids_zh": [
3829 |                 "腘绳肌",
3830 |                 "臀大肌"
3831 |             ],
3832 |             "mechanic": "复合动作",
3833 |             "mechanic_raw": "复合动作",
3834 |             "mechanic_source": "from_dt:机制",
3835 |             "difficulty": "高级",
3836 |             "notes": "",
3837 |             "equipment_type": "barbell",
3838 |             "equipment_type_zh": "杠铃",
3839 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-snatch-grip-romanian-deadlift-front.mp4",
3840 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-snatch-grip-romanian-deadlift-side.mp4"
3841 |         },
3842 |         {
3843 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-stiff-leg-deadlifts",
3844 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-stiff-leg-deadlifts",
3845 |             "exercise_name_zh": "杠铃直腿硬拉",
3846 |             "muscle_module_zh": "臀部",
3847 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-stiff-leg-deadlift-front.jpg",
3848 |             "muscle_module_en": "Barbell Stiff Leg Deadlifts",
3849 |             "muscle_ids": [
3850 |                 "hamstrings",
3851 |                 "glutes"
3852 |             ],
3853 |             "muscle_ids_zh": [
3854 |                 "腘绳肌",
3855 |                 "臀大肌"
3856 |             ],
3857 |             "mechanic": "复合动作",
3858 |             "mechanic_raw": "复合动作",
3859 |             "mechanic_source": "from_dt:机制",
3860 |             "difficulty": "中级",
3861 |             "notes": "",
3862 |             "equipment_type": "barbell",
3863 |             "equipment_type_zh": "杠铃",
3864 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-stiff-leg-deadlift-front.mp4",
3865 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-stiff-leg-deadlift-side.mp4"
3866 |         },
3867 |         {
3868 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-deadlift",
3869 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-deadlift",
3870 |             "exercise_name_zh": "杠铃硬拉",
3871 |             "muscle_module_zh": "斜方肌（中背）",
3872 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-deadlift-front.jpg",
3873 |             "muscle_module_en": "Barbell Deadlift",
3874 |             "muscle_ids": [
3875 |                 "hamstrings",
3876 |                 "glutes",
3877 |                 "lower-back"
3878 |             ],
3879 |             "muscle_ids_zh": [],
3880 |             "mechanic": "复合动作",
3881 |             "mechanic_raw": "复合动作",
3882 |             "mechanic_source": "from_dt:机制",
3883 |             "difficulty": "中级",
3884 |             "notes": "",
3885 |             "equipment_type": "barbell",
3886 |             "equipment_type_zh": "杠铃",
3887 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-deadlift-front.mp4",
3888 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-deadlift-side.mp4"
3889 |         },
3890 |         {
3891 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-situp",
3892 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-situp",
3893 |             "exercise_name_zh": "杠铃仰卧起坐",
3894 |             "muscle_module_zh": "腹肌",
3895 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-situp-side.jpg",
3896 |             "muscle_module_en": "Barbell Situp",
3897 |             "muscle_ids": [
3898 |                 "abdominals"
3899 |             ],
3900 |             "muscle_ids_zh": [
3901 |                 "腹直肌"
3902 |             ],
3903 |             "mechanic": "孤立动作",
3904 |             "mechanic_raw": "孤立动作",
3905 |             "mechanic_source": "from_dt:机制",
3906 |             "difficulty": "中级",
3907 |             "notes": "",
3908 |             "equipment_type": "barbell",
3909 |             "equipment_type_zh": "杠铃",
3910 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-situp-front.mp4",
3911 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-situp-side.mp4"
3912 |         },
3913 |         {
3914 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-front-squat-bodybuilding",
3915 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-front-squat-bodybuilding",
3916 |             "exercise_name_zh": "杠铃前蹲 健美",
3917 |             "muscle_module_zh": "臀部",
3918 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-front-squat-bodybuilding-side.jpg",
3919 |             "muscle_module_en": "Barbell Front Squat Bodybuilding",
3920 |             "muscle_ids": [
3921 |                 "quads",
3922 |                 "abdominals",
3923 |                 "glutes"
3924 |             ],
3925 |             "muscle_ids_zh": [
3926 |                 "股四头肌",
3927 |                 "腹直肌",
3928 |                 "臀大肌"
3929 |             ],
3930 |             "mechanic": "复合动作",
3931 |             "mechanic_raw": "复合动作",
3932 |             "mechanic_source": "from_dt:机制",
3933 |             "difficulty": "高级",
3934 |             "notes": "",
3935 |             "equipment_type": "barbell",
3936 |             "equipment_type_zh": "杠铃",
3937 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-front-squat-bodybuilding-front.mp4",
3938 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-front-squat-bodybuilding-side.mp4"
3939 |         },
3940 |         {
3941 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-sumo-deadlift",
3942 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-sumo-deadlift",
3943 |             "exercise_name_zh": "杠铃相扑硬拉",
3944 |             "muscle_module_zh": "臀部",
3945 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-sumo-deadlift-side_DdiUMo4.jpg",
3946 |             "muscle_module_en": "Barbell Sumo Deadlift",
3947 |             "muscle_ids": [
3948 |                 "quads",
3949 |                 "glutes"
3950 |             ],
3951 |             "muscle_ids_zh": [
3952 |                 "股四头肌",
3953 |                 "臀大肌"
3954 |             ],
3955 |             "mechanic": "复合动作",
3956 |             "mechanic_raw": "复合动作",
3957 |             "mechanic_source": "from_dt:机制",
3958 |             "difficulty": "中级",
3959 |             "notes": "",
3960 |             "equipment_type": "barbell",
3961 |             "equipment_type_zh": "杠铃",
3962 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-sumo-deadlift-front.mp4",
3963 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-sumo-deadlift-side.mp4"
3964 |         },
3965 |         {
3966 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-coan-deadlift",
3967 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-coan-deadlift",
3968 |             "exercise_name_zh": "Coan式杠铃硬拉",
3969 |             "muscle_module_zh": "臀部",
3970 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-coan-deadlift-front.jpg",
3971 |             "muscle_module_en": "Coan",
3972 |             "muscle_ids": [
3973 |                 "quads",
3974 |                 "glutes"
3975 |             ],
3976 |             "muscle_ids_zh": [
3977 |                 "股四头肌",
3978 |                 "臀大肌"
3979 |             ],
3980 |             "mechanic": "复合动作",
3981 |             "mechanic_raw": "复合动作",
3982 |             "mechanic_source": "from_dt:机制",
3983 |             "difficulty": "中级",
3984 |             "notes": "",
3985 |             "equipment_type": "barbell",
3986 |             "equipment_type_zh": "杠铃",
3987 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-coan-deadlift-front.mp4",
3988 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-coan-deadlift-side.mp4"
3989 |         },
3990 |         {
3991 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-laying-triceps-extensions",
3992 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-laying-triceps-extensions",
3993 |             "exercise_name_zh": "杠铃仰卧臂屈伸",
3994 |             "muscle_module_zh": "三头肌",
3995 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-laying-tricep-extensions-front.jpg",
3996 |             "muscle_module_en": "Barbell Laying Triceps Extensions",
3997 |             "muscle_ids": [
3998 |                 "triceps"
3999 |             ],
4000 |             "muscle_ids_zh": [
4001 |                 "肱三头肌"
4002 |             ],
4003 |             "mechanic": null,
4004 |             "mechanic_raw": null,
4005 |             "mechanic_source": null,
4006 |             "difficulty": "中级",
4007 |             "notes": "mechanic not found; dd candidates: ['中级', '平躺在卧推凳上，双手与肩同宽握杠铃。', '完全伸直肘部，直到杠铃位于胸部正上方。', '开始屈肘，让杠铃几乎接触额头。', '将肘部向后伸直回到起始位置，然后重复。', '中级']",
4008 |             "equipment_type": "barbell",
4009 |             "equipment_type_zh": "杠铃",
4010 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-laying-tricep-extensions-front.mp4",
4011 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-laying-tricep-extensions-side.mp4"
4012 |         },
4013 |         {
4014 |             "original_url": "https://musclewiki.com/zh-cn/exercise/landmine-alternating-lunge-to-chest-press",
4015 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/landmine-alternating-lunge-to-chest-press",
4016 |             "exercise_name_zh": "地雷杆交替弓步接胸前推举",
4017 |             "muscle_module_zh": "股四头肌",
4018 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-landmine-alternating-lunge-to-chest-press-side.jpg",
4019 |             "muscle_module_en": "Landmine Alternating Lunge To Chest Press",
4020 |             "muscle_ids": [
4021 |                 "quads",
4022 |                 "chest",
4023 |                 "glutes"
4024 |             ],
4025 |             "muscle_ids_zh": [
4026 |                 "股四头肌",
4027 |                 "胸大肌",
4028 |                 "臀大肌"
4029 |             ],
4030 |             "mechanic": "复合动作",
4031 |             "mechanic_raw": "复合动作",
4032 |             "mechanic_source": "from_dt:机制",
4033 |             "difficulty": "高级",
4034 |             "notes": "",
4035 |             "equipment_type": "barbell",
4036 |             "equipment_type_zh": "杠铃",
4037 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-alternating-lunge-to-chest-press-front.mp4",
4038 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-alternating-lunge-to-chest-press-side.mp4"
4039 |         },
4040 |         {
4041 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-close-grip-bench-press",
4042 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-close-grip-bench-press",
4043 |             "exercise_name_zh": "杠铃窄握卧推",
4044 |             "muscle_module_zh": "三头肌",
4045 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-close-grip-bench-press-side.jpg",
4046 |             "muscle_module_en": "Barbell Close Grip Bench Press",
4047 |             "muscle_ids": [
4048 |                 "chest",
4049 |                 "triceps"
4050 |             ],
4051 |             "muscle_ids_zh": [
4052 |                 "胸大肌",
4053 |                 "肱三头肌"
4054 |             ],
4055 |             "mechanic": "复合动作",
4056 |             "mechanic_raw": "复合动作",
4057 |             "mechanic_source": "from_dt:机制",
4058 |             "difficulty": "中级",
4059 |             "notes": "",
4060 |             "equipment_type": "barbell",
4061 |             "equipment_type_zh": "杠铃",
4062 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-close-grip-bench-press-front.mp4",
4063 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-close-grip-bench-press-side.mp4"
4064 |         },
4065 |         {
4066 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-front-rack-step-up",
4067 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-front-rack-step-up",
4068 |             "exercise_name_zh": "杠铃前架上台阶",
4069 |             "muscle_module_zh": "臀部",
4070 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-front-rack-step-up-front.jpg",
4071 |             "muscle_module_en": "Barbell Front Rack Step Up",
4072 |             "muscle_ids": [
4073 |                 "quads",
4074 |                 "glutes"
4075 |             ],
4076 |             "muscle_ids_zh": [
4077 |                 "股四头肌",
4078 |                 "臀大肌"
4079 |             ],
4080 |             "mechanic": "复合动作",
4081 |             "mechanic_raw": "复合动作",
4082 |             "mechanic_source": "from_dt:机制",
4083 |             "difficulty": "高级",
4084 |             "notes": "",
4085 |             "equipment_type": "barbell",
4086 |             "equipment_type_zh": "杠铃",
4087 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-front-rack-step-up-front.mp4",
4088 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-front-rack-step-up-side.mp4"
4089 |         },
4090 |         {
4091 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-overhead-tricep-extension",
4092 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-overhead-tricep-extension",
4093 |             "exercise_name_zh": "杠铃过顶三头肌伸展",
4094 |             "muscle_module_zh": "三头肌",
4095 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-overhead-tricep-extension-front.jpg",
4096 |             "muscle_module_en": "Barbell Overhead Tricep Extension",
4097 |             "muscle_ids": [
4098 |                 "triceps"
4099 |             ],
4100 |             "muscle_ids_zh": [
4101 |                 "肱三头肌"
4102 |             ],
4103 |             "mechanic": null,
4104 |             "mechanic_raw": null,
4105 |             "mechanic_source": null,
4106 |             "difficulty": "高级",
4107 |             "notes": "mechanic not found; dd candidates: ['高级', '把杠铃放到头顶位置时要小心。将肘部向前推，同时保持肘部内收。', '注意三头肌的拉伸感。将肘部伸直，直到拳头朝向天花板。', '高级']",
4108 |             "equipment_type": "barbell",
4109 |             "equipment_type_zh": "杠铃",
4110 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-overhead-tricep-extension-front.mp4",
4111 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-overhead-tricep-extension-side.mp4"
4112 |         },
4113 |         {
4114 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-overhead-press",
4115 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-overhead-press",
4116 |             "exercise_name_zh": "杠铃推举",
4117 |             "muscle_module_zh": "肩部",
4118 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-overhead-press-front.jpg",
4119 |             "muscle_module_en": "Barbell Overhead Press",
4120 |             "muscle_ids": [
4121 |                 "front-shoulders",
4122 |                 "triceps",
4123 |                 "rear-shoulders"
4124 |             ],
4125 |             "muscle_ids_zh": [
4126 |                 "三角肌前束",
4127 |                 "肱三头肌",
4128 |                 "三角肌后束"
4129 |             ],
4130 |             "mechanic": "复合动作",
4131 |             "mechanic_raw": "复合动作",
4132 |             "mechanic_source": "from_dt:机制",
4133 |             "difficulty": "中级",
4134 |             "notes": "",
4135 |             "equipment_type": "barbell",
4136 |             "equipment_type_zh": "杠铃",
4137 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-overhead-press-front.mp4",
4138 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-overhead-press-side.mp4"
4139 |         },
4140 |         {
4141 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-skullcrusher",
4142 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-skullcrusher",
4143 |             "exercise_name_zh": "杠铃仰卧臂屈伸",
4144 |             "muscle_module_zh": "三头肌",
4145 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-skullcrusher-front.jpg",
4146 |             "muscle_module_en": "Barbell Skullcrusher",
4147 |             "muscle_ids": [
4148 |                 "triceps"
4149 |             ],
4150 |             "muscle_ids_zh": [
4151 |                 "肱三头肌"
4152 |             ],
4153 |             "mechanic": null,
4154 |             "mechanic_raw": null,
4155 |             "mechanic_source": null,
4156 |             "difficulty": "中级",
4157 |             "notes": "mechanic not found; dd candidates: ['中级', '采用与肩同宽的握距。肘部屈曲。尽量保持肘部靠近身体。不要让肘部向外张开。', '将杠铃停在距离额头几英寸处，然后把肘部伸直回到上方。', '中级']",
4158 |             "equipment_type": "barbell",
4159 |             "equipment_type_zh": "杠铃",
4160 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-skullcrusher-front.mp4",
4161 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-skullcrusher-side.mp4"
4162 |         },
4163 |         {
4164 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-silverback-shrug",
4165 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-silverback-shrug",
4166 |             "exercise_name_zh": "杠铃 Silverback 耸肩",
4167 |             "muscle_module_zh": "斜方肌",
4168 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-silverback-shrug-side.jpg",
4169 |             "muscle_module_en": "Silverback",
4170 |             "muscle_ids": [
4171 |                 "traps",
4172 |                 "traps-middle"
4173 |             ],
4174 |             "muscle_ids_zh": [
4175 |                 "斜方肌上束",
4176 |                 "斜方肌中束"
4177 |             ],
4178 |             "mechanic": "孤立动作",
4179 |             "mechanic_raw": "孤立动作",
4180 |             "mechanic_source": "from_dt:机制",
4181 |             "difficulty": "中级",
4182 |             "notes": "",
4183 |             "equipment_type": "barbell",
4184 |             "equipment_type_zh": "杠铃",
4185 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-silverback-shrug-front.mp4",
4186 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-silverback-shrug-side.mp4"
4187 |         },
4188 |         {
4189 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-bench-press",
4190 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-bench-press",
4191 |             "exercise_name_zh": "杠铃卧推",
4192 |             "muscle_module_zh": "胸部",
4193 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-bench-press-front.jpg",
4194 |             "muscle_module_en": "Barbell Bench Press",
4195 |             "muscle_ids": [
4196 |                 "front-shoulders",
4197 |                 "chest",
4198 |                 "triceps",
4199 |                 "rear-shoulders"
4200 |             ],
4201 |             "muscle_ids_zh": [
4202 |                 "三角肌前束",
4203 |                 "胸大肌",
4204 |                 "肱三头肌",
4205 |                 "三角肌后束"
4206 |             ],
4207 |             "mechanic": "复合动作",
4208 |             "mechanic_raw": "复合动作",
4209 |             "mechanic_source": "from_dt:机制",
4210 |             "difficulty": "中级",
4211 |             "notes": "",
4212 |             "equipment_type": "barbell",
4213 |             "equipment_type_zh": "杠铃",
4214 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-bench-press-front.mp4",
4215 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-bench-press-side.mp4"
4216 |         },
4217 |         {
4218 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-step-up-balance",
4219 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-step-up-balance",
4220 |             "exercise_name_zh": "杠铃台阶上步（平衡）",
4221 |             "muscle_module_zh": "臀部",
4222 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-step-up-balance-front.jpg",
4223 |             "muscle_module_en": "Barbell Step Up Balance",
4224 |             "muscle_ids": [
4225 |                 "quads",
4226 |                 "glutes"
4227 |             ],
4228 |             "muscle_ids_zh": [
4229 |                 "股四头肌",
4230 |                 "臀大肌"
4231 |             ],
4232 |             "mechanic": "复合动作",
4233 |             "mechanic_raw": "复合动作",
4234 |             "mechanic_source": "from_dt:机制",
4235 |             "difficulty": "中级",
4236 |             "notes": "",
4237 |             "equipment_type": "barbell",
4238 |             "equipment_type_zh": "杠铃",
4239 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-step-up-balance-front.mp4",
4240 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-step-up-balance-side.mp4"
4241 |         },
4242 |         {
4243 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-side-step-up",
4244 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-side-step-up",
4245 |             "exercise_name_zh": "杠铃侧向登台",
4246 |             "muscle_module_zh": "臀部",
4247 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-side-step-up-front.jpg",
4248 |             "muscle_module_en": "Barbell Side Step Up",
4249 |             "muscle_ids": [
4250 |                 "quads",
4251 |                 "glutes"
4252 |             ],
4253 |             "muscle_ids_zh": [
4254 |                 "股四头肌",
4255 |                 "臀大肌"
4256 |             ],
4257 |             "mechanic": "复合动作",
4258 |             "mechanic_raw": "复合动作",
4259 |             "mechanic_source": "from_dt:机制",
4260 |             "difficulty": "中级",
4261 |             "notes": "",
4262 |             "equipment_type": "barbell",
4263 |             "equipment_type_zh": "杠铃",
4264 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-side-step-up-front.mp4",
4265 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-side-step-up-side.mp4"
4266 |         },
4267 |         {
4268 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-incline-bench-press",
4269 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-incline-bench-press",
4270 |             "exercise_name_zh": "杠铃上斜卧推",
4271 |             "muscle_module_zh": "胸部",
4272 |             "img": "https://media.musclewiki.com/media/uploads/og-male-Barbell-barbell-incline-bench-press-front.jpg",
4273 |             "muscle_module_en": "Barbell Incline Bench Press",
4274 |             "muscle_ids": [
4275 |                 "front-shoulders",
4276 |                 "chest",
4277 |                 "triceps",
4278 |                 "rear-shoulders"
4279 |             ],
4280 |             "muscle_ids_zh": [
4281 |                 "三角肌前束",
4282 |                 "胸大肌",
4283 |                 "肱三头肌",
4284 |                 "三角肌后束"
4285 |             ],
4286 |             "mechanic": "复合动作",
4287 |             "mechanic_raw": "复合动作",
4288 |             "mechanic_source": "from_dt:机制",
4289 |             "difficulty": "中级",
4290 |             "notes": "",
4291 |             "equipment_type": "barbell",
4292 |             "equipment_type_zh": "杠铃",
4293 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-incline-bench-press-front.mp4",
4294 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-incline-bench-press-side.mp4"
4295 |         },
4296 |         {
4297 |             "original_url": "https://musclewiki.com/zh-cn/exercise/barbell-step-up",
4298 |             "zh_url": "https://musclewiki.com/zh-cn/exercise/barbell-step-up",
4299 |             "exercise_name_zh": "杠铃上台阶",
4300 |             "muscle_module_zh": "股四头肌",
4301 |             "img": "https://media.musclewiki.com/media/uploads/og-male-barbell-step-up-front.jpg",
4302 |             "muscle_module_en": "Barbell Step Up",
4303 |             "muscle_ids": [
4304 |                 "quads",
4305 |                 "glutes"
4306 |             ],
4307 |             "muscle_ids_zh": [
4308 |                 "股四头肌",
4309 |                 "臀大肌"
4310 |             ],
4311 |             "mechanic": "复合动作",
4312 |             "mechanic_raw": "复合动作",
4313 |             "mechanic_source": "from_dt:机制",
4314 |             "difficulty": "初学者",
4315 |             "notes": "",
4316 |             "equipment_type": "barbell",
4317 |             "equipment_type_zh": "杠铃",
4318 |             "video-front": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-step-up-front.mp4",
4319 |             "video-side": "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-step-up-side.mp4"
4320 |         }
4321 |     ]
4322 | }
</content>
</file>
</files>
<environment_details>
# VSCode Visible Files
frontend\src\features\report\components\WorkoutReportModal.tsx,frontend\src\features\anatomy\constants\musclePaths.ts

# VSCode Open Tabs
../Users/Leo X1/.gemini/antigravity/brain/a7136be9-9ecc-4838-9eee-047d05bb0d4e/task.md,../Users/Leo X1/.gemini/antigravity/brain/a7136be9-9ecc-4838-9eee-047d05bb0d4e/walkthrough.md,../Users/Leo X1/.gemini/antigravity/brain/a49a8412-842a-4531-8408-31a3134b7fcb/walkthrough.md,../Users/Leo X1/.gemini/antigravity/brain/b9772538-bba1-4012-b82f-394ff47bc64e/walkthrough.md,../Users/Leo X1/.gemini/antigravity/brain/a49a8412-842a-4531-8408-31a3134b7fcb/implementation_plan.md,components/RoutineBuilder.tsx,services/RoutineAIService.ts,json.d.ts,data/comprehensive_exercises.ts,../Users/Leo X1/.gemini/antigravity/brain/b98bc365-3dbc-4cc3-a6b4-298fb960c167/implementation_plan.md,../Users/Leo X1/.gemini/antigravity/brain/b98bc365-3dbc-4cc3-a6b4-298fb960c167/walkthrough.md,../Users/Leo X1/.gemini/antigravity/brain/86adafe1-02b3-4d87-b107-18d8efbe8475/implementation_plan.md,components/SwipeableCard.tsx,../Users/Leo X1/.gemini/antigravity/brain/14133304-7a83-4026-b3b4-0db98619114b/walkthrough.md,services/SVGExportService.ts,services/VectorPDFExportService.ts,services/PNGExportService.ts,hooks/useAdaptiveHeight.ts,components/AdaptiveHeightContainer.tsx,docs/FUNCTIONALITY_TEST_REPORT.md

# Actively Running Terminals
## Terminal 1 (Active)
### Working Directory: `c:\zenfit`
### Original command: `cd frontend && npm run dev`
## Terminal 2 (Active)
### Working Directory: `c:\zenfit`
### Original command: `cd frontend && npm run dev 2>&1 | findstr /C:"Loaded" /C:"Total exercises"`

# Current Time
Current time in ISO 8601 UTC format: 2025-12-28T12:44:39.543Z
User time zone: Asia/Hong_Kong, UTC+8:00

# Current Cost
$0.00

# Current Mode
<slug>code</slug>
<name>Code</name>
<model>claude-sonnet-4-5-20250929</model>
<tool_format>xml</tool_format>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

完美！我找到了根本原因！

**问题确认：**

对比两个文件的数据结构：

**barbell-final-video.json (正常工作):**
- 第10行：`"muscle_module_en": "Barbell Bent Over Row"`  ✅

**cables-final-video.json (不工作):**
- **没有 `muscle_module_en` 字段！** ❌

而[`ExerciseNameMappingService.ts:82`](frontend/src/features/exercise/services/ExerciseNameMappingService.ts:82)的条件是：
```typescript
if (exercise.exercise_name_zh && exercise.muscle_module_en) {
```

因为cables文件中所有练习都缺少`muscle_module_en`字段，所以条件永远不满足，导致0个映射被加载！

**Root Cause总结：**
`cables-final-video.json`文件中的所有练习数据缺少`muscle_module_en`字段，这是ExerciseNameMappingService用来创建英文到中文映射的关键字段。

现在我需要向你确认下一步行动方案。

<attempt_completion>
<result>
已找到cables JSON库未加载的根本原因：

**问题：**
[`cables-final-video.json`](frontend/public/Library/cables-final-video.json:1)文件中的所有练习数据缺少`muscle_module_en`字段

**证据：**
- barbell文件有：`"muscle_module_en": "Barbell Bent Over Row"` ✅
- cables文件缺少：没有`muscle_module_en`字段 ❌

**影响：**
[`ExerciseNameMappingService.ts:82`](frontend/src/features/exercise/services/ExerciseNameMappingService.ts:82)的加载条件要求：
```typescript
if (exercise.exercise_name_zh && exercise.muscle_module_en)
```
由于cables文件中所有156个练习都缺少`muscle_module_en`，导致0个映射被创建。

**解决方案选项：**
1. 修复cables-final-video.json文件，为每个练习添加`muscle_module_en`字段
2. 修改ExerciseNameMappingService.ts，使用`exercise_name`作为备用映射键
3. 重新生成cables-final-video.json文件确保数据完整性

需要你决定采用哪种方案。
</result>
</attempt_completion>

