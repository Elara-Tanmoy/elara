
import { parse } from 'tldts';

export function normalizeUrl(raw) {
  try {
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol)) return null;
    u.hash = '';
    return u.toString();
  } catch { return null; }
}

export function fingerprint(normalized) {
  const u = new URL(normalized);
  const { domainWithoutSuffix } = parse(u.hostname);
  const pathShape = u.pathname.replace(/[\w-]+/g, ':s');
  const keys = [...u.searchParams.keys()].sort().join(',');
  return `${domainWithoutSuffix || u.hostname}:${pathShape}?${keys}`;
}

export function heuristics(u) {
  const reasons = [];
  let score = 0;

  if (/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)) { reasons.push('ip-in-url'); score += 40; }
  if (/(\.zip|\.country|\.cyou)$/i.test(u.hostname)) { reasons.push('odd-tld'); score += 15; }
  if (u.hostname.split('.').length > 4) { reasons.push('deep-subdomain'); score += 10; }
  if (u.hostname.startsWith('xn--')) { reasons.push('punycode'); score += 20; }
  if (u.protocol === 'http:') { reasons.push('no-https'); score += 10; }

  return { score, reasons };
}

export function decision(score, intelHit=false) {
  if (intelHit || score >= 50) return { verdict: 'block', confidence: 0.98 };
  if (score >= 25) return { verdict: 'warn', confidence: 0.85 };
  return { verdict: 'safe', confidence: 0.92 };
}
