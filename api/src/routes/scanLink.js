import express from "express";

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

    const analysis = analyzeUrl(url);
    res.json(analysis);
  } catch (err) {
    console.error("scan-link error:", err);
    res.status(500).json({ 
      status: "error", 
      reasons: ["Analysis service unavailable"] 
    });
  }
});

function analyzeUrl(url) {
  const reasons = [];
  let status = "safe";
  let trust_score = 85;
  const urlLower = url.toLowerCase();

  // HTTPS check
  if (!url.startsWith('https://')) {
    reasons.push("Uses insecure HTTP connection");
    status = "warn";
    trust_score = 40;
  }

  // High-risk phishing patterns
  const highRiskPatterns = [
    'auth-', 'login-', 'verify-', 'secure-', 'update-',
    'paypal-', 'paypaI', 'amazon-', 'microsof', 'google-',
    'ledger', 'metamask', 'coinbase-', 'crypto-wallet',
    'pages.dev', 'netlify.app', 'github.io'
  ];

  const foundPatterns = highRiskPatterns.filter(pattern => urlLower.includes(pattern));
  
  if (foundPatterns.length > 0) {
    status = "block";
    trust_score = 10;
    reasons.push(`High-risk patterns detected: ${foundPatterns.join(', ')}`);
    reasons.push("Likely phishing attempt - do not enter credentials");
  }

  // Legitimate domain patterns
  const legitimateDomains = [
    'microsoft.com', 'google.com', 'apple.com', 'amazon.com',
    'paypal.com', 'github.com', 'stackoverflow.com'
  ];

  const isLegitimate = legitimateDomains.some(domain => 
    urlLower.includes(domain) && !urlLower.includes('-' + domain)
  );

  if (isLegitimate && status === "safe") {
    trust_score = 95;
    reasons.push("Verified legitimate domain");
  }

  // Default safe assessment
  if (status === "safe" && reasons.length === 0) {
    reasons.push("No suspicious patterns detected");
    reasons.push("Domain appears legitimate");
  }

  return { status, reasons, trust_score };
}

export default router;
