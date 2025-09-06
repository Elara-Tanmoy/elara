import express from "express";

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

    const analysis = analyzeMessage(content);
    res.json(analysis);
  } catch (err) {
    console.error("scan-message error:", err);
    res.status(500).json({ 
      status: "error", 
      reasons: ["Analysis service unavailable"] 
    });
  }
});

function analyzeMessage(content) {
  const reasons = [];
  let status = "safe";
  let trust_score = 90;
  const text = content.toLowerCase();

  // Urgency indicators
  const urgencyWords = ['urgent', 'immediate', 'expires today', 'suspended', 'verify now'];
  const hasUrgency = urgencyWords.some(word => text.includes(word));
  
  if (hasUrgency) {
    reasons.push("Contains urgency tactics commonly used in scams");
    status = "warn";
    trust_score = 35;
  }

  // Financial/credential requests
  const sensitiveWords = ['password', 'ssn', 'credit card', 'bank account', 'click here to verify'];
  const hasSensitive = sensitiveWords.some(word => text.includes(word));
  
  if (hasSensitive) {
    reasons.push("Requests sensitive financial or personal information");
    status = "block";
    trust_score = 15;
  }

  // Combine urgency + sensitive = high risk
  if (hasUrgency && hasSensitive) {
    status = "block";
    trust_score = 5;
    reasons.push("Multiple scam indicators - likely fraudulent message");
  }

  if (status === "safe") {
    reasons.push("Message appears legitimate");
    reasons.push("No obvious scam indicators detected");
  }

  return { status, reasons, trust_score };
}

export default router;
