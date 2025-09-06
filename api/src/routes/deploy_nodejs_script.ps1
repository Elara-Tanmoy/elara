# Make sure you're in the API directory and on develop branch
Set-Location "D:\Elara_Starter_MPV\elara-azure-vscode-complete"
git checkout develop

# Create the scan-link route file
$scanLinkContent = @'
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
'@

$scanLinkContent | Out-File -FilePath "api/src/routes/scanLink.js" -Encoding utf8

# Create the scan-message route file
$scanMessageContent = @'
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
'@

$scanMessageContent | Out-File -FilePath "api/src/routes/scanMessage.js" -Encoding utf8

Write-Host "Created scan endpoint files" -ForegroundColor Green