@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 20 或更新版本，并确保 node 在 PATH 中。
  pause
  exit /b 1
)
echo 请在浏览器打开 http://127.0.0.1:5173
node scripts/server.mjs
pause
