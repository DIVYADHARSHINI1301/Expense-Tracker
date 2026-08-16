@echo off
echo ========================================
echo   ExpenseTracker Deployment Script
echo ========================================
echo.

echo [1/3] Building your app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo Build completed successfully!
echo.

echo [2/3] Choose deployment platform:
echo.
echo 1. Vercel (Recommended - Fastest)
echo 2. Netlify
echo 3. Firebase Hosting
echo 4. Skip deployment (just build)
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Deploying to Vercel...
    echo.
    echo Installing Vercel CLI if needed...
    call npm install -g vercel
    echo.
    echo Starting deployment...
    call vercel --prod
    echo.
    echo ========================================
    echo   Deployment Complete!
    echo ========================================
    echo.
    echo Your app is now live!
    echo Copy the URL above and open it on your mobile.
    echo Then tap "Add to Home Screen" to install!
    echo.
) else if "%choice%"=="2" (
    echo.
    echo Deploying to Netlify...
    echo.
    echo Installing Netlify CLI if needed...
    call npm install -g netlify-cli
    echo.
    echo Starting deployment...
    call netlify deploy --prod
    echo.
    echo ========================================
    echo   Deployment Complete!
    echo ========================================
    echo.
    echo Your app is now live!
    echo Copy the URL above and open it on your mobile.
    echo Then tap "Add to Home Screen" to install!
    echo.
) else if "%choice%"=="3" (
    echo.
    echo Deploying to Firebase...
    echo.
    echo Installing Firebase CLI if needed...
    call npm install -g firebase-tools
    echo.
    echo Logging in to Firebase...
    call firebase login
    echo.
    echo Starting deployment...
    call firebase deploy --only hosting
    echo.
    echo ========================================
    echo   Deployment Complete!
    echo ========================================
    echo.
    echo Your app is now live!
    echo Copy the URL above and open it on your mobile.
    echo Then tap "Add to Home Screen" to install!
    echo.
) else if "%choice%"=="4" (
    echo.
    echo Build completed. Skipping deployment.
    echo.
    echo To deploy later, run:
    echo   vercel --prod
    echo   OR
    echo   netlify deploy --prod
    echo   OR
    echo   firebase deploy --only hosting
    echo.
) else (
    echo Invalid choice!
    pause
    exit /b 1
)

echo [3/3] Next Steps:
echo.
echo 1. Open icon-generator.html in browser
echo 2. Download all icon sizes
echo 3. Save icons to public/ folder
echo 4. Run this script again to redeploy with icons
echo 5. Open your app URL on mobile
echo 6. Tap "Add to Home Screen"
echo 7. Enjoy your beautiful app icon!
echo.
echo ========================================
echo   Thank you for using ExpenseTracker!
echo ========================================
echo.
pause
