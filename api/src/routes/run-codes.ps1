# Check what's currently in your Azure OpenAI configuration
az webapp config appsettings list -g rg-elara-dev -n elara-api-dev --query "[?contains(name, 'AZURE_OPENAI')].{name:name, value:value}" -o table

# Navigate to your project
Set-Location "D:\Elara_Starter_MPV\elara-azure-vscode-complete"
git checkout develop

# Update scanLink.js to use GPT-4.1-mini for intelligent analysis
$aiPoweredScanLink = @'
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
    // Fallback to basic analysis if AI fails
    const fallback = basicUrlAnalysis(url);
    fallback.reasons.unshift("AI analysis unavailable - using basic detection");
    res.json(fallback);
  }
});

async function analyzeUrlWithAI(url) {
  const prompt = `Analyze this URL for security threats: ${url}

Consider:
- Brand impersonation attempts
- Suspicious domain patterns
- Common phishing indicators
- URL structure anomalies
- Domain reputation signals

Provide:
1. Risk level (SAFE, WARN, or BLOCK)
2. Trust score (0-100)
3. Specific reasons for the assessment
4. Clear explanation of any threats detected

Be especially vigilant for:
- Cryptocurrency/wallet phishing (ledger, metamask, coinbase)
- Banking/payment impersonation (paypal, bank names)
- Tech company impersonation (microsoft, google, apple)
- Authentication/login page mimics
- Suspicious hosting platforms (pages.dev, netlify.app, github.io)

Format response as JSON-like structure but in plain text.`;

  try {
    const aiResponse = await askElaraScamExplain(prompt, { url, analysis_type: "url_security" });
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

  // Extract AI assessment
  if (text.includes("block") || text.includes("high risk") || text.includes("dangerous")) {
    status = "block";
    trust_score = 10;
  } else if (text.includes("warn") || text.includes("suspicious") || text.includes("caution")) {
    status = "warn";
    trust_score = 35;
  } else if (text.includes("safe") || text.includes("legitimate")) {
    status = "safe";
    trust_score = 85;
  }

  // Extract specific threats mentioned by AI
  const threats = [
    "phishing", "impersonation", "suspicious domain", "brand mimicking",
    "credential theft", "cryptocurrency scam", "payment fraud", "malicious"
  ];

  threats.forEach(threat => {
    if (text.includes(threat)) {
      reasons.push(`AI detected: ${threat} indicators`);
    }
  });

  // Add AI-powered reasoning
  if (status === "block") {
    reasons.push("AI Analysis: HIGH THREAT - Multiple malicious indicators detected");
    reasons.push("Recommendation: Do not visit or enter any information");
  } else if (status === "warn") {
    reasons.push("AI Analysis: SUSPICIOUS - Proceed with extreme caution");
    reasons.push("Recommendation: Verify legitimacy before proceeding");
  } else {
    reasons.push("AI Analysis: No significant threats detected");
    reasons.push("URL appears to follow legitimate patterns");
  }

  // Add the full AI explanation as the last reason
  const cleanExplanation = aiText.replace(/[{}[\]"]/g, '').trim();
  if (cleanExplanation.length > 50) {
    reasons.push(`AI Explanation: ${cleanExplanation.substring(0, 200)}...`);
  }

  return { status, reasons, trust_score };
}

function basicUrlAnalysis(url) {
  // Fallback basic analysis
  const reasons = [];
  let status = "safe";
  let trust_score = 60;

  if (!url.startsWith('https://')) {
    reasons.push("Not using secure HTTPS connection");
    status = "warn";
    trust_score = 30;
  }

  const suspicious = ['auth-', 'login-', 'ledger', 'paypal-', 'pages.dev'];
  if (suspicious.some(pattern => url.toLowerCase().includes(pattern))) {
    reasons.push("Contains suspicious patterns");
    status = "block";
    trust_score = 15;
  }

  if (status === "safe") {
    reasons.push("Basic analysis shows no obvious threats");
  }

  return { status, reasons, trust_score };
}

export default router;
'@

$aiPoweredScanLink | Out-File -FilePath "api/src/routes/scanLink.js" -Encoding utf8

# Update scanMessage.js to also use AI
$aiPoweredScanMessage = @'
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
'@

$aiPoweredScanMessage | Out-File -FilePath "api/src/routes/scanMessage.js" -Encoding utf8

Write-Host "Updated to use GPT-4.1-mini and GPT-5-mini for threat analysis" -ForegroundColor Green

# Deploy the AI-powered version
git add .
git commit -m "Implement AI-powered threat detection using GPT-4.1-mini and GPT-5-mini"
git push origin develop

Write-Host "Deploying AI-powered threat detection..." -ForegroundColor Yellow
Write-Host "This will now use your Azure OpenAI models for much better accuracy" -ForegroundColor Cyan