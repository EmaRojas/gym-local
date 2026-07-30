@echo off
cd /d "%~dp0"

echo Iniciando PocketBase...
start /B "" pocketbase.exe serve --http 127.0.0.1:8090

echo Esperando a que PocketBase arranque...
timeout /t 3 /nobreak >nul

echo Iniciando Cloudflare Tunnel...
%USERPROFILE%\cloudflared.exe tunnel --url http://127.0.0.1:8090
