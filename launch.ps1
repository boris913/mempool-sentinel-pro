# Mempool Sentinel Pro - Lancement Dev
# Option pour contourner le probleme de certificat SWC

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Mempool Sentinel Pro - Lancement Dev" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verifier node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dependances..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERREUR: npm install a echoue" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Lancement du serveur de developpement..." -ForegroundColor Green
Write-Host ""

# Lancer Next.js
npm run dev
