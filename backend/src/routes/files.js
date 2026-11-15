const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const db = require('../db');
const s3 = require('../s3');
const { authMiddleware } = require('../auth');
const { wrap } = require('../util');

const MAX_MB = Number(process.env.MAX_UPLOAD_MB) || 50;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 } });
const router = express.Router();
router.use(authMiddleware);

router.param('id', (req, res, next, id) =>
  /^[0-9a-f-]{36}$/i.test(id) ? next() : res.status(400).json({ error: 'Invalid file id' }));

const COLUMNS = 'id, filename, size, mime, tags, ai_status, created_at';

router.post('/', (req, res, next) => upload.single('file')(req, res, err => {
  if (!err) return next();
  const tooBig = err.code === 'LIMIT_FILE_SIZE';
  res.status(tooBig ? 413 : 400).json({ error: tooBig ? `File is larger than ${MAX_MB} MB` : err.message });
}), wrap(async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Choose a file to upload' });
  // multer reads names as latin1; restore UTF-8 so non-English filenames survive.
  const filename = Buffer.from(file.originalname, 'latin1').toString('utf8').slice(0, 255);
  const safe = filename.replace(/[^\w.\-]+/g, '_');
  const key = `${req.user.id}/${crypto.randomUUID()}-${safe}`;

  await s3.upload(key, file.buffer, file.mimetype);
  const { rows } = await db.query(
    `INSERT INTO files (user_id, s3_key, filename, size, mime) VALUES ($1,$2,$3,$4,$5) RETURNING ${COLUMNS}`,
    [req.user.id, key, filename, file.size, file.mimetype]);
  const row = rows[0];

  // Fire-and-forget: the AI service replies 202 and calls back when done.
  fetch(`${process.env.AI_SERVICE_URL}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: row.id, s3_key: key, filename, mime: file.mimetype }),
    signal: AbortSignal.timeout(5000)
  }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); })
    .catch(async err => {
      console.error('AI call failed:', err.message);
      await db.query("UPDATE files SET ai_status='failed' WHERE id=$1", [row.id]).catch(() => {});
    });

  res.status(201).json(row);
}));

router.get('/', wrap(async (req, res) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM files WHERE user_id=$1 ORDER BY created_at DESC LIMIT 500`, [req.user.id]);
  res.json(rows);
}));

router.get('/:id/download', wrap(async (req, res) => {
  const { rows } = await db.query(
    'UPDATE files SET last_accessed=now() WHERE id=$1 AND user_id=$2 RETURNING s3_key, filename',
    [req.params.id, req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'File not found' });
  res.json({ url: await s3.presign(rows[0].s3_key, rows[0].filename) });
}));

router.delete('/:id', wrap(async (req, res) => {
  const { rows } = await db.query('DELETE FROM files WHERE id=$1 AND user_id=$2 RETURNING s3_key', [req.params.id, req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'File not found' });
  await s3.remove(rows[0].s3_key).catch(e => console.error('S3 delete failed:', e.message));
  res.json({ ok: true });
}));

module.exports = router;
