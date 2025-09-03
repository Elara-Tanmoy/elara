# Complete fix for GitHub Actions deployment
Write-Host "=== FIXING DEPLOYMENT ISSUES COMPLETELY ===" -ForegroundColor Magenta

# First, let's bypass GitHub Actions and deploy directly to verify the app works
Write-Host "Step 1: Direct deployment to verify app works..." -ForegroundColor Yellow

# Build and deploy directly to staging
Set-Location "D:\Elara_Starter_MPV\elara-azure-vscode-complete\api"
npm ci

Set-Location "D:\Elara_Starter_MPV\elara-azure-vscode-complete"
if (Test-Path .\direct-deploy.zip) { Remove-Item .\direct-deploy.zip -Force }
tar.exe -a -c -f .\direct-deploy.zip -C .\api .

az webapp deploy -g rg-elara-dev -n elara-api-dev --slot staging --src-path ".\direct-deploy.zip" --type zip --restart true --clean true

Write-Host "Direct deployment completed. Testing..." -ForegroundColor Green
Start-Sleep 30

try {
    $directTest = Invoke-RestMethod -Uri "https://elara-api-dev-staging.azurewebsites.net/health" -Method GET -TimeoutSec 15
    Write-Host "Direct deployment success: $($directTest | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "Direct deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Create a simplified, working GitHub Actions workflow
Write-Host "Step 2: Creating simplified GitHub Actions workflow..." -ForegroundColor Yellow

$simpleWorkflow = @'
name: Deploy Elara API

on:
  push:
    branches: [develop, main]
  workflow_dispatch:

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: api/package-lock.json
      
      - name: Install dependencies
        run: |
          cd api
          npm ci --production
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy using Azure CLI
        run: |
          cd api
          tar -czf ../api-package.tar.gz .
          az webapp deploy \
            --resource-group rg-elara-dev \
            --name elara-api-dev \
            --slot staging \
            --src-path ../api-package.tar.gz \
            --type tar \
            --restart true \
            --clean true
      
      - name: Test deployment
        run: |
          sleep 45
          curl -f https://elara-api-dev-staging.azurewebsites.net/health

  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: api/package-lock.json
      
      - name: Install dependencies
        run: |
          cd api
          npm ci --production
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to staging first
        run: |
          cd api
          tar -czf ../api-package.tar.gz .
          az webapp deploy \
            --resource-group rg-elara-dev \
            --name elara-api-dev \
            --slot staging \
            --src-path ../api-package.tar.gz \
            --type tar \
            --restart true \
            --clean true
      
      - name: Test staging
        run: |
          sleep 45
          curl -f https://elara-api-dev-staging.azurewebsites.net/health
      
      - name: Swap to production
        run: |
          az webapp deployment slot swap \
            --resource-group rg-elara-dev \
            --name elara-api-dev \
            --slot staging
      
      - name: Verify production
        run: |
          sleep 15
          curl -f https://elara-api-dev.azurewebsites.net/health
'@

# Save the new workflow
New-Item -Path ".github\workflows" -ItemType Directory -Force
$simpleWorkflow | Out-File -FilePath ".github\workflows\deploy.yml" -Encoding utf8

Write-Host "Created simplified workflow" -ForegroundColor Green

# Step 3: Test the workflow
Write-Host "Step 3: Testing new workflow..." -ForegroundColor Yellow

# Make a test change
$testChange = Get-Content api/server.js -Raw
$testChange = $testChange -replace '"azure_openai.*"', '"azure_openai_working_pipeline"'
$testChange | Out-File -FilePath api/server.js -Encoding utf8

# Commit and push
git add .
git commit -m "Fix GitHub Actions workflow - use tar deployment method"
git push origin develop

Write-Host "New workflow triggered. Monitoring..." -ForegroundColor Green

# Step 4: Monitor the deployment
$maxWait = 240
$elapsed = 0
$success = $false

while ($elapsed -lt $maxWait -and -not $success) {
    Start-Sleep 30
    $elapsed += 30
    
    try {
        $result = Invoke-RestMethod -Uri "https://elara-api-dev-staging.azurewebsites.net/health" -Method GET -TimeoutSec 10
        
        if ($result.provider -eq "azure_openai_working_pipeline") {
            $success = $true
            Write-Host "SUCCESS! GitHub Actions deployment working!" -ForegroundColor Green
            Write-Host "Result: $($result | ConvertTo-Json)" -ForegroundColor Green
            
            # Test API endpoint
            $apiTest = @{
                question = "Pipeline test successful"
                context = @{ url = "github-actions-working.com" }
            } | ConvertTo-Json
            
            $apiResult = Invoke-RestMethod -Uri "https://elara-api-dev-staging.azurewebsites.net/ask-elara" -Method POST -Body $apiTest -ContentType "application/json" -TimeoutSec 10
            Write-Host "API Response: $($apiResult.answer)" -ForegroundColor Green
            
        } else {
            Write-Host "Deployment in progress... (${elapsed}s)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Waiting for deployment... (${elapsed}s)" -ForegroundColor Yellow
    }
}

if ($success) {
    Write-Host "`n🎉 DEVOPS PIPELINE FULLY WORKING!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/Elara-Tanmoy/elara.git" -ForegroundColor Cyan
    Write-Host "Production: https://elara-api-dev.azurewebsites.net" -ForegroundColor Cyan
    Write-Host "Staging: https://elara-api-dev-staging.azurewebsites.net" -ForegroundColor Cyan
    Write-Host "`nWorkflow:" -ForegroundColor Yellow
    Write-Host "develop → staging (automatic)" -ForegroundColor White
    Write-Host "main → production (automatic)" -ForegroundColor White
    Write-Host "`nYour DevOps pipeline is ready!" -ForegroundColor Green
} else {
    Write-Host "Deployment timeout. Check GitHub Actions:" -ForegroundColor Red
    Write-Host "https://github.com/Elara-Tanmoy/elara/actions" -ForegroundColor Cyan
}

# Cleanup
Remove-Item .\direct-deploy.zip -Force -ErrorAction SilentlyContinue
Remove-Item .\api-package.tar.gz -Force -ErrorAction SilentlyContinue