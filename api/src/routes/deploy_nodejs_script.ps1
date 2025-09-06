# Replace the broken workflow with a working one
$fixedWorkflow = @'
name: Deploy Elara API

on:
  push:
    branches: [develop, main]
  workflow_dispatch:

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
      
      - name: Install dependencies
        run: |
          cd api
          npm ci --production
      
      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to staging
        run: |
          cd api
          tar -czf ../deploy.tar.gz .
          az webapp deploy \
            --resource-group rg-elara-dev \
            --name elara-api-dev \
            --slot staging \
            --src-path ../deploy.tar.gz \
            --type tar \
            --restart true \
            --clean true
      
      - name: Test staging
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
      
      - name: Install dependencies
        run: |
          cd api
          npm ci --production
      
      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to staging first
        run: |
          cd api
          tar -czf ../deploy.tar.gz .
          az webapp deploy \
            --resource-group rg-elara-dev \
            --name elara-api-dev \
            --slot staging \
            --src-path ../deploy.tar.gz \
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
            --resource-group rg-elara-dev \
            --name elara-api-dev \
            --slot staging
      
      - name: Test production
        run: |
          sleep 15
          curl -f https://elara-api-dev.azurewebsites.net/health
'@

# Replace the workflow
$fixedWorkflow | Out-File -FilePath ".github\workflows\deploy.yml" -Encoding utf8

# Test the fix
$testContent = Get-Content api/server.js -Raw
$testContent = $testContent -replace '"azure_openai.*"', '"azure_openai_fixed_workflow"'
$testContent | Out-File -FilePath api/server.js -Encoding utf8

git add .
git commit -m "Fix: Replace broken webapps-deploy with working Azure CLI deployment"
git push origin develop

Write-Host "Fixed workflow deployed. Monitor at:" -ForegroundColor Green
Write-Host "https://github.com/Elara-Tanmoy/elara/actions" -ForegroundColor Cyan

# Wait and verify
Start-Sleep 120
try {
    $result = Invoke-RestMethod -Uri "https://elara-api-dev-staging.azurewebsites.net/health" -Method GET -TimeoutSec 15
    if ($result.provider -eq "azure_openai_fixed_workflow") {
        Write-Host "SUCCESS! Deployment working with fixed workflow" -ForegroundColor Green
    } else {
        Write-Host "Still deploying or failed. Current: $($result.provider)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Deployment verification failed: $($_.Exception.Message)" -ForegroundColor Red
}