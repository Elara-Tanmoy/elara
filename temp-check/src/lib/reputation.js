
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const dataDir = process.env.DATA_DIR || './data';
const threatsPath = path.join(dataDir, 'threats.json');

let cache = { set: new Set(), ts: 0 };
function loadThreats() {
  try {
    const raw = fs.readFileSync(threatsPath, 'utf-8');
    const list = JSON.parse(raw);
    cache = { set: new Set(list), ts: Date.now() };
  } catch {
    cache = { set: new Set(), ts: 0 };
  }
}
loadThreats();

export function reputationLookup(urlStr) {
  if (!cache.ts) loadThreats();
  try {
    const host = new URL(urlStr).hostname;
    const h = createHash('sha256').update(host).digest('hex').slice(0, 16);
    const hit = cache.set.has(h);
    return { hit, sources: hit ? ['feed'] : [] };
  } catch {
    return { hit: false, sources: [] };
  }
}

export function rememberThreatHost(hostname) {
  const h = createHash('sha256').update(hostname).digest('hex').slice(0, 16);
  cache.set.add(h);
  try { fs.mkdirSync(dataDir, { recursive: true }); } catch {}
  fs.writeFileSync(threatsPath, JSON.stringify([...cache.set], null, 2));
}
