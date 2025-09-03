
import Busboy from 'busboy';
import fs from 'node:fs';
import path from 'node:path';
import { lookup as mimeLookup } from 'mime-types';

const dataDir = process.env.DATA_DIR || './data';
const publicDir = path.join(dataDir, 'public');

export async function scanFileHandler(req, res) {
  const bb = Busboy({ headers: req.headers, limits: { files: 1, fileSize: 5 * 1024 * 1024 } }); // 5MB
  let fileInfo = null;
  let tmpPath = null;

  bb.on('file', (name, file, info) => {
    const { filename, mimeType } = info;
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    tmpPath = path.join(publicDir, Date.now() + '-' + safeName);
    const writeStream = fs.createWriteStream(tmpPath);
    file.pipe(writeStream);
    fileInfo = { filename: safeName, mimeType };
  });

  bb.on('finish', () => {
    if (!fileInfo || !tmpPath) return res.status(400).json({ error: 'no_file' });
    const ext = path.extname(fileInfo.filename).toLowerCase().replace('.', '');
    const mimeByExt = mimeLookup(ext) || 'application/octet-stream';
    const flags = [];
    if (fileInfo.mimeType !== mimeByExt) flags.push('mime-mismatch');
    if (/(\.docm|\.xlsm|\.pptm)$/i.test(fileInfo.filename)) flags.push('macro-file');
    const safeViewUrl = '/files/' + path.basename(tmpPath);
    return res.json({ safe_view_url: safeViewUrl, flags });
  });

  req.pipe(bb);
}
