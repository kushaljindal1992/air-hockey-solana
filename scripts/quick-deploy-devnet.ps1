# Air Hockey Escrow - Quick Devnet Deployment (PowerShell)
# For Windows users via WSL

Write-Host "🚀 Air Hockey Escrow - Devnet Deployment (WSL)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if WSL is available
try {
    wsl --status | Out-Null
} catch {
    Write-Host "❌ WSL not detected. Please install WSL first." -ForegroundColor Red
    exit 1
}

# Navigate to project directory in WSL
$projectPath = "/home/pratham/escrow-fee"

Write-Host "📍 Navigating to project directory..." -ForegroundColor Yellow
Write-Host ""

# Run deployment commands in WSL
wsl bash -c "cd $projectPath && chmod +x scripts/deploy-devnet.sh && ./scripts/deploy-devnet.sh"

Write-Host ""
Write-Host "✅ Deployment process complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To check status, run:" -ForegroundColor Cyan
Write-Host "  wsl bash -c 'cd $projectPath && ts-node scripts/check-status.ts'" -ForegroundColor White
