import express from "express";
import { askElaraScamExplain } from "../llm/azureClient.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ 
        status: "error", 
        reasons: ["Missing URL parameter"] 
      });
    }

    const analysis = await analyzeUrlWithAI(url);
    res.json(analysis);
  } catch (err) {
    console.error("scan-link error:", err);
    const fallback = basicUrlAnalysis(url);
    fallback.reasons.unshift("AI temporarily unavailable - using enhanced pattern detection");
    res.json(fallback);
  }
});

async function analyzeUrlWithAI(url) {
  const prompt = `Analyze this URL for cybersecurity threats: ${url}

Assess for:
1. Phishing attempts (brand impersonation, lookalike domains)
2. Malicious hosting platforms
3. Suspicious URL structure
4. Domain reputation indicators

Provide:
- RISK LEVEL: SAFE, WARN, or BLOCK
- TRUST SCORE: 0-100 (where 100 is completely safe)
- SPECIFIC REASONS: List concrete threats found

Pay special attention to:
- Cryptocurrency phishing (ledger, metamask, coinbase)
- Authentication pages (auth-, login-, verify-)
- Free hosting abuse (pages.dev, netlify.app, github.io)
- Brand impersonation attempts

Be concise but thorough.`;

  try {
    const aiResponse = await askElaraScamExplain(prompt);
    return parseAIResponse(aiResponse.answer, url);
  } catch (error) {
    console.error("AI analysis failed:", error);
    throw error;
  }
}

function parseAIResponse(aiText, url) {
  const text = aiText.toLowerCase();
  let status = "safe";
  let trust_score = 70;
  const reasons = [];

  if (text.includes("block") || text.includes("high risk") || text.includes("phishing")) {
    status = "block";
    trust_score = Math.min(15, extractScore(text) || 15);
  } else if (text.includes("warn") || text.includes("suspicious") || text.includes("caution")) {
    status = "warn"; 
    trust_score = Math.min(40, extractScore(text) || 40);
  } else if (text.includes("safe")) {
    status = "safe";
    trust_score = Math.max(80, extractScore(text) || 80);
  }

  const lines = aiText.split('\n').filter(line => line.trim());
  lines.forEach(line => {
    if (line.includes('reason') || line.includes('-') || line.includes('threat')) {
      const cleanLine = line.replace(/^\W+/, '').trim();
      if (cleanLine.length > 10) {
        reasons.push(cleanLine);
      }
    }
  });

  if (reasons.length === 0) {
    reasons.push(aiText.length > 200 ? aiText.substring(0, 200) + "..." : aiText);
  }

  return { status, reasons, trust_score };
}

function extractScore(text) {
  const scoreMatch = text.match(/(\d+)\/100|score[:\s]*(\d+)|trust[:\s]*(\d+)/i);
  return scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]) : null;
}

function basicUrlAnalysis(url) {
  const reasons = [];
  let status = "safe";
  let trust_score = 60;
  const urlLower = url.toLowerCase();

  if (!url.startsWith('https://')) {
    reasons.push("Insecure HTTP connection");
    status = "warn";
    trust_score = 30;
  }

  const highRisk = ['auth-', 'login-', 'ledger', 'paypal-', 'verify-', 'secure-'];
  const platforms = ['pages.dev', 'netlify.app', 'github.io', 'herokuapp.com'];
  
  const foundRisk = highRisk.filter(pattern => urlLower.includes(pattern));
  const foundPlatform = platforms.filter(platform => urlLower.includes(platform));

  if (foundRisk.length > 0 || foundPlatform.length > 0) {
    status = "block";
    trust_score = 10;
    reasons.push(`Suspicious patterns detected: ${[...foundRisk, ...foundPlatform].join(', ')}`);
    reasons.push("Likely phishing attempt - exercise extreme caution");
  }

  if (status === "safe") {
    reasons.push("No obvious threat indicators detected");
  }

  return { status, reasons, trust_score };
}

export default router;
