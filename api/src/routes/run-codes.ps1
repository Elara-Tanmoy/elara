# Now redeploy with fixed dependencies
git checkout develop
git add .
git commit -m "Fix package dependencies sync for deployment"
git push origin develop

Write-Host "Staging deployment started with fixed dependencies..." -ForegroundColor Yellow
Start-Sleep 180

# Test staging
try {
    $stagingHealth = Invoke-RestMethod -Uri "https://elara-api-dev-staging.azurewebsites.net/health" -Method GET -TimeoutSec 15
    Write-Host "Staging health: $($stagingHealth.endpoints -join ', ')" -ForegroundColor Green
    
    # Test new endpoint
    $testScan = @{ url = "https://13spices.com" } | ConvertTo-Json
    $scanResult = Invoke-RestMethod -Uri "https://elara-api-dev-staging.azurewebsites.net/scan-link" -Method POST -Body $testScan -ContentType "application/json" -TimeoutSec 15
    Write-Host "Scan test: Status=$($scanResult.status), Score=$($scanResult.trust_score)" -ForegroundColor Green
    
} catch {
    Write-Host "Staging test failed: $($_.Exception.Message)" -ForegroundColor Red
}