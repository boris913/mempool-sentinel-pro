@echo off
chcp 65001 >nul
setlocal

REM Option 1: Utiliser Babel (recommandé si SWC ne télécharge pas)
REM Déjà configuré dans next.config.js avec swcMinify: false

echo ==========================================
echo  Mempool Sentinel Pro - Lancement Dev
echo ==========================================
echo.

REM Vérifier si node_modules existe
if not exist "node_modules" (
    echo Installation des dependances...
    npm install
    if errorlevel 1 (
        echo ERREUR: npm install a echoue
        pause
        exit /b 1
    )
)

echo Lancement du serveur de developpement...
echo.

REM Lancer Next.js
npm run dev

pause
