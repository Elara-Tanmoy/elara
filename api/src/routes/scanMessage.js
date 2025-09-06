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

  const urgencyWords = ['urgent', 'immediate', 'expire', 'suspend', 'verify now', 'expires today'];
  const hasUrgency = urgencyWords.some(word => text.includes(word));
  
  if (hasUrgency) {
    reasons.push("Contains urgency indicators commonly used in scams");
    status = "warn";
    trust_score -= 25;
  }

  const financialWords = ['bank', 'account', 'password', 'ssn', 'credit card', 'click here'];
  const hasFinancial = financialWords.some(word => text.includes(word));
  
  if (hasFinancial) {
    reasons.push("Requests sensitive financial information");
    status = "block";
    trust_score = 20;
  }

  if (text.includes('http') && !text.includes('https')) {
    reasons.push("Contains insecure HTTP links");
    status = status === "safe" ? "warn" : status;
    trust_score -= 15;
  }

  if (status === "safe") {
    reasons.push("Message appears legitimate");
    reasons.push("No suspicious patterns detected");
  }

  return { status, reasons, trust_score };
}

export default router;
