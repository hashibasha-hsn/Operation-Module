@echo off
title Hashibasha - Stop All Services
color 0C

echo.
echo  ============================================================
echo   Stopping all Hashibasha services...
echo  ============================================================
echo.

:: Kill Node processes on known ports
for %%P in (3001 3002 3003 3004 3005 3009 3012 3013 3014) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%%P " ^| findstr "LISTENING" 2^>nul') do (
        echo  [STOP] Killing process on port %%P (PID %%a)
        taskkill /F /PID %%a >nul 2>&1
    )
)

:: Close all service terminal windows by title
taskkill /F /FI "WindowTitle eq Auth Service*" >nul 2>&1
taskkill /F /FI "WindowTitle eq User Service*" >nul 2>&1
taskkill /F /FI "WindowTitle eq Notification Service*" >nul 2>&1
taskkill /F /FI "WindowTitle eq Org Service*" >nul 2>&1
taskkill /F /FI "WindowTitle eq Permission Service*" >nul 2>&1
taskkill /F /FI "WindowTitle eq Location Service*" >nul 2>&1
taskkill /F /FI "WindowTitle eq Language Service*" >nul 2>&1
taskkill /F /FI "WindowTitle eq API Gateway*" >nul 2>&1
taskkill /F /FI "WindowTitle eq Frontend*" >nul 2>&1

echo.
echo  [DONE] All services stopped.
echo.
pause
