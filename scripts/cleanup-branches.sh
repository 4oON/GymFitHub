#!/bin/bash

echo "🧹 开始清理 Git 分支..."

# 1. 确保在 master 分支
echo "📍 切换到 master 分支..."
git checkout master

# 2. 拉取最新代码
echo "⬇️ 拉取最新代码..."
git pull origin master

# 3. 查看已合并的分支
echo "📋 已合并的分支："
git branch --merged master

# 4. 删除本地已合并分支
echo "🗑️ 删除本地分支..."
git branch -d feature/phase2-frontend-auth-profile 2>/dev/null && echo "✅ 删除 phase2 分支" || echo "⚠️ phase2 分支不存在或未合并"
git branch -d feature/phase3-production-ui 2>/dev/null && echo "✅ 删除 phase3 分支" || echo "⚠️ phase3 分支不存在或未合并"

# 5. 删除远程分支
echo "🌐 删除远程分支..."
git push origin --delete feature/phase2-frontend-auth-profile 2>/dev/null && echo "✅ 删除远程 phase2 分支" || echo "⚠️ 远程 phase2 分支不存在"
git push origin --delete feature/phase3-production-ui 2>/dev/null && echo "✅ 删除远程 phase3 分支" || echo "⚠️ 远程 phase3 分支不存在"

# 6. 清理远程追踪分支
echo "🧹 清理远程追踪分支..."
git fetch --prune

# 7. 显示最终状态
echo "✅ 清理完成！当前分支状态："
git branch -a

echo "🎉 分支清理完成！"
