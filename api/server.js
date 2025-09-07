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
app.get("/", (_req, res) => res.send("Elara API online - Full dashboard support enabled"));

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
