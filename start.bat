@echo off
title Hashibasha - Operation Management Platform
color 0A

echo.
echo  ============================================================
echo   Hashibasha - Operation Management Platform
echo   Starting all services...
echo  ============================================================
echo.

:: ── Check Node.js ────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo          Download from: https://nodejs.org
    pause
    exit /b 1
)

:: ── Check PostgreSQL ─────────────────────────────────────────
"C:\Program Files\PostgreSQL\17\bin\pg_isready.exe" -U postgres -q 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] PostgreSQL is not running.
    echo          Please start PostgreSQL service first.
    pause
    exit /b 1
)

set ROOT=%~dp0
cd /d "%ROOT%"

:: ── Install root deps if needed ──────────────────────────────
if not exist "node_modules" (
    echo  [SETUP] Installing root dependencies...
    call npm install --silent
)

:: ── Install service deps if needed ───────────────────────────
for %%S in (auth-service user-service notification-service org-service permission-service location-service language-service api-gateway) do (
    if not exist "server\%%S\node_modules" (
        echo  [SETUP] Installing %%S dependencies...
        cd /d "%ROOT%\server\%%S"
        call npm install --silent
        cd /d "%ROOT%"
    )
)

echo.
echo  [INFO] Launching services in separate windows...
echo.

:: ── Start each service in its own window ─────────────────────
start "Auth Service        :3003" cmd /k "cd /d "%ROOT%\server\auth-service" && npm run start:dev"
timeout /t 2 /nobreak >nul

start "User Service        :3002" cmd /k "cd /d "%ROOT%\server\user-service" && npm run start:dev"
timeout /t 2 /nobreak >nul

start "Notification Service:3004" cmd /k "cd /d "%ROOT%\server\notification-service" && npm run start:dev"
timeout /t 2 /nobreak >nul

start "Org Service         :3012" cmd /k "cd /d "%ROOT%\server\org-service" && npm run start:dev"
timeout /t 2 /nobreak >nul

start "Permission Service  :3005" cmd /k "cd /d "%ROOT%\server\permission-service" && npm run start:dev"
timeout /t 2 /nobreak >nul

start "Location Service    :3013" cmd /k "cd /d "%ROOT%\server\location-service" && npm run start:dev"
timeout /t 2 /nobreak >nul

start "Language Service    :3014" cmd /k "cd /d "%ROOT%\server\language-service" && npm run start:dev"
timeout /t 2 /nobreak >nul

:: ── Wait for services to boot before starting gateway ────────
echo  [INFO] Waiting for services to boot (15 seconds)...
timeout /t 15 /nobreak >nul

start "API Gateway         :3009" cmd /k "cd /d "%ROOT%\server\api-gateway" && npm run start:dev"
timeout /t 5 /nobreak >nul

:: ── Start Vite frontend ──────────────────────────────────────
start "Frontend (Vite)     :3001" cmd /k "cd /d "%ROOT%" && npm run dev"

:: ── Open browser ─────────────────────────────────────────────
echo  [INFO] Waiting for frontend to compile (10 seconds)...
timeout /t 10 /nobreak >nul

echo.
echo  ============================================================
echo   All services started!
echo.
echo   Frontend  : http://localhost:3001
echo   API GW    : http://localhost:3009
echo   Login     : admin@hashibasha.com / admin123
echo  ============================================================
echo.

start "" "http://localhost:3001"

echo  Press any key to close this launcher window.
echo  (All service windows will keep running)
pause >nul
