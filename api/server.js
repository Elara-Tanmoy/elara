import express from "express";
import cors from "cors";
import askElara from "./src/routes/askElara.js";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    ts: new Date().toISOString(),
    provider: process.env.LLM_PROVIDER || "azure_openai_automated_setup"
  });
});

app.use("/ask-elara", askElara);

app.get("/", (_req, res) => res.send("Elara API online"));
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Elara API listening on ${port}`));



