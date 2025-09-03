
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { request } from 'undici';
import { createHash } from 'node:crypto';

const dataDir = process.env.DATA_DIR || './data';
fs.mkdirSync(dataDir, { recursive: true });

function hostHash(host) {
  return createHash('sha256').update(host).digest('hex').slice(0,16);
}

async function fetchText(url) {
  const res = await request(url);
  if (res.statusCode !== 200) throw new Error('fetch failed ' + url);
  return await res.body.text();
}

function extractHostsFromCSV(csv) {
  const hosts = new Set();
  const lines = csv.split(/\r?\n/);
  for (const line of lines) {
    const url = line.trim().split(',')[0];
    if (!url || url.startsWith('url')) continue;
    try { const u = new URL(url); hosts.add(u.hostname); } catch {}
  }
  return hosts;
}

function extractHostsFromTXT(txt) {
  const hosts = new Set();
  const lines = txt.split(/\r?\n/);
  for (const line of lines) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    try { const u = new URL(s); hosts.add(u.hostname); } catch {}
  }
  return hosts;
}

async function main() {
  const set = new Set();
  let meta = { openphish: null, urlhaus: null };

  try {
    const op = await fetchText('https://openphish.com/feed.txt');
    for (const h of extractHostsFromTXT(op)) set.add(hostHash(h));
    meta.openphish = new Date().toISOString();
  } catch (e) { console.error('OpenPhish fetch error', e.message); }

  try {
    const uh = await fetchText('https://urlhaus.abuse.ch/downloads/csv_recent/');
    for (const h of extractHostsFromCSV(uh)) set.add(hostHash(h));
    meta.urlhaus = new Date().toISOString();
  } catch (e) { console.error('URLhaus fetch error', e.message); }

  fs.writeFileSync(path.join(dataDir, 'threats.json'), JSON.stringify([...set], null, 2));
  fs.writeFileSync(path.join(dataDir, 'threats_meta.json'), JSON.stringify(meta, null, 2));
  console.log('Feeds updated', meta);
}

main().catch(e => { console.error(e); process.exit(1); });
