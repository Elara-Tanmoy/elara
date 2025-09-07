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

    const analysis = await analyzeUrlWithAdvancedAI(url);
    res.json(analysis);
  } catch (err) {
    console.error("scan-link error:", err);
    // Smart fallback analysis
    const fallback = intelligentBasicAnalysis(url);
    res.json(fallback);
  }
});

async function analyzeUrlWithAdvancedAI(url) {
  const analysisPrompt = `You are an expert cybersecurity analyst. Analyze this URL for threats: ${url}

Perform a comprehensive security assessment considering:

1. DOMAIN ANALYSIS:
   - Is this a legitimate business domain?
   - Does it impersonate known brands?
   - Are there suspicious character substitutions?

2. URL STRUCTURE:
   - Does it contain phishing keywords (auth-, login-, verify-, secure-)?
   - Is it using suspicious hosting platforms?
   - Are there URL shorteners or redirects?

3. REPUTATION INDICATORS:
   - Does this appear to be a legitimate website?
   - Are there obvious signs of malicious intent?

PROVIDE YOUR ASSESSMENT:
RISK: [SAFE/WARN/BLOCK]
SCORE: [0-100 where 100 is completely safe]
REASONING: [Bullet points explaining your decision]

Important: Be accurate - legitimate websites should be marked SAFE with high scores (80-95). Only mark as BLOCK if there are clear malicious indicators.`;

  try {
    const aiResponse = await askElaraScamExplain(analysisPrompt, { url_analysis: true });
    return parseStructuredAIResponse(aiResponse.answer, url);
  } catch (error) {
    console.error("Advanced AI analysis failed:", error);
    throw error;
  }
}

function parseStructuredAIResponse(aiText, url) {
  const text = aiText.toLowerCase();
  let status = "safe";
  let trust_score = 80; // Default to safe for legitimate sites
  const reasons = [];

  // Extract explicit risk assessment
  const riskMatch = text.match(/risk:\s*(safe|warn|block)/i);
  if (riskMatch) {
    status = riskMatch[1].toLowerCase();
  }

  // Extract explicit score
  const scoreMatch = text.match(/score:\s*(\d+)/i);
  if (scoreMatch) {
    trust_score = parseInt(scoreMatch[1]);
  }

  // Extract reasoning points
  const reasoningSection = aiText.match(/reasoning:(.*?)(?=\n\n|\n[A-Z]|$)/is);
  if (reasoningSection) {
    const reasonLines = reasoningSection[1].split(/\n|;|â€¢|-/).filter(line => {
      const clean = line.trim();
      return clean.length > 10 && !clean.match(/^(reasoning|assessment)/i);
    });
    
    reasonLines.forEach(line => {
      const cleanLine = line.trim().replace(/^\W+/, '');
      if (cleanLine.length > 5) {
        reasons.push(cleanLine);
      }
    });
  }

  // Fallback reasoning extraction
  if (reasons.length === 0) {
    const sentences = aiText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    reasons.push(...sentences.slice(0, 3).map(s => s.trim()));
  }

  // Validate consistency - prevent false positives on legitimate sites
  const domainName = extractDomainName(url);
  const isLikelyLegitimate = isLegitimateBusinessDomain(domainName);
  
  if (isLikelyLegitimate && status === "block" && trust_score < 30) {
    // Override for likely legitimate domains
    status = "safe";
    trust_score = 85;
    reasons.unshift("Domain appears to be legitimate business - overriding false positive");
  }

  return { status, reasons: reasons.slice(0, 5), trust_score };
}

function extractDomainName(url) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  }
}

function isLegitimateBusinessDomain(domain) {
  // Check for legitimate business patterns
  const legitimatePatterns = [
    /^[a-z]+\.(com|org|net|edu|gov)$/,  // Simple business domains
    /^[a-z]+[a-z0-9]*\.(com|org|net)$/, // Business with numbers
    /^[a-z]+(spice|food|recipe|shop|store|mart)\.(com|org)$/i // Food/business related
  ];

  const suspiciousPatterns = [
    /-?(auth|login|verify|secure|update|account)-?/i,
    /paypal|amazon|microsoft|google|apple/i,
    /crypto|wallet|blockchain|ledger/i
  ];

  const hasLegitimatePattern = legitimatePatterns.some(pattern => pattern.test(domain));
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(domain));

  return hasLegitimatePattern && !hasSuspiciousPattern;
}

function intelligentBasicAnalysis(url) {
  const reasons = [];
  let status = "safe";
  let trust_score = 80;
  const urlLower = url.toLowerCase();
  const domain = extractDomainName(url);

  // Check for obvious threats first
  const highThreatPatterns = [
    'auth-', 'login-', 'verify-', 'secure-update',
    'paypal-', 'amazon-', 'microsoft-', 'google-',
    'ledger', 'metamask', 'coinbase-'
  ];

  const foundThreats = highThreatPatterns.filter(pattern => urlLower.includes(pattern));
  
  if (foundThreats.length > 0) {
    status = "block";
    trust_score = 10;
    reasons.push(`High-risk phishing patterns detected: ${foundThreats.join(', ')}`);
    reasons.push("Likely impersonation attempt - exercise extreme caution");
  } else if (!url.startsWith('https://')) {
    status = "warn";
    trust_score = 60;
    reasons.push("Uses insecure HTTP connection");
    reasons.push("Recommend verifying site legitimacy");
  } else if (isLegitimateBusinessDomain(domain)) {
    status = "safe";
    trust_score = 85;
    reasons.push("Domain appears to be legitimate business website");
    reasons.push("Uses secure HTTPS connection");
    reasons.push("No obvious threat indicators detected");
  } else {
    status = "safe";
    trust_score = 70;
    reasons.push("No clear threat indicators found");
    reasons.push("Domain structure appears normal");
  }

  return { status, reasons, trust_score };
}

export default router;
