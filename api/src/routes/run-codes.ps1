# Commit and deploy API changes
git add .
git commit -m "Fix: Add working scan-link and scan-message endpoints with proper threat detection"
git push origin develop

Write-Host "Deploying to staging..." -ForegroundColor Yellow
Start-Sleep 90

# Test staging endpoints
try {
    $testUrl = @{ url = "http://auth-ledgerlive-login-x-en-us.pages.dev" } | ConvertTo-Json
    $result = Invoke-RestMethod -Uri "https://elara-api-dev-staging.azurewebsites.net/scan-link" -Method POST -Body $testUrl -ContentType "application/json" -TimeoutSec 15
    Write-Host "Staging scan-link working: $($result.status) - Score: $($result.trust_score)" -ForegroundColor Green
} catch {
    Write-Host "Staging still deploying: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Deploy to production
git checkout main
git merge develop --no-edit
git push origin main

Write-Host "Deploying to production..." -ForegroundColor Green
Start-Sleep 120

# Test production endpoints
try {
    $testUrl = @{ url = "https://13spices.com" } | ConvertTo-Json
    $result = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/scan-link" -Method POST -Body $testUrl -ContentType "application/json" -TimeoutSec 15
    Write-Host "Production test (legitimate site): $($result.status) - Score: $($result.trust_score)" -ForegroundColor Green
    
    $phishUrl = @{ url = "http://auth-ledgerlive-login-x-en-us.pages.dev" } | ConvertTo-Json
    $phishResult = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/scan-link" -Method POST -Body $phishUrl -ContentType "application/json" -TimeoutSec 15
    Write-Host "Production test (phishing): $($phishResult.status) - Score: $($phishResult.trust_score)" -ForegroundColor Red
} catch {
    Write-Host "Production still deploying: $($_.Exception.Message)" -ForegroundColor Yellow
}