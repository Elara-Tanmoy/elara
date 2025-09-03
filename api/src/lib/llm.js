
import { request } from 'undici';

function redact(input=''){
  // Remove emails, long numbers, and full URLs to reduce PII/leakage
  return (input||'')
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/ig, '[redacted-email]')
    .replace(/https?:\/\/[^\s)]+/ig, '[redacted-url]')
    .replace(/\b\d{6,}\b/g, '[redacted-number]');
}

function sanitizeOutput(text=''){
  // Remove clickable links and force plain guidance
  return (text||'').replace(/https?:\/\/[^\s)]+/ig, '[link removed]');
}

async function callAzureOpenAI(prompt, lang='en'){
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  if(!endpoint || !deployment || !apiKey) throw new Error('Azure OpenAI not configured');

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  const body = {
    messages: [
      { role: "system", content: `You are Elara, a scam-prevention assistant. Answer in ${lang}. Be concise, clear, and NEVER include live or clickable links.` },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 250
  };

  const res = await request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify(body)
  });
  if(res.statusCode >= 300) throw new Error('Azure OpenAI error ' + res.statusCode);
  const data = await res.body.json();
  return sanitizeOutput(data.choices?.[0]?.message?.content || '');
}

async function callOpenAI(prompt, lang='en'){
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  if(!apiKey) throw new Error('OpenAI not configured');

  const res = await request('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: `You are Elara, a scam-prevention assistant. Answer in ${lang}. Be concise, clear, and NEVER include live or clickable links.` },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 250
    })
  });
  if(res.statusCode >= 300) throw new Error('OpenAI error ' + res.statusCode);
  const data = await res.body.json();
  return sanitizeOutput(data.choices?.[0]?.message?.content || '');
}

async function callXAI(prompt, lang='en'){
  const apiKey = process.env.XAI_API_KEY;
  const model = process.env.XAI_MODEL || 'grok-beta';
  if(!apiKey) throw new Error('xAI not configured');

  const res = await request('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: `You are Elara, a scam-prevention assistant. Answer in ${lang}. Be concise, clear, and NEVER include live or clickable links.` },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 250
    })
  });
  if(res.statusCode >= 300) throw new Error('xAI error ' + res.statusCode);
  const data = await res.body.json();
  return sanitizeOutput(data.choices?.[0]?.message?.content || '');
}

export async function explainDecision({ url, verdict, reasons=[], tips=[], lang='en' }){
  const provider = (process.env.LLM_PROVIDER || '').toLowerCase();
  const safeUrl = (url || '').replace(/https?:\/\/[^\s)]+/ig, '[redacted-url]');
  const prompt = redact(
`User asked why this is ${verdict.toUpperCase()}.
URL: ${safeUrl}
Reasons so far: ${reasons.join(', ') || 'none'}
Give 3 short bullets on risks + 2 safe next actions. Do not include live links.`);

  try {
    if (provider === 'azure_openai') return await callAzureOpenAI(prompt, lang);
    if (provider === 'openai') return await callOpenAI(prompt, lang);
    if (provider === 'xai') return await callXAI(prompt, lang);
    // If not configured, synthesize guidance
    return [
      `• This appears risky because: ${reasons.slice(0,3).join(', ') || 'suspicious patterns detected'}.`,
      '• The domain or path structure looks unusual for the claimed brand.',
      '• Links in messages can lead to fake login pages.',
      'Next: open the official site by typing the address; verify with the organization through trusted channels.'
    ].join('\n');
  } catch (e) {
    // Fallback if API call fails
    return [
      '• Unable to reach the explanation service right now.',
      `• Risk factors so far: ${reasons.slice(0,3).join(', ') || 'unusual patterns'}.`,
      'Next: avoid clicking the link; go to the official website directly.'
    ].join('\n');
  }
}
