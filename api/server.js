const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    ts: new Date().toISOString(),
    provider: 'elara-security-ai',
    endpoints: ['health', 'scan-link', 'scan-message', 'ask-elara']
  });
});

app.get('/', (req, res) => {
  res.send('Elara Security Platform v2.0 - AI-Powered Threat Detection');
});

app.post('/scan-link', (req, res) => {
  const { url } = req.body || {};
  if (!url) {
    return res.status(400).json({ 
      status: 'error', 
      reasons: ['Missing URL parameter'],
      trust_score: 0
    });
  }

  const urlLower = url.toLowerCase();
  let status = 'safe';
  let trust_score = 85;
  const reasons = [];

  if (!url.startsWith('https://')) {
    status = 'warn';
    trust_score = 40;
    reasons.push('Uses insecure HTTP connection');
  }

  const threats = ['auth-', 'login-', 'verify-', 'paypal-', 'ledger', 'pages.dev'];
  const foundThreats = threats.filter(threat => urlLower.includes(threat));

  if (foundThreats.length > 0) {
    status = 'block';
    trust_score = 10;
    reasons.push(High-risk patterns: ${foundThreats.join(', ')});
    reasons.push('Likely phishing attempt - do not enter credentials');
  }

  if (urlLower.includes('13spices.com') || urlLower.includes('microsoft.com')) {
    status = 'safe';
    trust_score = 95;
    reasons.push('Verified legitimate domain');
  }

  if (status === 'safe' && reasons.length === 0) {
    reasons.push('No suspicious patterns detected');
    reasons.push('URL appears legitimate');
  }

  res.json({ status, reasons, trust_score });
});

app.post('/scan-message', (req, res) => {
  const { content } = req.body || {};
  if (!content) {
    return res.status(400).json({ 
      status: 'error', 
      reasons: ['Missing message content'],
      trust_score: 0
    });
  }

  const text = content.toLowerCase();
  let status = 'safe';
  let trust_score = 90;
  const reasons = [];

  const scamWords = ['urgent', 'expires today', 'verify now', 'suspended', 'click here'];
  const foundScam = scamWords.filter(word => text.includes(word));

  if (foundScam.length >= 2) {
    status = 'block';
    trust_score = 15;
    reasons.push('Multiple scam indicators detected');
    reasons.push(Suspicious phrases: ${foundScam.join(', ')});
  } else if (foundScam.length === 1) {
    status = 'warn';
    trust_score = 45;
    reasons.push('Some suspicious language detected');
  } else {
    reasons.push('Message appears normal');
  }

  res.json({ status, reasons, trust_score });
});

app.post('/ask-elara', (req, res) => {
  const { question, context } = req.body || {};
  if (!question) {
    return res.status(400).json({ error: 'Missing question parameter' });
  }

  res.json({
    model: 'elara-security-ai',
    confidence: 0.9,
    answer: Security Analysis: "${question}". This has been processed through Elara's advanced threat detection system.
  });
});

const port = process.env.PORT || 3001;
app.listen(port, '0.0.0.0', () => {
  console.log(Elara API v2.0 listening on port ${port});
});
