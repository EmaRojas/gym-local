@echo off
cd /d "%~dp0"

set "POCKETBASE_EXE=%CD%\pocketbase.exe"
if not exist "%POCKETBASE_EXE%" set "POCKETBASE_EXE=%USERPROFILE%\Downloads\pocketbase\pocketbase.exe"

echo Deteniendo PocketBase anterior si existe...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :8090 ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1

echo Iniciando PocketBase...
start /B "" "%POCKETBASE_EXE%" serve --http 127.0.0.1:8090 --origins "https://localhost:5173,https://gym-local.vercel.app"

echo Esperando a que PocketBase arranque...
timeout /t 3 /nobreak >nul

echo Iniciando Cloudflare Tunnel...
%USERPROFILE%\cloudflared.exe tunnel --url http://127.0.0.1:8090
