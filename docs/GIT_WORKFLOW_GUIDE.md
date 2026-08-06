# 🔀 ZenFit Git Workflow Guide - 新手友好版

## 📋 目录
1. [当前状态：Step 1 PR 准备](#step-1-pr-准备)
2. [完整 Phase 1 Git 节奏](#phase-1-git-节奏)
3. [常用 Git 命令速查](#git-命令速查)
4. [PR 自检清单](#pr-自检清单)

---

## 🎯 Step 1 PR 准备

### ✅ 是否适合开 PR？
**答案：非常适合！** 

理由：
- ✅ 后端项目骨架完整
- ✅ 服务器能正常运行
- ✅ 健康检查 API 测试通过
- ✅ 是一个独立、完整的功能单元
- ✅ 不会影响现有前端代码

### 📝 PR 信息设计

#### 分支名称
```
feature/phase1-backend-setup
```
✅ **你已经在这个分支上了！**

#### PR 标题
```
feat: Phase 1 Step 1 - 初始化后端项目骨架 (Express + TypeScript)
```

#### PR 描述模板
```markdown
## 🎯 目标
完成 Phase 1 Step 1：创建后端项目基础架构

## ✨ 新增内容
- 初始化 Express + TypeScript 后端项目
- 配置开发环境（nodemon, ts-node）
- 实现健康检查 API 端点
- 添加 CORS 和错误处理中间件
- 创建项目文档和环境配置示例

## 📁 文件结构
```
backend/
├── src/
│   ├── index.ts              # Express 服务器入口
│   ├── routes/
│   │   └── health.ts         # 健康检查路由
│   └── types/
│       └── index.ts          # TypeScript 类型定义
├── .env.example              # 环境变量示例
├── .gitignore                # Git 忽略文件
├── nodemon.json              # Nodemon 配置
├── package.json              # 项目依赖
├── tsconfig.json             # TypeScript 配置
└── README.md                 # 项目文档
```

## 🧪 测试验证
- [x] `npm install` 成功安装依赖
- [x] `npm run dev` 成功启动服务器
- [x] `GET /` 返回 API 信息
- [x] `GET /api/health` 返回健康状态
- [x] `GET /api/health/ping` 返回 pong 响应

## 🔗 相关文档
- `docs/FRONTEND_BACKEND_SEPARATION_ROADMAP.md` - 整体架构规划
- `docs/BACKEND_PHASE1_EXECUTION_PLAN.md` - Phase 1 详细计划
- `backend/README.md` - 后端项目说明

## 📌 注意事项
- `.env` 文件已添加到 `.gitignore`，不会提交敏感信息
- 服务器默认运行在 `http://localhost:3001`
- 开发环境使用 nodemon 自动重启

## 🚀 下一步
- Step 2: 配置数据库（Supabase/PostgreSQL + Prisma）
```

---

## 🚀 Step 1 提交流程（Windows 命令提示符）

### 步骤 1: 查看当前状态
```cmd
git status
```

**应该看到：**
```
On branch feature/phase1-backend-setup
Untracked files:
  backend/
```

---

### 步骤 2: 添加文件到暂存区

**方案 A：添加整个 backend 目录（推荐）**
```cmd
git add backend/
```

**方案 B：逐个添加（更精确）**
```cmd
git add backend/package.json
git add backend/tsconfig.json
git add backend/nodemon.json
git add backend/.gitignore
git add backend/.env.example
git add backend/src/
git add backend/README.md
```

**⚠️ 注意：不要添加 `.env` 文件！**

---

### 步骤 3: 确认暂存的文件
```cmd
git status
```

**应该看到：**
```
On branch feature/phase1-backend-setup
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        new file:   backend/.env.example
        new file:   backend/.gitignore
        new file:   backend/README.md
        new file:   backend/nodemon.json
        new file:   backend/package.json
        new file:   backend/src/index.ts
        new file:   backend/src/routes/health.ts
        new file:   backend/src/types/index.ts
        new file:   backend/tsconfig.json
```

**✅ 确认：**
- ✅ 有 9 个文件
- ✅ 没有 `.env` 文件
- ✅ 没有 `node_modules/` 目录

---

### 步骤 4: 提交到本地仓库
```cmd
git commit -m "feat: initialize backend project with Express and TypeScript

- Set up Express server with TypeScript
- Add health check API endpoints (/, /api/health, /api/health/ping)
- Configure CORS and error handling middleware
- Add development environment setup (nodemon, ts-node)
- Create project documentation and environment config example"
```

**应该看到：**
```
[feature/phase1-backend-setup xxxxxxx] feat: initialize backend project with Express and TypeScript
 9 files changed, XXX insertions(+)
 create mode 100644 backend/.env.example
 create mode 100644 backend/.gitignore
 ...
```

---

### 步骤 5: 推送到远程仓库
```cmd
git push -u origin feature/phase1-backend-setup
```

**应该看到：**
```
Enumerating objects: XX, done.
Counting objects: 100% (XX/XX), done.
...
To https://github.com/你的用户名/kilo-zenfit-vscode.git
 * [new branch]      feature/phase1-backend-setup -> feature/phase1-backend-setup
Branch 'feature/phase1-backend-setup' set up to track remote branch 'feature/phase1-backend-setup' from 'origin'.
```

---

### 步骤 6: 在 GitHub 上创建 PR

**方法 1：通过命令行打开浏览器**
```cmd
start https://github.com/你的用户名/kilo-zenfit-vscode/compare/main...feature/phase1-backend-setup
```

**方法 2：手动操作**
1. 打开 GitHub 仓库页面
2. 会看到黄色提示条："feature/phase1-backend-setup had recent pushes"
3. 点击 "Compare & pull request" 按钮
4. 填写 PR 标题和描述（复制上面的模板）
5. 点击 "Create pull request"

**应该看到：**
- PR 页面显示 9 个文件变更
- 所有文件都是绿色（新增）
- 没有冲突提示

---

## 📅 Phase 1 完整 Git 节奏

### Step 1: 后端项目骨架 ✅（当前）
```
分支：feature/phase1-backend-setup
提交：feat: initialize backend project with Express and TypeScript
PR：Phase 1 Step 1 - 初始化后端项目骨架
```

### Step 2: 数据库配置（下一步）
```
分支：feature/phase1-database-setup
提交示例：
  - feat: add Prisma ORM and database schema
  - feat: create users table migration
  - feat: add database connection service
PR：Phase 1 Step 2 - 配置数据库和 Prisma ORM
```

**从哪里开始：**
```cmd
# Step 1 PR 合并后
git checkout main
git pull origin main
git checkout -b feature/phase1-database-setup
```

### Step 3: 注册 API 实现
```
分支：feature/phase1-auth-api
提交示例：
  - feat: implement user registration endpoint
  - feat: add input validation middleware
  - test: add registration API tests
PR：Phase 1 Step 3 - 实现用户注册 API
```

### Step 4: 前端集成
```
分支：feature/phase1-frontend-integration
提交示例：
  - feat: create API client service
  - feat: integrate registration with backend
  - feat: add error handling for API calls
PR：Phase 1 Step 4 - 前端对接后端注册 API
```

---

## 💡 Commit 粒度建议

### ✅ 好的 Commit（推荐）

**单一职责，清晰描述：**
```
feat: add Express server with health check endpoints
feat: configure TypeScript and development environment
feat: add Prisma schema for users table
fix: correct CORS configuration for localhost
docs: update backend README with setup instructions
```

### ❌ 不好的 Commit（避免）

**太笼统：**
```
update files
fix bugs
add stuff
```

**太细碎：**
```
add comma
fix typo in comment
change spacing
```

### 📏 粒度原则

1. **一个 commit = 一个完整的小功能**
   - ✅ "添加健康检查 API"
   - ❌ "添加一个函数"

2. **相关的修改放在一起**
   - ✅ "配置 TypeScript + 添加类型定义"
   - ❌ 分成 10 个 commit

3. **每个 commit 都能独立运行**
   - ✅ 提交后代码不会报错
   - ❌ 提交后缺少依赖

---

## 🎯 Commit Message 格式

### 标准格式
```
<type>: <subject>

<body>（可选）

<footer>（可选）
```

### Type 类型
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构（不是新功能也不是修复）
- `test`: 添加测试
- `chore`: 构建工具、依赖更新

### 示例

**简单 commit：**
```
feat: add user registration endpoint
```

**详细 commit：**
```
feat: add user registration endpoint

- Implement POST /api/auth/register
- Add email and password validation
- Hash passwords with bcrypt
- Return JWT token on success

Closes #123
```

---

## ✅ PR 自检清单

### 提交前检查

#### 代码质量
- [ ] 代码能正常运行（`npm run dev` 无错误）
- [ ] 没有 TypeScript 错误
- [ ] 没有 console.log 调试代码
- [ ] 没有注释掉的代码块

#### 文件检查
- [ ] `.env` 文件**没有**被提交
- [ ] `node_modules/` **没有**被提交
- [ ] `.gitignore` 配置正确
- [ ] 所有新文件都已添加

#### 测试验证
- [ ] 手动测试所有 API 端点
- [ ] 浏览器能正常访问
- [ ] 没有 CORS 错误
- [ ] 错误处理正常工作

#### 文档完整
- [ ] README.md 更新
- [ ] 代码有必要的注释
- [ ] API 端点有说明
- [ ] 环境变量有示例（`.env.example`）

### PR 创建后检查

#### GitHub 页面
- [ ] PR 标题清晰
- [ ] PR 描述完整
- [ ] 文件变更列表正确
- [ ] 没有意外的文件变更
- [ ] 没有合并冲突

#### 代码审查
- [ ] 自己先审查一遍代码
- [ ] 检查 diff 是否符合预期
- [ ] 确认没有敏感信息泄露

---

## 🆘 常见问题和解决方案

### Q1: 不小心提交了 `.env` 文件怎么办？

**如果还没 push：**
```cmd
git reset HEAD backend/.env
git commit --amend
```

**如果已经 push：**
```cmd
git rm --cached backend/.env
git commit -m "chore: remove .env from version control"
git push
```

然后立即更改 `.env` 中的敏感信息（如 API Key）！

---

### Q2: 想修改最后一次 commit message

**如果还没 push：**
```cmd
git commit --amend -m "新的 commit message"
```

**如果已经 push：**
```cmd
git commit --amend -m "新的 commit message"
git push --force-with-lease
```
⚠️ 注意：`--force-with-lease` 会重写历史，只在自己的分支上使用！

---

### Q3: 想撤销最后一次 commit

**保留文件修改：**
```cmd
git reset --soft HEAD~1
```

**完全撤销（危险）：**
```cmd
git reset --hard HEAD~1
```

---

### Q4: 分支名字打错了

**重命名当前分支：**
```cmd
git branch -m 新分支名
```

**示例：**
```cmd
git branch -m feature/phase1-backend-setup
```

---

### Q5: 查看提交历史

**简洁版：**
```cmd
git log --oneline
```

**详细版：**
```cmd
git log
```

**图形化：**
```cmd
git log --graph --oneline --all
```

---

## 📚 Git 命令速查

### 基础操作
```cmd
# 查看状态
git status

# 查看分支
git branch

# 切换分支
git checkout 分支名

# 创建并切换分支
git checkout -b 新分支名

# 查看远程仓库
git remote -v
```

### 提交流程
```cmd
# 添加文件
git add 文件名
git add .                    # 添加所有文件（小心使用）

# 提交
git commit -m "commit message"

# 推送
git push
git push -u origin 分支名    # 首次推送
```

### 同步操作
```cmd
# 拉取最新代码
git pull

# 拉取特定分支
git pull origin main

# 查看远程分支
git branch -r
```

### 撤销操作
```cmd
# 撤销工作区修改
git checkout -- 文件名

# 撤销暂存
git reset HEAD 文件名

# 撤销 commit（保留修改）
git reset --soft HEAD~1

# 查看修改
git diff
```

---

## 🎓 学习建议

### 第一次使用 Git？

1. **先完成 Step 1 PR**（按本指南操作）
2. **观察 GitHub 上的变化**（理解 commit、branch、PR 的关系）
3. **Step 2 时尝试独立操作**（参考本指南）
4. **遇到问题先查"常见问题"章节**

### 进阶学习

- 学习 `git rebase`（整理 commit 历史）
- 学习 `git cherry-pick`（挑选特定 commit）
- 学习 `git stash`（临时保存修改）
- 使用 Git GUI 工具（如 GitHub Desktop、SourceTree）

---

## 📞 需要帮助？

如果遇到问题：

1. **先运行 `git status`** 查看当前状态
2. **复制完整的错误信息**
3. **说明你执行了什么操作**
4. **截图 GitHub 页面**（如果相关）

---

## ✨ 总结

### Step 1 现在要做的事：

```cmd
# 1. 添加文件
git add backend/

# 2. 确认文件
git status

# 3. 提交
git commit -m "feat: initialize backend project with Express and TypeScript

- Set up Express server with TypeScript
- Add health check API endpoints (/, /api/health, /api/health/ping)
- Configure CORS and error handling middleware
- Add development environment setup (nodemon, ts-node)
- Create project documentation and environment config example"

# 4. 推送
git push -u origin feature/phase1-backend-setup

# 5. 在 GitHub 创建 PR（使用上面的 PR 描述模板）
```

### 记住：
- ✅ 每个 Step 一个 PR
- ✅ Commit message 要清晰
- ✅ 提交前自检
- ✅ 不要提交 `.env` 和 `node_modules/`
- ✅ 遇到问题先查本指南

**祝你的第一个 PR 顺利！** 🎉