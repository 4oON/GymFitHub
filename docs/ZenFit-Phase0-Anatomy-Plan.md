# ZenFit Phase 0 + Phase 1 统一执行计划

目标：
- Phase 0：先解决肌肉解剖图反复返工的问题，做成可视化可复用的前端工具。
- Phase 1：在不影响现有前端的前提下，搭好最基础的后端骨架，为后面前后端分离做准备。

开发总原则（请严格遵守）：
1. 最小改动原则：
   - 新功能优先放到新文件。
   - SVG 工具放在 src/dev 下面，不随便改现有 feature 代码。
   - 后端代码全部放在 backend/ 目录，不影响现有前端运行。
2. 逐步提交原则：
   - 每次只改 1–2 个文件。
   - 每完成一个小步骤：npm run dev 测试 → 通过后再 git commit。
   - 如果某一步卡住或报错，先停下，不要继续大面积修改。
3. 测试优先：
   - 前端：npm run dev，无红色报错，核心页面能打开。
   - 后端：能启动服务器，/api/health 返回正常 JSON。
4. 尽量“能不碰就不碰”现有代码：
   - 只有在无法完成功能时，才修改已有文件，并在注释中标记原因。

==================================================
Phase 0：肌肉解剖图模块工具化（纯前端，预计 2–3 天）
==================================================

目标：让肌肉解剖图的开发和修改变成“拖拽 + 一键导出”，避免每次手写 SVG / 频繁返工。

--------------------
Step 0.0 环境确认
--------------------
1. 当前项目结构中已经存在：
   - src/
   - src/features/anatomy/（肌肉相关代码）
   - src/dev/（开发工具目录）
   - docs/（文档目录）

2. 不对现有 anatomy 逻辑做大改动，只是新增工具文件。

--------------------------
Step 0.1 创建 SVG 编辑器组件
--------------------------
文件：src/dev/SVGPathEditor.tsx（如果已有 dev/components 目录，可放入 dev/components）

要求：
- 这是一个开发者工具页面组件，不影响正式用户 UI。
- 基本功能：
  - 从现有 musclePaths 常量中读取路径数据（只读）。
  - 在页面上渲染整张肌肉解剖 SVG。
  - 支持点击某个肌肉区域高亮显示（方便确认 ID / 区域）。

实现建议：
- 初始版本只需要：
  - 一个 <svg> 容器。
  - 根据 musclePaths 绘制 path / polygon。
  - 点击时在右侧面板显示：肌肉 id、路径字符串等。

测试：
- npm run dev
- 在某个调试入口（例如已有的 DeveloperTestPanel 或临时在 App.tsx 中加一个简单入口）挂载 SVGPathEditor。
- 能看到整张图，点击某个肌肉能高亮，并在右侧看到信息。

提交：
- git commit -m "Phase 0.1: add basic SVGPathEditor for anatomy"


--------------------------------
Step 0.2 增加路径点可视化与编辑
--------------------------------
仍然只改：src/dev/SVGPathEditor.tsx

功能扩展：
- 将路径拆分成点（比如处理简单的 polyline 或简化后的 path）。
- 在 SVG 图层上显示这些点（小圆点）。
- 支持在编辑模式下拖拽点，更新当前内存中的路径数据。
- 拖拽后的效果要能实时反映在 SVG 预览中。

注意：
- 此阶段只在内存中修改数据，不写回 musclePaths 文件。
- 不改动 src/features/anatomy/constants/musclePaths.ts。

测试：
- 拖动某个肌肉的点，形状发生变化，但刷新页面后恢复原样（说明还没写回文件）。

提交：
- git commit -m "Phase 0.2: enable point-level editing in SVGPathEditor"


-------------------------------
Step 0.3 一键导出 TS 常量文件
-------------------------------
修改：src/dev/SVGPathEditor.tsx（如有需要，可增加一个小工具文件，例如 src/dev/exportMusclePaths.ts）

功能：
- 在编辑器中增加一个按钮，例如“导出 musclePaths.ts”。
- 点击后，将内存中的最新路径数据格式化为 TypeScript 源码字符串。
- 覆盖写入到：src/features/anatomy/constants/musclePaths.ts。
- 写入后给出简单提示，例如“导出成功，请刷新页面验证”。

注意：
- 如需 Node 能力导出文件，可以通过简单的 API 或使用浏览器下载的方式，具体实现由你（agent）选择。
- 不要在这个步骤顺便重构别的 anatomy 代码。

测试：
1. 打开编辑器，修改某一块肌肉的路径。
2. 点击“导出”。
3. 查看 src/features/anatomy/constants/musclePaths.ts 文件内容已更新。
4. 正常运行 npm run dev，打开正式页面，确认解剖图使用的是新路径。

提交：
- git commit -m "Phase 0.3: support exporting edited muscle paths to musclePaths.ts"


-----------------------------
Step 0.4 基础验证与安全护栏
-----------------------------

目的：避免导出错误路径导致正式页面直接崩溃。

在 SVGPathEditor 中增加：
- 导出前检查：
  - 路径字符串是否为空。
  - 是否为合法的 SVG path（可用 try-catch 或简单正则做基础校验）。
- 如果校验失败：
  - 阻止导出。
  - 在界面上显示清晰的错误提示（哪一个肌肉 id 有问题）。

测试：
- 人为把某个路径改成明显非法的字符串。
- 点击“导出”时，应该看到错误提示，并且 musclePaths.ts 不被覆盖。

提交：
- git commit -m "Phase 0.4: add basic validation before exporting muscle paths"


