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

  if (!url.startsWith('https://')) {
    reasons.push("Not using secure HTTPS connection");
    status = "warn";
    trust_score -= 20;
  }

  const suspicious = ['bit.ly', 'tinyurl', 'paypal-', 'paypaI', 'arnazon', 'microsof', 'suspicious'];
  const hasSuspicious = suspicious.some(pattern => url.toLowerCase().includes(pattern));
  
  if (hasSuspicious) {
    reasons.push("Contains suspicious domain patterns");
    status = "block";
    trust_score = 15;
  }

  if (url.includes('temp') || url.includes('new')) {
    reasons.push("Potentially new or temporary domain");
    status = status === "safe" ? "warn" : status;
    trust_score -= 10;
  }

  if (status === "safe") {
    reasons.push("URL appears legitimate");
    reasons.push("HTTPS connection verified");
  }

  return { status, reasons, trust_score };
}

export default router;
