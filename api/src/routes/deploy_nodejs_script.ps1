# Final working deployment workflow
$workingWorkflow = @'
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
      
      - name: Create clean deployment package
        run: |
          cd api
          zip -r ../deployment.zip . -x "*.log" "*.tmp" ".git/*"
      
      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to staging using ZIP
        run: |
          az webapp deploy \
            --resource-group rg-elara-dev \
            --name elara-api-dev \
            --slot staging \
            --src-path deployment.zip \
            --type zip \
            --restart true \
            --clean true
      
      - name: Test staging
        run: |
          sleep 45
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
      
      - name: Create deployment package
        run: |
          cd api
          zip -r ../deployment.zip . -x "*.log" "*.tmp" ".git/*"
      
      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to staging first
        run: |
          az webapp deploy \
            --resource-group rg-elara-dev \
            --name elara-api-dev \
            --slot staging \
            --src-path deployment.zip \
            --type zip \
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
      
      - name: Test production
        run: |
          sleep 20
          curl -f https://elara-api-dev.azurewebsites.net/health
'@

# Update the workflow
$workingWorkflow | Out-File -FilePath ".github\workflows\deploy.yml" -Encoding utf8

# Make a test change
$serverContent = Get-Content api/server.js -Raw
$serverContent = $serverContent -replace '"azure_openai.*"', '"azure_openai_cli_zip_deploy"'
$serverContent | Out-File -FilePath api/server.js -Encoding utf8

git add .
git commit -m "Fix: Use correct Azure CLI zip deployment method"
git push origin develop

Write-Host "Corrected workflow deployed - using ZIP with Azure CLI" -ForegroundColor Green
Write-Host "Monitor: https://github.com/Elara-Tanmoy/elara/actions" -ForegroundColor Cyan

# Monitor the deployment
$timeout = 180
$elapsed = 0

while ($elapsed -lt $timeout) {
    Start-Sleep 30
    $elapsed += 30
    
    try {
        $health = Invoke-RestMethod -Uri "https://elara-api-dev-staging.azurewebsites.net/health" -Method GET -TimeoutSec 15
        
        if ($health.provider -eq "azure_openai_cli_zip_deploy") {
            Write-Host "SUCCESS! Azure CLI ZIP deployment working!" -ForegroundColor Green
            Write-Host "Health response: $($health | ConvertTo-Json)" -ForegroundColor White
            break
        } else {
            Write-Host "Deployment in progress... (${elapsed}s) Current: $($health.provider)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Waiting for deployment completion... (${elapsed}s)" -ForegroundColor Yellow
    }
}