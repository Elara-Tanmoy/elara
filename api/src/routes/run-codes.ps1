# Fix the parsing logic in scanLink.js
Set-Location "D:\Elara_Starter_MPV\elara-azure-vscode-complete"
git checkout develop

# Update the parseAIResponse function to be more accurate
$fixedScanLink = @'
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

Provide a clear security assessment:

1. RISK LEVEL: State clearly if this URL is SAFE, WARN, or BLOCK
2. TRUST SCORE: Give a number from 0-100 (0=dangerous, 100=completely safe)
3. REASONING: List specific findings that support your assessment

Focus on:
- Domain legitimacy and reputation
- Suspicious URL patterns (auth-, login-, verify-)
- Brand impersonation attempts
- Hosting platform abuse (pages.dev, netlify.app)
- Cryptocurrency/financial phishing indicators

Be consistent: if you list positive safety indicators, the risk should be SAFE with high trust score.`;

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

  // More careful parsing - look for explicit risk statements
  if (text.includes("risk level: block") || text.includes("status: block") || 
      (text.includes("phishing") && text.includes("detected")) ||
      (text.includes("malicious") && !text.includes("no malicious"))) {
    status = "block";
    trust_score = 10;
  } else if (text.includes("risk level: warn") || text.includes("status: warn") || 
             text.includes("suspicious") && !text.includes("no suspicious")) {
    status = "warn";
    trust_score = 35;
  } else if (text.includes("risk level: safe") || text.includes("status: safe") ||
             text.includes("legitimate") || text.includes("appears safe")) {
    status = "safe";
    trust_score = 85;
  }

  // Extract trust score from AI response
  const scoreMatch = text.match(/trust score[:\s]*(\d+)|score[:\s]*(\d+)\/100|(\d+)\/100/i);
  if (scoreMatch) {
    const extractedScore = parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]);
    if (extractedScore >= 0 && extractedScore <= 100) {
      trust_score = extractedScore;
      
      // Align status with trust score
      if (trust_score >= 70) status = "safe";
      else if (trust_score >= 30) status = "warn";
      else status = "block";
    }
  }

  // Extract reasons more carefully
  const lines = aiText.split(/\n|;|\./);
  lines.forEach(line => {
    const cleanLine = line.trim().replace(/^[-•*]\s*/, '');
    if (cleanLine.length > 20 && 
        (cleanLine.includes('domain') || cleanLine.includes('url') || 
         cleanLine.includes('no') || cleanLine.includes('legitimate') ||
         cleanLine.includes('suspicious') || cleanLine.includes('safe'))) {
      reasons.push(cleanLine);
    }
  });

  // If no specific reasons extracted, use summary
  if (reasons.length === 0) {
    const summary = aiText.length > 150 ? aiText.substring(0, 150) + "..." : aiText;
    reasons.push(summary);
  }

  // Final consistency check
  const positiveIndicators = reasons.filter(r => 
    r.toLowerCase().includes('no suspicious') || 
    r.toLowerCase().includes('legitimate') ||
    r.toLowerCase().includes('no malicious') ||
    r.toLowerCase().includes('good reputation')
  ).length;

  const negativeIndicators = reasons.filter(r =>
    r.toLowerCase().includes('suspicious') ||
    r.toLowerCase().includes('phishing') ||
    r.toLowerCase().includes('malicious')
  ).length;

  // If mostly positive indicators but marked as block, correct it
  if (positiveIndicators > negativeIndicators && status === "block") {
    status = "safe";
    trust_score = Math.max(trust_score, 75);
    reasons.push("Assessment: URL appears legitimate based on analysis");
  }

  return { status, reasons, trust_score };
}

function basicUrlAnalysis(url) {
  const reasons = [];
  let status = "safe";
  let trust_score = 60;
  const urlLower = url.toLowerCase();

  if (!url.startsWith('https://')) {
    reasons.push("Uses insecure HTTP connection");
    status = "warn";
    trust_score = 30;
  }

  const highRisk = ['auth-', 'login-', 'ledger', 'paypal-', 'verify-', 'secure-'];
  const platforms = ['pages.dev', 'netlify.app', 'github.io'];
  
  const foundRisk = highRisk.filter(pattern => urlLower.includes(pattern));
  const foundPlatform = platforms.filter(platform => urlLower.includes(platform));

  if (foundRisk.length > 0 || foundPlatform.length > 0) {
    status = "block";
    trust_score = 15;
    reasons.push(`High-risk patterns detected: ${[...foundRisk, ...foundPlatform].join(', ')}`);
  } else {
    reasons.push("No obvious threat indicators in URL structure");
    trust_score = 80;
  }

  return { status, reasons, trust_score };
}

export default router;
'@ | Out-File -FilePath "api/src/routes/scanLink.js" -Encoding utf8

# Deploy the fix
git add .
git commit -m "Fix AI response parsing logic for consistent threat assessment"
git push origin develop

git checkout main
git merge develop --no-edit
git push origin main

Write-Host "Fixed the parsing logic. The assessment should now be consistent." -ForegroundColor Green
Write-Host "Wait 2-3 minutes for deployment, then test again." -ForegroundColor Yellow