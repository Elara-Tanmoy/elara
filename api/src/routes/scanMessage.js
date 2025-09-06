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
    const fallback = intelligentMessageAnalysis(content);
    res.json(fallback);
  }
});

async function analyzeMessageWithAI(content) {
  const messagePrompt = `Analyze this message for scam/phishing content: "${content}"

Assess for:
1. SOCIAL ENGINEERING: Urgency, fear tactics, pressure
2. FINANCIAL REQUESTS: Money, credentials, personal info
3. IMPERSONATION: Fake organizations, authority figures
4. MANIPULATION: Emotional hooks, false promises

PROVIDE ASSESSMENT:
RISK: [SAFE/WARN/BLOCK]
SCORE: [0-100]
REASONING: [Specific indicators found]

Be accurate - normal messages should be SAFE with high scores.`;

  try {
    const aiResponse = await askElaraScamExplain(messagePrompt, { message_analysis: true });
    return parseMessageAI(aiResponse.answer, content);
  } catch (error) {
    throw error;
  }
}

function parseMessageAI(aiText, content) {
  const text = aiText.toLowerCase();
  let status = "safe";
  let trust_score = 85;
  const reasons = [];

  const riskMatch = text.match(/risk:\s*(safe|warn|block)/i);
  if (riskMatch) {
    status = riskMatch[1].toLowerCase();
  }

  const scoreMatch = text.match(/score:\s*(\d+)/i);
  if (scoreMatch) {
    trust_score = parseInt(scoreMatch[1]);
  }

  const reasoningSection = aiText.match(/reasoning:(.*?)$/is);
  if (reasoningSection) {
    const lines = reasoningSection[1].split(/\n|;/).filter(line => line.trim().length > 10);
    reasons.push(...lines.map(line => line.trim()).slice(0, 4));
  }

  return { status, reasons, trust_score };
}

function intelligentMessageAnalysis(content) {
  const text = content.toLowerCase();
  const reasons = [];
  let status = "safe";
  let trust_score = 85;

  const scamIndicators = [
    'urgent', 'immediate', 'expires today', 'suspended',
    'verify now', 'click here', 'confirm identity',
    'bank account', 'credit card', 'ssn', 'password'
  ];

  const foundIndicators = scamIndicators.filter(indicator => text.includes(indicator));

  if (foundIndicators.length >= 3) {
    status = "block";
    trust_score = 15;
    reasons.push("Multiple scam indicators detected");
    reasons.push(`Found: ${foundIndicators.slice(0, 3).join(', ')}`);
  } else if (foundIndicators.length >= 1) {
    status = "warn";
    trust_score = 45;
    reasons.push("Some suspicious language detected");
    reasons.push("Exercise caution if unsolicited");
  } else {
    reasons.push("Message appears normal");
    reasons.push("No obvious scam indicators found");
  }

  return { status, reasons, trust_score };
}

export default router;
