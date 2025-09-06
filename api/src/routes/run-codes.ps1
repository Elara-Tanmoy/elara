# First, test that your API endpoints are working
try {
    # Test scan-link
    $linkTest = @{ url = "http://paypal-security-verification.suspicious-domain.com" } | ConvertTo-Json
    $linkResult = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/scan-link" -Method POST -Body $linkTest -ContentType "application/json" -TimeoutSec 15
    Write-Host "Link scan: $($linkResult.status) - Score: $($linkResult.trust_score)" -ForegroundColor Green

    # Test scan-message
    $msgTest = @{ content = "URGENT: Your account expires today! Verify your password immediately!" } | ConvertTo-Json
    $msgResult = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/scan-message" -Method POST -Body $msgTest -ContentType "application/json" -TimeoutSec 15
    Write-Host "Message scan: $($msgResult.status) - Score: $($msgResult.trust_score)" -ForegroundColor Green
    
    Write-Host "API is working! Your dashboard will function correctly." -ForegroundColor Green
} catch {
    Write-Host "API endpoints not ready yet: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Wait for deployment to complete or check GitHub Actions" -ForegroundColor Yellow
}

# If React is working, just refresh your browser at localhost:5173
# If you need the HTML version instead:
Set-Location "D:\Elara_Starter_MPV\elara-azure-vscode-complete\web"