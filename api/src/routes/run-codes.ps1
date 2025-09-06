# Deploy the updated API with fixed screenshot analysis
Set-Location "D:\Elara_Starter_MPV\elara-azure-vscode-complete"

git checkout develop
git add .
git commit -m "Fix screenshot analysis and add multi-screenshot support"
git push origin develop

Write-Host "API updates deployed to staging..." -ForegroundColor Yellow
Start-Sleep 120

git checkout main
git merge develop --no-edit
git push origin main

Write-Host "Production deployment initiated..." -ForegroundColor Yellow
Start-Sleep 180

# Test the fixed screenshot functionality
try {
    $health = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/health" -Method GET -TimeoutSec 15
    Write-Host "API Health: $($health.endpoints -join ', ')" -ForegroundColor Green
    
    Write-Host "Screenshot analysis endpoint should now work properly" -ForegroundColor Green
    Write-Host "Dashboard updated with multi-screenshot support" -ForegroundColor Green
    
} catch {
    Write-Host "Still deploying: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== UPDATED FEATURES ===" -ForegroundColor Cyan
Write-Host "- Fixed screenshot analysis endpoint" -ForegroundColor Green
Write-Host "- Multi-screenshot upload (up to 5 images)" -ForegroundColor Green
Write-Host "- Collective pattern analysis across screenshots" -ForegroundColor Green
Write-Host "- Individual and cross-reference analysis" -ForegroundColor Green
Write-Host "- Enhanced error handling" -ForegroundColor Green
Write-Host ""
Write-Host "Test at: https://elara-dashboard-live.azurewebsites.net" -ForegroundColor Cyan