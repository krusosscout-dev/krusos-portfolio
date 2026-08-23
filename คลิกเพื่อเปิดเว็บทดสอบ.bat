@echo off
chcp 65001 > nul
title Teacher E-Portfolio Local Server
echo ===================================================
echo   🎓 กำลังเปิดระบบ E-Portfolio สำหรับข้าราชการครู
echo ===================================================
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
