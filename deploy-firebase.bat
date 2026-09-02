@echo off
echo ===================================================
echo   Deploying Expensio to Firebase Hosting
echo ===================================================
echo.

echo [1/2] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed! Please fix build errors before deploying.
    pause
    exit /b 1
)

echo.
echo [2/2] Deploying to Firebase Hosting...
call firebase deploy --only hosting

if %errorlevel% neq 0 (
    echo.
    echo If Firebase is not logged in, please run:
    echo   firebase login
    echo and then run this script again!
    echo.
) else (
    echo.
    echo ===================================================
    echo   Deployment Successful!
    echo   Your updated app is now live on Firebase!
    echo ===================================================
)

echo.
pause
