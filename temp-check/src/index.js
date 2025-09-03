
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import path from 'node:path';
import fs from 'node:fs';
import { scanLinkHandler } from './routes/scanLink.js';
import { scanMessageHandler } from './routes/scanMessage.js';
import { scanFileHandler } from './routes/scanFile.js';
import { askElaraHandler } from './routes/askElara.js';

const log = pino({ level: 'info' });
const app = express();

app.use(cors({ origin: process.env.ALLOW_ORIGIN || '*' }));
app.use(express.json({ limit: '2mb' }));

const dataDir = process.env.DATA_DIR || './data';
const publicDir = path.join(dataDir, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
app.use('/files', express.static(publicDir));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.post('/scan-link', scanLinkHandler);
app.post('/scan-message', scanMessageHandler);
app.post('/scan-file', scanFileHandler);
app.post('/ask-elara', askElaraHandler);

app.get('/admin/health', (_req, res) => {
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(dataDir, 'threats_meta.json'), 'utf-8'));
    res.json({ feeds: meta, ok: true });
  } catch {
    res.json({ feeds: {}, ok: true });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => log.info({ port }, 'API listening'));
