import express from "express";
import { askElaraScamExplain } from "../llm/azureClient.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { content } = req.body || {};
    if (!content) {
      return res.status(400).json({ 
        status: "error", 
        reasons: ["Missing message content"] 
      });
    }

    const analysis = await analyzeMessageWithAI(content);
    res.json(analysis);
  } catch (err) {
    console.error("scan-message error:", err);
    const fallback = basicMessageAnalysis(content);
    fallback.reasons.unshift("AI analysis unavailable - using basic detection");
    res.json(fallback);
  }
});

async function analyzeMessageWithAI(content) {
  const prompt = `Analyze this message for scam/phishing content: "${content}"

Look for:
- Urgency tactics and pressure language
- Requests for sensitive information
- Impersonation of legitimate organizations
- Social engineering techniques
- Financial fraud indicators
- Emotional manipulation tactics

Assess:
1. Risk level (SAFE, WARN, or BLOCK)
2. Trust score (0-100)
3. Specific manipulation techniques identified
4. Clear explanation of threats

Be particularly alert for:
- Cryptocurrency/wallet scams
- Banking/payment fraud
- Tech support scams
- Romance/advance fee fraud
- Identity theft attempts`;

  try {
    const aiResponse = await askElaraScamExplain(prompt, { message: content, analysis_type: "message_security" });
    return parseMessageAI(aiResponse.answer, content);
  } catch (error) {
    console.error("AI message analysis failed:", error);
    throw error;
  }
}

function parseMessageAI(aiText, content) {
  const text = aiText.toLowerCase();
  let status = "safe";
  let trust_score = 75;
  const reasons = [];

  if (text.includes("block") || text.includes("scam") || text.includes("fraud")) {
    status = "block";
    trust_score = 5;
  } else if (text.includes("warn") || text.includes("suspicious") || text.includes("caution")) {
    status = "warn";
    trust_score = 30;
  }

  const scamTypes = [
    "phishing", "social engineering", "urgency tactics", "financial fraud",
    "identity theft", "cryptocurrency scam", "romance scam", "tech support scam"
  ];

  scamTypes.forEach(scamType => {
    if (text.includes(scamType)) {
      reasons.push(`AI detected: ${scamType} techniques`);
    }
  });

  if (status === "block") {
    reasons.push("AI Analysis: SCAM DETECTED - Do not respond or provide information");
  } else if (status === "warn") {
    reasons.push("AI Analysis: SUSPICIOUS - Exercise caution");
  } else {
    reasons.push("AI Analysis: Message appears legitimate");
  }

  const cleanExplanation = aiText.replace(/[{}[\]"]/g, '').trim();
  if (cleanExplanation.length > 50) {
    reasons.push(`AI Analysis: ${cleanExplanation.substring(0, 200)}...`);
  }

  return { status, reasons, trust_score };
}

function basicMessageAnalysis(content) {
  const reasons = [];
  let status = "safe";
  let trust_score = 60;

  const urgencyWords = ['urgent', 'immediate', 'expire', 'suspend'];
  if (urgencyWords.some(word => content.toLowerCase().includes(word))) {
    reasons.push("Contains urgency indicators");
    status = "warn";
    trust_score = 25;
  }

  return { status, reasons, trust_score };
}

export default router;
