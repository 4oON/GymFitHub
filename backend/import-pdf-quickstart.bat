@echo off
echo ============================================================
echo ZenFit PDF数据导入 - 快速开始
echo ============================================================
echo.

echo 第一步：获取用户ID
echo.
cd backend
node get-user-id.js

echo.
echo ============================================================
echo 第二步：运行导入脚本
echo ============================================================
echo.
echo 请复制上面显示的用户ID，然后运行：
echo   cd backend
echo   node import-from-pdf.js [用户ID]
echo.
echo 或者导入特定文件：
echo   node import-from-pdf.js [用户ID] [PDF文件名]
echo.
echo ============================================================

pause
