
import { normalizeUrl, fingerprint, heuristics, decision } from '../lib/heuristics.js';
import { reputationLookup } from '../lib/reputation.js';
import { getCache, setCache } from '../lib/cache.js';

export async function scanLinkHandler(req, res) {
  const raw = (req.body && req.body.url) || '';
  const norm = normalizeUrl(raw);
  if (!norm) return res.status(400).json({ error: 'invalid_url' });

  const key = `v1:${fingerprint(norm)}`;
  const cached = await getCache(key);
  if (cached) return res.json(cached);

  const u = new URL(norm);
  const h = heuristics(u);
  const rep = reputationLookup(norm);
  const d = decision(h.score, rep.hit);

  const payload = {
    verdict: d.verdict,
    confidence: d.confidence,
    reasons: [...h.reasons, ...(rep.hit ? ['threat-intel-hit'] : [])].slice(0,3),
    ttl_sec: d.verdict === 'safe' ? 3600 : 21600,
    host: u.hostname
  };

  await setCache(key, payload, payload.ttl_sec);
  return res.json(payload);
}
