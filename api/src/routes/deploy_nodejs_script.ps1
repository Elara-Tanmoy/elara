# Complete Elara API Deployment Script
# This script will create a working CommonJS version and deploy it

Write-Host "🚀 Starting Elara API Complete Deployment..." -ForegroundColor Green

# Step 1: Backup current files
Write-Host "📦 Backing up current API files..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = "api-backup-$timestamp"
if (Test-Path "api") {
    Copy-Item "api" $backupDir -Recurse -Force
    Write-Host "✅ Backup created: $backupDir" -ForegroundColor Green
}

# Step 2: Create working API directory
Write-Host "🔧 Creating working API..." -ForegroundColor Yellow
if (Test-Path "elara-api-working") {
    Remove-Item "elara-api-working" -Recurse -Force
}
New-Item -ItemType Directory -Name "elara-api-working" -Force | Out-Null

# Step 3: Create package.json
$packageJson = @'
{
  "name": "elara-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "postinstall": "echo Dependencies installed successfully"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "cors": "^2.8.5",
    "express": "^4.19.2"
  },
  "engines": {
    "node": "18.x"
  }
}
'@

$packageJson | Out-File -FilePath "elara-api-working\package.json" -Encoding UTF8 -Force
Write-Host "✅ Created package.json" -ForegroundColor Green

# Step 4: Create server.js
$serverJs = @'
const express = require("express");
const cors = require("cors");

console.log("Starting Elara API...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));

// Basic logging middleware
app.use((req, res, next) => {
  console.log(new Date().toISOString() + " - " + req.method + " " + req.path);
  next();
});

// Health endpoint
app.get("/health", (req, res) => {
  console.log("Health check requested");
  res.json({
    ok: true,
    ts: new Date().toISOString(),
    provider: process.env.LLM_PROVIDER || "azure_openai",
    message: "Elara API is running"
  });
});

// Root endpoint
app.get("/", (req, res) => {
  console.log("Root endpoint requested");
  res.send("Elara API online - CommonJS version");
});

// Basic ask-elara endpoint (simplified for now)
app.post("/ask-elara", (req, res) => {
  console.log("Ask Elara endpoint requested");
  res.json({
    ok: true,
    message: "Ask Elara endpoint is working",
    timestamp: new Date().toISOString(),
    request_body: req.body
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error occurred:", err);
  res.status(500).json({
    ok: false,
    error: "Internal server error",
    timestamp: new Date().toISOString()
  });
});

// Start server
const port = process.env.PORT || 8080;
console.log("Attempting to listen on port " + port + "...");

const server = app.listen(port, "0.0.0.0", () => {
  console.log("✓ Elara API successfully listening on port " + port);
  console.log("✓ Server started at " + new Date().toISOString());
}).on('error', (err) => {
  console.error("✗ Failed to start server:", err.message);
  console.error("✗ Error code:", err.code);
  console.error("✗ Full error:", err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
'@

$serverJs | Out-File -FilePath "elara-api-working\server.js" -Encoding UTF8 -Force
Write-Host "✅ Created server.js" -ForegroundColor Green

# Step 5: Create web.config for better Azure support
$webConfig = @'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <webSocket enabled="false" />
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
'@

$webConfig | Out-File -FilePath "elara-api-working\web.config" -Encoding UTF8 -Force
Write-Host "✅ Created web.config" -ForegroundColor Green
