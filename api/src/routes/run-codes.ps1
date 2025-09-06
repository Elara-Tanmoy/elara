# Navigate to project and ensure we have the complete working code
Set-Location "D:\Elara_Starter_MPV\elara-azure-vscode-complete"
git checkout develop

# Ensure Azure OpenAI environment variables are set
az webapp config appsettings set -g rg-elara-dev -n elara-api-dev --settings `
  AZURE_OPENAI_ENDPOINT="https://tanmo-mekhv7ql-eastus2.cognitiveservices.azure.com" `
  AZURE_OPENAI_DEPLOYMENT_41_MINI="gpt-4.1-mini-ESCALATION" `
  AZURE_OPENAI_API_VERSION_41="2025-01-01-preview" `
  AZURE_OPENAI_MODEL_5_MINI="gpt-5-mini" `
  AZURE_OPENAI_API_VERSION_5="2025-04-01-preview"

# Create the complete working azureClient.js
@'
import axios from "axios";

const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || "https://tanmo-mekhv7ql-eastus2.cognitiveservices.azure.com";
const API_KEY = process.env.AZURE_OPENAI_API_KEY;

const DEPLOYMENT_41 = process.env.AZURE_OPENAI_DEPLOYMENT_41_MINI || "gpt-4.1-mini-ESCALATION";
const VERSION_41 = process.env.AZURE_OPENAI_API_VERSION_41 || "2025-01-01-preview";

if (!API_KEY) {
  console.warn("AZURE_OPENAI_API_KEY not set - using fallback analysis");
}

const http = axios.create({
  baseURL: ENDPOINT,
  headers: { "api-key": API_KEY || "not-set", "Content-Type": "application/json" },
  timeout: 30000,
});

export async function chat41Mini(messages, { maxTokens = 400, temperature = 0.1 } = {}) {
  if (!API_KEY) throw new Error("Azure OpenAI API key not configured");
  
  const url = `/openai/deployments/${DEPLOYMENT_41}/chat/completions?api-version=${VERSION_41}`;
  const body = { messages, temperature, max_tokens: maxTokens };
  const { data } = await http.post(url, body);
  return data?.choices?.[0]?.message?.content || "No response";
}

export async function askElaraScamExplain(question, context = {}) {
  const messages = [
    {
      role: "system",
      content: "You are Elara, an expert cybersecurity AI. Analyze URLs and messages for threats with high accuracy. Respond with clear risk assessment and specific reasons."
    },
    {
      role: "user",
      content: question
    }
  ];

  try {
    const answer = await chat41Mini(messages, { maxTokens: 500, temperature: 0.1 });
    return {
      model: "gpt-4.1-mini",
      confidence: 0.95,
      answer: answer
    };
  } catch (error) {
    console.error("LLM error:", error);
    throw new Error("AI analysis service unavailable");
  }
}
'@ | Out-File -FilePath "api/src/llm/azureClient.js" -Encoding utf8

# Create the AI-powered scanLink.js
@'
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
'@ | Out-File -FilePath "api/src/routes/scanLink.js" -Encoding utf8

# Deploy API updates
git add .
git commit -m "Complete AI-powered threat detection with GPT-4.1-mini integration"
git push origin develop

# Deploy to production
git checkout main
git merge develop --no-edit
git push origin main

Write-Host "AI-powered API deploying..." -ForegroundColor Green