# First, handle the uncommitted changes
Write-Host "Handling uncommitted changes..." -ForegroundColor Yellow

# Check what files have changes
git status

# Commit or stash the changes
git add .
git commit -m "Save deployment script changes"

# Now switch to main and merge
Write-Host "Switching to main branch..." -ForegroundColor Yellow
git checkout main
git merge develop --no-edit
git push origin main

Write-Host "Production deployment triggered!" -ForegroundColor Green
Write-Host "Monitor at: https://github.com/Elara-Tanmoy/elara/actions" -ForegroundColor Cyan

# Monitor the production deployment
$timeout = 300
$elapsed = 0
$prodSuccess = $false

Write-Host "Monitoring production deployment..." -ForegroundColor Yellow

while ($elapsed -lt $timeout -and -not $prodSuccess) {
    Start-Sleep 30
    $elapsed += 30
    
    try {
        # Test production endpoint
        $prodHealth = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/health" -Method GET -TimeoutSec 15
        
        if ($prodHealth.provider -eq "azure_openai_cli_zip_deploy") {
            $prodSuccess = $true
            Write-Host "SUCCESS! Production deployment complete!" -ForegroundColor Green
            Write-Host "Production health: $($prodHealth | ConvertTo-Json)" -ForegroundColor White
            
            # Test production API
            $prodApi = @{
                question = "Production deployment test"
                context = @{ url = "production-test.com" }
            } | ConvertTo-Json
            
            $prodApiResult = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/ask-elara" -Method POST -Body $prodApi -ContentType "application/json" -TimeoutSec 15
            Write-Host "Production API: $($prodApiResult.answer)" -ForegroundColor Green
            
        } else {
            Write-Host "Production deployment in progress... (${elapsed}s)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Waiting for production deployment... (${elapsed}s)" -ForegroundColor Yellow
    }
}

if ($prodSuccess) {
    Write-Host "DEVOPS PIPELINE FULLY OPERATIONAL!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/Elara-Tanmoy/elara.git" -ForegroundColor Cyan
    Write-Host "Production: https://elara-api-dev.azurewebsites.net" -ForegroundColor Green
    Write-Host "Staging: https://elara-api-dev-staging.azurewebsites.net" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "DevOps workflow complete:" -ForegroundColor Cyan
    Write-Host "develop branch -> staging deployment" -ForegroundColor Green
    Write-Host "main branch -> production deployment" -ForegroundColor Green
    
} else {
    Write-Host "Production deployment timeout. Check:" -ForegroundColor Red
    Write-Host "https://github.com/Elara-Tanmoy/elara/actions" -ForegroundColor Cyan
}