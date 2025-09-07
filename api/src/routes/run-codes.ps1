# Deploy API first
Set-Location "D:\Elara_Starter_MPV\elara-azure-vscode-complete"

if (Test-Path "elara-complete.zip") { Remove-Item "elara-complete.zip" -Force }
tar.exe -a -c -f elara-complete.zip -C api .

az webapp deploy -g rg-elara-dev -n elara-api-dev --src-path "elara-complete.zip" --type zip --restart true --clean true

Write-Host "Deploying complete API..." -ForegroundColor Green
Start-Sleep 120

# Test API
try {
    $health = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/health" -Method GET -TimeoutSec 20
    Write-Host "API working: $($health.provider)" -ForegroundColor Green
    Write-Host "Features: $($health.features -join ', ')" -ForegroundColor White
    
    $testUrl = @{ url = "http://auth-test.com" } | ConvertTo-Json
    $scanResult = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/scan-link" -Method POST -Body $testUrl -ContentType "application/json"
    Write-Host "Scan working: $($scanResult.status)" -ForegroundColor Green
    
} catch {
    Write-Host "API test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Build and deploy dashboard
Set-Location web
npm run build

Set-Location dist
if (Test-Path "../dashboard-complete.zip") { Remove-Item "../dashboard-complete.zip" -Force }
tar.exe -a -c -f ../dashboard-complete.zip .

az webapp deploy -g rg-elara-dev -n elara-dashboard-live --src-path "../dashboard-complete.zip" --type zip --restart true

Write-Host "Deploying complete dashboard..." -ForegroundColor Green
Start-Sleep 90

# Commit to GitHub
Set-Location "D:\Elara_Starter_MPV\elara-azure-vscode-complete"
git checkout develop
git add .
git commit -m "Complete Elara MVP v2.0 - Full features: URL scan, message scan, multi-file upload, screenshot OCR analysis"
git push origin develop

# Deploy to production
git checkout main
git merge develop --no-edit
git push origin main

Write-Host ""
Write-Host "COMPLETE ELARA MVP v2.0 DEPLOYED!" -ForegroundColor Green
Write-Host "Dashboard: https://elara-dashboard-live.azurewebsites.net" -ForegroundColor Cyan
Write-Host "API: https://elara-api-dev.azurewebsites.net" -ForegroundColor Cyan
Write-Host ""
Write-Host "Features deployed:" -ForegroundColor White
Write-Host "- URL threat detection" -ForegroundColor White
Write-Host "- Message scam analysis" -ForegroundColor White
Write-Host "- Multiple file upload" -ForegroundColor White
Write-Host "- Screenshot OCR analysis" -ForegroundColor White
Write-Host "- AI-powered assessment" -ForegroundColor White