==================================================
Phase 1：后端基础骨架搭建（Node.js + Express，预计 2–3 天）
==================================================

目标：在不影响当前前端的前提下，新建一个独立的 backend 工程，用来承接后续 AI、业务逻辑、数据库等工作。

说明：
- 这一阶段只搭“骨架”：能跑、能返回一个简单的 JSON。
- 先不连接数据库，先不改前端调用逻辑。
- 所有后端文件放在项目根目录下的 backend/ 文件夹中。

-------------------------
Step 1.0 创建 backend 目录
-------------------------
操作：
- 在项目根目录创建文件夹：backend/
- 在 backend/ 中创建基础文件结构：
  - backend/package.json
  - backend/tsconfig.json（如果使用 TypeScript）
  - backend/src/server.ts
  - backend/src/routes/
  - backend/src/middleware/
  - backend/src/config/

注意：
- 不要修改现有的前端 package.json、src/ 等目录。

提交：
- git commit -m "Phase 1.0: create backend skeleton directory structure"


-------------------------
Step 1.1 初始化 Node 项目
-------------------------
在 backend/ 目录内执行（由你来执行命令）：
- npm init -y
- 安装基础依赖：
  - npm install express cors morgan dotenv
- 如果使用 TypeScript：
  - npm install -D typescript ts-node @types/node @types/express @types/morgan
  - 初始化 tsconfig：npx tsc --init（在 backend/ 内执行）

server.ts 基本要求：
- 创建一个 Express 应用。
- 读取 PORT（优先使用 process.env.PORT，否则默认 3001）。
- 添加一个最简单的路由：GET /api/health 返回 { status: "ok" }。
- 启动后在控制台输出“Backend server running on port XXX”。

测试：
- 在 backend/ 目录运行启动命令（例如 npm run dev 或 npm start，根据你的脚本设置）。
- 浏览器访问 http://localhost:3001/api/health
- 看到 JSON：{ "status": "ok" }。

提交：
- git commit -m "Phase 1.1: init Node/Express backend with /api/health"


-------------------------
Step 1.2 配置基础中间件
-------------------------
修改：backend/src/server.ts（以及新增所需文件）

需求：
- 启用 CORS，允许来自当前前端地址（例如 http://localhost:5173）的请求。
- 使用 morgan 做基础请求日志。
- 使用 express.json() 解析 JSON 请求体。
- 提供一个统一的错误处理中间件（简单版本即可：打印错误并返回 500）。

可以新增：
- backend/src/middleware/errorHandler.ts
- backend/src/config/environment.ts（封装 PORT、NODE_ENV 等）

测试：
- 启动后端。
- 访问 /api/health，确认仍然正常。
- 控制台能看到 morgan 打印的访问日志。

提交：
- git commit -m "Phase 1.2: add CORS, logging and basic error handling"


-------------------------
Step 1.3 规划 API 命名空间
-------------------------
在不真正实现业务逻辑的前提下，先规划路由结构，只返回占位响应，方便后续 Phase 2+ 逐步落地。

建议路由文件：
- backend/src/routes/health.routes.ts
- backend/src/routes/ai.routes.ts
- backend/src/routes/workouts.routes.ts
- backend/src/routes/profile.routes.ts

在 server.ts 中：
- 统一挂载：
  - app.use("/api/health", healthRouter)
  - app.use("/api/ai", aiRouter)
  - app.use("/api/workouts", workoutsRouter)
  - app.use("/api/profile", profileRouter)

当前仅需要：
- /api/ai/test           → 返回 { ok: true, message: "ai placeholder" }
- /api/workouts/test     → 返回 { ok: true, message: "workouts placeholder" }
- /api/profile/test      → 返回 { ok: true, message: "profile placeholder" }

测试：
- 后端启动后：
  - GET /api/ai/test
  - GET /api/workouts/test
  - GET /api/profile/test
- 均能返回预期 JSON，占位字符串即可。

提交：
- git commit -m "Phase 1.3: add placeholder routes for ai, workouts, profile"


-------------------------
Step 1.4 前端基础连通性检查（只测试，不重构）
-------------------------
目标：确认前端可以请求到新建的后端，而不大改现有前端逻辑。

操作建议：
- 临时在前端某个 dev 工具入口（例如 src/dev 下，新建一个简单组件）中，用 fetch 或 axios 调用：
  - GET http://localhost:3001/api/health
- 在浏览器 Console 打印返回结果。
- 不要在这一阶段就重构真正的业务调用（例如 geminiService、训练记录等），只做“能连通”的验证。

测试：
- 前端 npm run dev 正常。
- 打开该 dev 组件页面，可以看到从后端返回的 JSON。

提交：
- git commit -m "Phase 1.4: verify frontend can reach new backend /api/health"


==================================================
收尾与下一步
==================================================

当以下条件都满足时，视为 Phase 0 + Phase 1 完成：
- 你已经可以在 SVGPathEditor 中方便地查看和编辑肌肉解剖图，并一键导出到 musclePaths.ts。
- 导出前有基本的校验，避免错误路径直接写入。
- backend/ 目录中的 Node/Express 服务可以独立启动，/api/health 和一些 test 路由能正常返回。
- 前端已经通过简单的 dev 组件验证，可以访问新后端的 /api/health。

下一步建议：
- Phase 2：为后端接入数据库（PostgreSQL + Prisma 或你选定的方案）。
- Phase 3：把 AI 调用（Gemini 等）从前端迁移到后端 /api/ai 下。

（本文件为纯文本计划，可直接保存为 Phase0-Phase1-Plan.txt 或复制给 Agent 按步骤执行。）
