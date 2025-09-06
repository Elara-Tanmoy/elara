import express from "express";
import cors from "cors";
import askElara from "./src/routes/askElara.js";
import scanLink from "./src/routes/scanLink.js";
import scanMessage from "./src/routes/scanMessage.js";
import analyzeScreenshot from "./src/routes/analyzeScreenshot.js";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    ts: new Date().toISOString(),
    provider: "azure_openai_gpt4_gpt5",
    node_version: process.version,
    endpoints: ["health", "ask-elara", "scan-link", "scan-message", "analyze-screenshot"],
    features: ["ai_analysis", "external_verification", "screenshot_analysis"]
  });
});

app.get("/", (_req, res) => res.send("Elara API - Advanced Cybersecurity Platform"));

app.use("/ask-elara", askElara);
app.use("/scan-link", scanLink);
app.use("/scan-message", scanMessage);
app.use("/analyze-screenshot", analyzeScreenshot);

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "internal_error" });
});

const port = process.env.PORT || 3001;
app.listen(port, "0.0.0.0", () => {
  console.log(`Elara API listening on port ${port}`);
});
