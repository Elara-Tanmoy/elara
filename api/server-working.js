const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString(), provider: 'elara-working' });
});

app.post('/scan-link', (req, res) => {
  const url = req.body.url || '';
  const safe = !url.includes('auth-') && !url.includes('login-');
  res.json({
    status: safe ? 'safe' : 'block',
    trust_score: safe ? 90 : 10,
    reasons: [safe ? 'URL appears safe' : 'Suspicious phishing patterns detected']
  });
});

app.post('/scan-message', (req, res) => {
  const content = req.body.content || '';
  const safe = !content.toLowerCase().includes('urgent');
  res.json({
    status: safe ? 'safe' : 'warn',
    trust_score: safe ? 85 : 40,
    reasons: [safe ? 'Message appears normal' : 'Contains urgency indicators']
  });
});

app.listen(process.env.PORT || 3001, () => console.log('Elara working'));
