import express from "express";
import { askElaraScamExplain } from "../llm/azureClient.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { question, context } = req.body || {};
    if (!question) return res.status(400).json({ error: "Missing 'question'." });

    const result = await askElaraScamExplain(question, context || {});
    const safe = String(result.answer)
      .replace(/https?:\/\/\S+/gi, "[link removed]")
      .slice(0, 1800);

    res.json({ model: result.model, confidence: result.confidence, answer: safe });
  } catch (err) {
    console.error("ask-elara error:", err?.response?.data || err);
    res.status(500).json({ error: "LLM failure" });
  }
});

export default router;
