# Final fix - completely replace the broken workflow
Write-Host "=== FINAL DEVOPS FIX ===" -ForegroundColor Magenta

# Delete the old broken workflow and create a working one
Remove-Item ".github\workflows\*.yml" -Force -ErrorAction SilentlyContinue

$workingWorkflow = @'
name: Deploy Elara API

on:
  push:
    branches: [develop, main]
  workflow_dispatch:

env:
  WEBAPP_NAME: elara-api-dev
  RESOURCE_GROUP: rg-elara-dev

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: api/package-lock.json
      
      - name: Build
        run: |
          cd api
          npm ci --production
          cd ..
          tar -czf deployment.tar.gz -C api .
      
      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy
        run: |
          az webapp deploy \
            -g ${{ env.RESOURCE_GROUP }} \
            -n ${{ env.WEBAPP_NAME }} \
            --slot staging \
            --src-path deployment.tar.gz \
            --type tar \
            --restart true \
            --clean true
      
      - name: Test
        run: |
          sleep 30
          curl -f https://elara-api-dev-staging.azurewebsites.net/health

  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: api/package-lock.json
      
      - name: Build
        run: |
          cd api
          npm ci --production
          cd ..
          tar -czf deployment.tar.gz -C api .
      
      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to staging first
        run: |
          az webapp deploy \
            -g ${{ env.RESOURCE_GROUP }} \
            -n ${{ env.WEBAPP_NAME }} \
            --slot staging \
            --src-path deployment.tar.gz \
            --type tar \
            --restart true \
            --clean true
      
      - name: Test staging
        run: |
          sleep 30
          curl -f https://elara-api-dev-staging.azurewebsites.net/health
      
      - name: Swap to production
        run: |
          az webapp deployment slot swap \
            -g ${{ env.RESOURCE_GROUP }} \
            -n ${{ env.WEBAPP_NAME }} \
            --slot staging
      
      - name: Test production
        run: |
          sleep 15
          curl -f https://elara-api-dev.azurewebsites.net/health
'@

# Create the working workflow
New-Item -Path ".github\workflows" -ItemType Directory -Force
$workingWorkflow | Out-File -FilePath ".github\workflows\deploy.yml" -Encoding utf8

Write-Host "Created working workflow file" -ForegroundColor Green

# Update server.js to test the new workflow
$serverJs = Get-Content api/server.js -Raw
$serverJs = $serverJs -replace '"azure_openai.*"', '"azure_openai_final_fix"'
$serverJs | Out-File -FilePath api/server.js -Encoding utf8

# Commit and push to trigger the working workflow
git add .
git commit -m "FINAL FIX: Replace broken workflow with working Azure CLI deployment"
git push origin develop

Write-Host "New working workflow deployed. Testing..." -ForegroundColor Yellow

# Monitor the deployment
$timeout = 180
$elapsed = 0
$success = $false

while ($elapsed -lt $timeout -and -not $success) {
    Start-Sleep 20
    $elapsed += 20
    
    try {
        $health = Invoke-RestMethod -Uri "https://elara-api-dev-staging.azurewebsites.net/health" -Method GET -TimeoutSec 10
        
        if ($health.provider -eq "azure_openai_final_fix") {
            $success = $true
            Write-Host "SUCCESS! GitHub Actions deployment working!" -ForegroundColor Green
            Write-Host "Health check: $($health | ConvertTo-Json)" -ForegroundColor White
            
            # Test the API
            $apiBody = @{
                question = "Final deployment test"
                context = @{ url = "working-pipeline.com" }
            } | ConvertTo-Json
            
            $apiResponse = Invoke-RestMethod -Uri "https://elara-api-dev-staging.azurewebsites.net/ask-elara" -Method POST -Body $apiBody -ContentType "application/json" -TimeoutSec 10
            Write-Host "API working: $($apiResponse.answer)" -ForegroundColor Green
            
        } else {
            Write-Host "Deployment in progress... ${elapsed}s elapsed" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Waiting for deployment... ${elapsed}s elapsed" -ForegroundColor Yellow
    }
}

if ($success) {
    Write-Host "`nDEVOPS PIPELINE FULLY OPERATIONAL!" -ForegroundColor Green
    
    # Test production deployment
    Write-Host "Testing production deployment..." -ForegroundColor Yellow
    git checkout main
    git merge develop --no-edit
    git push origin main
    
    Write-Host "Production deployment triggered" -ForegroundColor Cyan
    Write-Host "Monitor at: https://github.com/Elara-Tanmoy/elara/actions" -ForegroundColor Cyan
    
    Write-Host "`nYour complete DevOps pipeline:" -ForegroundColor Yellow
    Write-Host "develop branch -> staging deployment (working)" -ForegroundColor Green
    Write-Host "main branch -> production deployment (testing)" -ForegroundColor Green
    
} else {
    Write-Host "Deployment failed or timed out" -ForegroundColor Red
    Write-Host "Check: https://github.com/Elara-Tanmoy/elara/actions" -ForegroundColor Cyan
}