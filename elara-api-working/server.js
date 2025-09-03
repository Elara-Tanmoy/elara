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
  console.log("âœ“ Elara API successfully listening on port " + port);
  console.log("âœ“ Server started at " + new Date().toISOString());
}).on('error', (err) => {
  console.error("âœ— Failed to start server:", err.message);
  console.error("âœ— Error code:", err.code);
  console.error("âœ— Full error:", err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
