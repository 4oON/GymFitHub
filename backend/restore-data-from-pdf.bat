@echo off
chcp 65001 >nul
echo ============================================================
echo ZenFit 数据恢复工具 - 从PDF恢复数据
echo ============================================================
echo.
echo 这个工具会：
echo   1. 获取你的用户ID
echo   2. 从C:\project\report目录导入所有PDF文件
echo   3. 将数据导入到数据库
echo.
echo ============================================================
echo.

cd /d "%~dp0"

echo 第一步：获取用户ID...
echo.
node get-user-id.js > temp_user_id.txt 2>&1

type temp_user_id.txt

echo.
echo ============================================================
echo 第二步：从PDF导入数据
echo ============================================================
echo.

REM 从输出中提取用户ID（假设第一个用户）
for /f "tokens=2 delims=:" %%a in ('findstr /C:"用户ID:" temp_user_id.txt') do (
    set USER_ID=%%a
    goto :found_id
)

:found_id
REM 去除空格
set USER_ID=%USER_ID: =%

if "%USER_ID%"=="" (
    echo ❌ 错误：无法获取用户ID
    echo 请手动运行：
    echo   cd backend
    echo   node get-user-id.js
    echo   node import-from-pdf.js [你的用户ID]
    pause
    exit /b 1
)

echo 使用用户ID: %USER_ID%
echo.
echo 开始导入PDF文件...
echo.

node import-from-pdf.js %USER_ID%

del temp_user_id.txt

echo.
echo ============================================================
echo 导入完成！
echo ============================================================
echo.
echo 下一步：
echo   1. 打开浏览器访问 http://localhost:5173/refresh-clean-data.html
echo   2. 点击"清除缓存并重新加载干净数据"
echo   3. 刷新前端页面查看恢复的数据
echo.
echo ============================================================

pause
