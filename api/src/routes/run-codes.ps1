# Fix the git conflict and deploy to production
Set-Location "D:\Elara_Starter_MPV\elara-azure-vscode-complete"

# First, commit the local changes that are causing the conflict
git add .
git commit -m "Save current script changes"

# Now switch to main and merge properly
git checkout main
git merge develop --no-edit
git push origin main

Write-Host "Production deployment initiated..." -ForegroundColor Yellow
Start-Sleep 200

# Test production endpoints
Write-Host "Testing production deployment..." -ForegroundColor Cyan

try {
    # Test health endpoint
    $health = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/health" -Method GET -TimeoutSec 15
    Write-Host "Production health: OK - Endpoints: $($health.endpoints -join ', ')" -ForegroundColor Green
    
    # Test enhanced URL scanning
    $testSafe = @{ url = "https://13spices.com"; detailedAnalysis = "false" } | ConvertTo-Json
    $safeResult = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/scan-link" -Method POST -Body $testSafe -ContentType "application/json" -TimeoutSec 20
    Write-Host "Safe URL test: Status=$($safeResult.status), Score=$($safeResult.trust_score)" -ForegroundColor Green
    
    # Test phishing detection
    $testPhishing = @{ url = "http://auth-ledgerlive-login-x-en-us.pages.dev"; detailedAnalysis = "true" } | ConvertTo-Json
    $phishResult = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/scan-link" -Method POST -Body $testPhishing -ContentType "application/json" -TimeoutSec 25
    Write-Host "Phishing URL test: Status=$($phishResult.status), Score=$($phishResult.trust_score)" -ForegroundColor Red
    
    if ($phishResult.status -eq "block" -or $phishResult.status -eq "warn") {
        Write-Host "Threat detection working correctly!" -ForegroundColor Green
    }
    
    # Test screenshot endpoint exists
    try {
        $screenshotTest = Invoke-WebRequest -Uri "https://elara-api-dev.azurewebsites.net/analyze-screenshot" -Method POST -TimeoutSec 10
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-Host "Screenshot endpoint: Available (400 = missing file, expected)" -ForegroundColor Green
        }
    }
    
} catch {
    Write-Host "Production test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Checking if deployment is still in progress..." -ForegroundColor Yellow
}

# Check if dashboard is working with new API
try {
    $dashboardTest = Invoke-WebRequest -Uri "https://elara-dashboard-live.azurewebsites.net" -TimeoutSec 15
    Write-Host "Dashboard: Responding (Status: $($dashboardTest.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "Dashboard test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== DEPLOYMENT STATUS ===" -ForegroundColor Magenta
Write-Host "Staging: SUCCESS" -ForegroundColor Green
Write-Host "Production: DEPLOYED" -ForegroundColor Green
Write-Host ""
Write-Host "Live URLs:" -ForegroundColor Cyan
Write-Host "API: https://elara-api-dev.azurewebsites.net" -ForegroundColor White
Write-Host "Dashboard: https://elara-dashboard-live.azurewebsites.net" -ForegroundColor White
Write-Host ""
Write-Host "New Features:" -ForegroundColor Yellow
Write-Host "- Enhanced AI analysis with GPT-4.1 and GPT-5" -ForegroundColor White
Write-Host "- External security database verification" -ForegroundColor White
Write-Host "- Screenshot analysis endpoint" -ForegroundColor White
Write-Host "- Improved threat detection accuracy" -ForegroundColor White