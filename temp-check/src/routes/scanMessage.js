
export async function scanMessageHandler(req, res) {
  const text = (req.body && req.body.text) || '';
  if (!text) return res.status(400).json({ error: 'no_text' });
  const flags = [];
  let score = 0;
  if (/urgent|immediately|act now|limited time/i.test(text)) { flags.push('urgency'); score += 25; }
  if (/password|otp|one-time code|verify account/i.test(text)) { flags.push('credential-request'); score += 35; }
  if (/gift card|bitcoin|wire transfer|bank transfer/i.test(text)) { flags.push('payment-request'); score += 30; }
  const trust = Math.max(0, 100 - score);
  return res.json({ trust_score: trust, flags, guidance: trust < 60 ? 'Do not respond; verify via official channels.' : 'Looks okay; still verify sender.' });
}
