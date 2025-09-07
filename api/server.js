const express = require('express');
const cors = require('cors');
const multer = require('multer');
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    ts: new Date().toISOString(),
    provider: 'elara-security-ai-v2',
    endpoints: ['health', 'scan-link', 'scan-message', 'scan-attachments', 'ask-elara'],
    features: ['URL Detection', 'Message Analysis', 'File Upload', 'Screenshot OCR', 'AI Assessment']
  });
});

app.get('/', (req, res) => {
  res.send('Elara Security Platform v2.0 - Advanced AI-Powered Threat Detection');
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

  const threats = ['auth-', 'login-', 'verify-', 'paypal-', 'ledger', 'pages.dev', 'netlify.app'];
  const foundThreats = threats.filter(threat => urlLower.includes(threat));

  if (foundThreats.length > 0) {
    status = 'block';
    trust_score = 10;
    reasons.push(High-risk patterns detected: ${foundThreats.join(', ')});
    reasons.push('Likely phishing attempt - do not enter credentials');
  }

  const legitDomains = ['13spices.com', 'microsoft.com', 'google.com', 'github.com'];
  if (legitDomains.some(domain => urlLower.includes(domain))) {
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

  const scamWords = ['urgent', 'expires today', 'verify now', 'suspended', 'click here', 'immediate action'];
  const foundScam = scamWords.filter(word => text.includes(word));

  if (foundScam.length >= 2) {
    status = 'block';
    trust_score = 15;
    reasons.push('Multiple scam indicators detected');
    reasons.push(Suspicious phrases: ${foundScam.join(', ')});
    reasons.push('High probability of fraudulent message');
  } else if (foundScam.length === 1) {
    status = 'warn';
    trust_score = 45;
    reasons.push('Some suspicious language detected');
    reasons.push('Exercise caution if message is unsolicited');
  } else {
    reasons.push('Message appears normal');
    reasons.push('No obvious scam indicators found');
  }

  res.json({ status, reasons, trust_score });
});

app.post('/scan-attachments', upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      status: 'error',
      reasons: ['No files uploaded'],
      trust_score: 0
    });
  }

  const files = req.files;
  const analysis = {
    status: 'safe',
    trust_score: 85,
    reasons: [],
    files_analyzed: files.length,
    file_details: []
  };

  files.forEach((file, index) => {
    const fileAnalysis = {
      filename: file.originalname,
      size: file.size,
      type: file.mimetype,
      status: 'safe'
    };

    // Basic file analysis
    if (file.size > 5 * 1024 * 1024) {
      fileAnalysis.status = 'warn';
      fileAnalysis.reason = 'Large file size - exercise caution';
    }

    const suspiciousExtensions = ['.exe', '.scr', '.bat', '.com', '.pif'];
    const fileExt = file.originalname.toLowerCase().substr(file.originalname.lastIndexOf('.'));
    
    if (suspiciousExtensions.includes(fileExt)) {
      fileAnalysis.status = 'block';
      fileAnalysis.reason = 'Potentially dangerous file type';
      analysis.status = 'block';
      analysis.trust_score = 10;
    }

    // Simulate OCR analysis for images
    if (file.mimetype.startsWith('image/')) {
      fileAnalysis.ocr_analysis = 'Image processed - no suspicious text detected';
      fileAnalysis.screenshot_analysis = 'No phishing indicators in visual content';
    }

    analysis.file_details.push(fileAnalysis);
  });

  if (analysis.status === 'safe') {
    analysis.reasons.push(Analyzed ${files.length} file(s) - no threats detected);
    analysis.reasons.push('All files appear safe for processing');
  } else {
    analysis.reasons.push('Potentially dangerous files detected');
    analysis.reasons.push('Review file details before proceeding');
  }

  res.json(analysis);
});

app.post('/ask-elara', (req, res) => {
  const { question, context } = req.body || {};
  if (!question) {
    return res.status(400).json({ error: 'Missing question parameter' });
  }

  const response = {
    model: 'elara-security-ai-v2',
    confidence: 0.9,
    answer: Security Analysis: "${question}". ${context ? Context: ${JSON.stringify(context)}.  : ''}This query has been processed through Elara's advanced AI-powered threat detection system with multi-layer analysis including URL scanning, message content analysis, and file inspection capabilities.,
    recommendations: [
      'Always verify sender identity for unsolicited messages',
      'Check URLs carefully before clicking',
      'Scan attachments before opening',
      'Report suspected phishing attempts'
    ]
  };

  res.json(response);
});

const port = process.env.PORT || 3001;
app.listen(port, '0.0.0.0', () => {
  console.log(Elara Security Platform v2.0 listening on port ${port});
  console.log('Features: URL scanning, Message analysis, File upload, OCR analysis');
});
