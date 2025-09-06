# Go back to project root and deploy API updates
Set-Location "D:\Elara_Starter_MPV\elara-azure-vscode-complete"

# Make sure you're on develop branch
git checkout develop

# Commit all changes including the new scan routes
git add .
git commit -m "Add complete web UI and scan endpoints for link/message analysis"
git push origin develop

Write-Host "API deployment started. Waiting for completion..." -ForegroundColor Yellow
Start-Sleep 120

# Test the new API endpoints
Write-Host "Testing new API endpoints..." -ForegroundColor Cyan

try {
    # Test scan-link
    $linkTest = @{ url = "http://suspicious-site.com" } | ConvertTo-Json
    $linkResult = Invoke-RestMethod -Uri "https://elara-api-dev-staging.azurewebsites.net/scan-link" -Method POST -Body $linkTest -ContentType "application/json" -TimeoutSec 15
    Write-Host "Link scan result: $($linkResult.status) - $($linkResult.trust_score)" -ForegroundColor Green

    # Test scan-message  
    $msgTest = @{ content = "URGENT: Your account will be suspended! Click here to verify your password immediately!" } | ConvertTo-Json
    $msgResult = Invoke-RestMethod -Uri "https://elara-api-dev-staging.azurewebsites.net/scan-message" -Method POST -Body $msgTest -ContentType "application/json" -TimeoutSec 15
    Write-Host "Message scan result: $($msgResult.status) - $($msgResult.trust_score)" -ForegroundColor Green

    Write-Host "API endpoints working! Ready for web UI testing." -ForegroundColor Green
} catch {
    Write-Host "API still deploying: $($_.Exception.Message)" -ForegroundColor Yellow
}