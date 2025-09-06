import express from "express";
import { analyzeWithGPT4, analyzeWithGPT5 } from "../llm/azureClient.js";
import { performComprehensiveScan } from "../services/securityApis.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { url, detailedAnalysis } = req.body || {};
    if (!url) {
      return res.status(400).json({ 
        status: "error", 
        reasons: ["Missing URL parameter"] 
      });
    }

    const analysis = await comprehensiveUrlAnalysis(url, detailedAnalysis === 'true');
    res.json(analysis);
  } catch (err) {
    console.error("URL analysis error:", err);
    const fallback = conservativeFallback(url);
    res.json(fallback);
  }
});

async function comprehensiveUrlAnalysis(url, useDetailedAnalysis) {
  const [aiResponse, externalScans] = await Promise.all([
    performAIAnalysis(url, useDetailedAnalysis),
    performComprehensiveScan(url)
  ]);
  return combineAnalysisResults(aiResponse, externalScans, url);
}

async function performAIAnalysis(url, useDetailedAnalysis) {
  const prompt = `Analyze this URL for cybersecurity threats: ${url}

Provide structured assessment:
RISK_LEVEL: [SAFE/WARN/BLOCK]
TRUST_SCORE: [0-100]
FINDINGS: [List specific threats or safety indicators]
RECOMMENDATIONS: [User guidance]

Be accurate - legitimate sites like 13spices.com should be SAFE with 80+ scores.`;

  return useDetailedAnalysis 
    ? await analyzeWithGPT5(prompt, { url_analysis: true })
    : await analyzeWithGPT4(prompt, { url_analysis: true });
}

function combineAnalysisResults(aiResponse, externalScans, url) {
  const aiText = aiResponse.answer;
  
  const riskMatch = aiText.match(/RISK_LEVEL:\s*(SAFE|WARN|BLOCK)/i);
  const scoreMatch = aiText.match(/TRUST_SCORE:\s*(\d+)/i);
  const findingsMatch = aiText.match(/FINDINGS:\s*(.*?)(?=RECOMMENDATIONS:|$)/is);

  let status = riskMatch ? riskMatch[1].toLowerCase() : "safe";
  let trust_score = scoreMatch ? parseInt(scoreMatch[1]) : 75;
  
  const reasons = [];
  
  if (findingsMatch) {
    const findings = findingsMatch[1].split(/\n|;|-/).filter(f => f.trim().length > 5);
    reasons.push(...findings.map(f => f.trim()));
  }

  const externalFindings = processExternalScans(externalScans);
  reasons.push(...externalFindings.findings);

  if (externalFindings.threatDetected && status === "safe") {
    status = externalFindings.severity === "high" ? "block" : "warn";
    trust_score = Math.min(trust_score, externalFindings.maxScore);
  }

  if (isKnownLegitimate(url) && status === "block" && trust_score < 50) {
    status = "safe";
    trust_score = Math.max(trust_score, 85);
    reasons.unshift("Domain verified as legitimate business");
  }

  return {
    status,
    trust_score,
    reasons: reasons.slice(0, 6),
    model_used: aiResponse.model,
    external_verification: true
  };
}

function processExternalScans(scans) {
  const findings = [];
  let threatDetected = false;
  let severity = "low";
  let maxScore = 100;

  if (scans.virusTotal && scans.virusTotal.malicious > 0) {
    findings.push(`VirusTotal: ${scans.virusTotal.malicious} engines flagged as malicious`);
    threatDetected = true;
    severity = "high";
    maxScore = 15;
  }

  if (scans.googleSafeBrowsing === true) {
    findings.push("Google Safe Browsing: Flagged as unsafe");
    threatDetected = true;
    severity = "high";
    maxScore = 10;
  }

  if (!threatDetected && scans.virusTotal) {
    findings.push(`VirusTotal: Clean scan results`);
  }

  return { findings, threatDetected, severity, maxScore };
}

function isKnownLegitimate(url) {
  const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].toLowerCase();
  const legitPatterns = [
    /^[a-z0-9-]+\.(com|org|net|edu)$/,
    /^[a-z]+(spice|food|shop|store)\.(com|org)$/i
  ];
  const threatPatterns = [
    /auth-|login-|verify-|paypal-|pages\.dev/
  ];
  
  return legitPatterns.some(p => p.test(domain)) && !threatPatterns.some(p => p.test(domain));
}

function conservativeFallback(url) {
  return {
    status: isKnownLegitimate(url) ? "safe" : "warn",
    trust_score: isKnownLegitimate(url) ? 85 : 60,
    reasons: ["AI analysis temporarily unavailable", "Basic pattern analysis applied"],
    external_verification: false
  };
}

export default router;
