@echo off
title Google Chrome - Antigravity Mode
echo ========================================================
echo Iniciando Google Chrome integrado ao Antigravity IDE...
echo Porta CDP: 9222
echo Perfil: C:\Users\Suporte\.gemini\chrome-profile
echo ========================================================
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir="C:\Users\Suporte\.gemini\chrome-profile" %*
