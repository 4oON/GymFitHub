# GymFitHub (GFH) - iOS App Project

## 项目概述
GymFitHub 是 kilo-zenfit 的 iOS 原生版本，使用 Capacitor 包装 React 前端。

## 仓库关系
- **本仓库 (GFH)**: iOS 前端 + 后端代码的主开发仓库
- **kilo-zenfit**: 网页版仓库，Railway 后端部署从这里触发
- **同步机制**: push 到 GFH main 分支时，GitHub Action 自动将 `backend/` 同步到 kilo-zenfit

## 开发约束
1. **后端兼容性**: 修改 `backend/` 下的 API 时，必须确保网页端 (kilo-zenfit frontend) 和 iOS 端 (GFH frontend) 都能正常使用
2. **不破坏网页版**: 任何后端修改不能导致 Vercel 上的网页版功能异常
3. **CORS**: 后端必须保持 `capacitor://localhost` 和所有 Vercel URL 的 CORS 白名单
4. **数据库**: 使用 kilo-zenfit 的 Supabase PostgreSQL，不要创建新的数据库

## 技术栈
- iOS: Capacitor 8.5 + Swift
- 前端: React + Vite + TailwindCSS
- 后端: Express + Prisma (Railway 部署)
- 数据库: Supabase PostgreSQL

## 重要文件
- `frontend/ios/` - Xcode 项目
- `frontend/src/` - React 前端源码
- `backend/` - Express 后端源码
- `frontend/capacitor.config.ts` - Capacitor 配置
