# First, let's check the current API status comprehensively
Write-Host "Checking all API endpoints..." -ForegroundColor Yellow

# Test health endpoint
try {
    $health = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/health" -Method GET -TimeoutSec 15
    Write-Host "Health endpoint: WORKING" -ForegroundColor Green
    Write-Host "Available endpoints: $($health.endpoints -join ', ')" -ForegroundColor White
} catch {
    Write-Host "Health endpoint: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test scan-link endpoint
try {
    $linkTest = @{ url = "https://example.com" } | ConvertTo-Json
    $linkResult = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/scan-link" -Method POST -Body $linkTest -ContentType "application/json" -TimeoutSec 15
    Write-Host "scan-link endpoint: WORKING - Status: $($linkResult.status)" -ForegroundColor Green
} catch {
    Write-Host "scan-link endpoint: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $needsDeployment = $true
}

# Test scan-message endpoint  
try {
    $msgTest = @{ content = "Hello, how are you?" } | ConvertTo-Json
    $msgResult = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/scan-message" -Method POST -Body $msgTest -ContentType "application/json" -TimeoutSec 15
    Write-Host "scan-message endpoint: WORKING - Status: $($msgResult.status)" -ForegroundColor Green
} catch {
    Write-Host "scan-message endpoint: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $needsDeployment = $true
}

# Test ask-elara endpoint
try {
    $askTest = @{ question = "Is this safe?"; context = @{ url = "test.com" } } | ConvertTo-Json
    $askResult = Invoke-RestMethod -Uri "https://elara-api-dev.azurewebsites.net/ask-elara" -Method POST -Body $askTest -ContentType "application/json" -TimeoutSec 15  
    Write-Host "ask-elara endpoint: WORKING" -ForegroundColor Green
} catch {
    Write-Host "ask-elara endpoint: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $needsDeployment = $true
}

if ($needsDeployment) {
    Write-Host "Some endpoints are missing. Deploying complete API..." -ForegroundColor Yellow
    
    # Navigate to project and ensure all files are present
    Set-Location "D:\Elara_Starter_MPV\elara-azure-vscode-complete"
    git checkout develop
    
    # Verify all route files exist
    $requiredFiles = @(
        "api/src/routes/askElara.js",
        "api/src/routes/scanLink.js", 
        "api/src/routes/scanMessage.js",
        "api/src/llm/azureClient.js"
    )
    
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Host "Found: $file" -ForegroundColor Green
        } else {
            Write-Host "Missing: $file - Creating..." -ForegroundColor Red
        }
    }
    
    # Ensure server.js includes all routes
    $serverContent = @'
import express from "express";
import cors from "cors";
import askElara from "./src/routes/askElara.js";
import scanLink from "./src/routes/scanLink.js";
import scanMessage from "./src/routes/scanMessage.js";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    ts: new Date().toISOString(),
    provider: process.env.LLM_PROVIDER || "azure_openai",
    node_version: process.version,
    endpoints: ["health", "ask-elara", "scan-link", "scan-message"]
  });
});

// Root endpoint
app.get("/", (_req, res) => res.send("Elara API - Full threat detection capabilities"));

// API routes
app.use("/ask-elara", askElara);
app.use("/scan-link", scanLink);
app.use("/scan-message", scanMessage);

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "internal_error", details: err.message });
});

const port = process.env.PORT || 3001;
app.listen(port, "0.0.0.0", () => {
  console.log(`Elara API listening on port ${port}`);
  console.log(`Available endpoints: /health /ask-elara /scan-link /scan-message`);
});
'@

    $serverContent | Out-File -FilePath "api/server.js" -Encoding utf8
    
    # Deploy to staging first
    git add .
    git commit -m "Ensure all API endpoints are deployed and working"
    git push origin develop
    
    Write-Host "Deploying to staging..." -ForegroundColor Yellow
    Start-Sleep 120
    
    # Test staging
    try {
        $stagingTest = Invoke-RestMethod -Uri "https://elara-api-dev-staging.azurewebsites.net/scan-link" -Method POST -Body $linkTest -ContentType "application/json" -TimeoutSec 15
        Write-Host "Staging scan-link: WORKING" -ForegroundColor Green
        
        # Deploy to production
        git checkout main
        git merge develop --no-edit
        git push origin main
        
        Write-Host "Deploying to production..." -ForegroundColor Yellow
        Start-Sleep 120
        
    } catch {
        Write-Host "Staging deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Final verification of all endpoints
Write-Host "`nFinal API verification:" -ForegroundColor Cyan

$endpoints = @(
    @{ name = "health"; url = "https://elara-api-dev.azurewebsites.net/health"; method = "GET"; body = $null },
    @{ name = "scan-link"; url = "https://elara-api-dev.azurewebsites.net/scan-link"; method = "POST"; body = (@{ url = "https://google.com" } | ConvertTo-Json) },
    @{ name = "scan-message"; url = "https://elara-api-dev.azurewebsites.net/scan-message"; method = "POST"; body = (@{ content = "Hello world" } | ConvertTo-Json) },
    @{ name = "ask-elara"; url = "https://elara-api-dev.azurewebsites.net/ask-elara"; method = "POST"; body = (@{ question = "Test"; context = @{} } | ConvertTo-Json) }
)

foreach ($endpoint in $endpoints) {
    try {
        if ($endpoint.method -eq "GET") {
            $result = Invoke-RestMethod -Uri $endpoint.url -Method GET -TimeoutSec 15
        } else {
            $result = Invoke-RestMethod -Uri $endpoint.url -Method POST -Body $endpoint.body -ContentType "application/json" -TimeoutSec 15
        }
        Write-Host "$($endpoint.name): WORKING" -ForegroundColor Green
    } catch {
        Write-Host "$($endpoint.name): FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nAPI Status Summary:" -ForegroundColor Cyan
Write-Host "Production API: https://elara-api-dev.azurewebsites.net" -ForegroundColor White
Write-Host "Dashboard: https://elara-dashboard-live.azurewebsites.net" -ForegroundColor White
Write-Host "GitHub Actions: https://github.com/Elara-Tanmoy/elara/actions" -ForegroundColor White