@echo off
echo ========================================
echo 🧹 清理所有远程分支（保留 master）
echo ========================================
echo.

echo 📋 当前远程分支列表：
git branch -r
echo.

echo ⚠️ 即将删除以下远程分支：
echo   - feature-gemini-mock
echo   - feature/phase0-anatomy-svg-tools
echo   - feature/phase1-auth-api
echo   - feature/phase1-backend-setup
echo   - feature/phase1-profile-api
echo   - feature/phase2-frontend-auth-profile
echo   - feature/phase3-production-ui
echo.

set /p confirm="确认删除？(y/n): "
if /i not "%confirm%"=="y" (
    echo ❌ 取消操作
    exit /b
)

echo.
echo 🗑️ 开始删除远程分支...
echo.

git push origin --delete feature-gemini-mock
git push origin --delete feature/phase0-anatomy-svg-tools
git push origin --delete feature/phase1-auth-api
git push origin --delete feature/phase1-backend-setup
git push origin --delete feature/phase1-profile-api
git push origin --delete feature/phase2-frontend-auth-profile
git push origin --delete feature/phase3-production-ui

echo.
echo 🧹 清理本地远程追踪分支...
git fetch --prune

echo.
echo ✅ 清理完成！当前分支状态：
git branch -a

echo.
echo 🎉 所有远程分支已清理完成！
pause