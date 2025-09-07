# Commit and deploy the changes
git add .
git commit -m "Add scan-link and scan-message endpoints for dashboard functionality"
git push origin develop

Write-Host "Deploying to staging..." -ForegroundColor Yellow
Start-Sleep 90

# Test staging deployment
try {
    $testUrl = @{ url = "https://example.com" } | ConvertTo-Json
    $result = Invoke-RestMethod -Uri "https://elara-api-dev-staging.azurewebsites.net/scan-link" -Method POST -Body $testUrl -ContentType "application/json" -TimeoutSec 15
    Write-Host "Staging scan-link working: $($result.status)" -ForegroundColor Green
} catch {
    Write-Host "Staging still deploying: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Deploy to production
git checkout main
git merge develop --no-edit
git push origin main

Write-Host "Deploying to production..." -ForegroundColor Green
Start-Sleep 90

# Test production deployment
try {
    $testUrl = @{ url = "http://suspicious-paypal-site.com" } | ConvertTo-Json
    $result = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/scan-link" -Method POST -Body $testUrl -ContentType "application/json" -TimeoutSec 15
    Write-Host "Production scan-link working: $($result | ConvertTo-Json)" -ForegroundColor Green
    
    $testMsg = @{ content = "URGENT: Your account expires today! Click here to verify!" } | ConvertTo-Json
    $msgResult = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/scan-message" -Method POST -Body $testMsg -ContentType "application/json" -TimeoutSec 15
    Write-Host "Production scan-message working: $($msgResult | ConvertTo-Json)" -ForegroundColor Green
    
} catch {
    Write-Host "Production still deploying: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "API endpoints deployed! Test your dashboard at http://localhost:5173" -ForegroundColor Green