const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const db = require('../db');
const { uploadBuffer, presignedUrl } = require('../s3');
const { authMiddleware } = require('../auth');
const fetch = require('node-fetch');

const router = express.Router();

// Upload
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'no file' });
  const s3Key = `${req.user.id}/${Date.now()}-${file.originalname}`;
  await uploadBuffer(process.env.S3_BUCKET, s3Key, file.buffer, file.mimetype);
  const result = await db.query(
    'INSERT INTO files (user_id, s3_key, filename, size, mime) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.user.id, s3Key, file.originalname, file.size, file.mimetype]
  );
  const row = result.rows[0];
  // Call AI service asynchronously
  fetch(`${process.env.AI_SERVICE_URL}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: row.id, s3_key: s3Key, filename: row.filename })
  }).catch(err => console.error('AI call failed', err));
  res.json(row);
});

// List
router.get('/', authMiddleware, async (req, res) => {
  const r = await db.query('SELECT id, filename, size, mime, tags, created_at FROM files WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
  res.json(r.rows);
});

// Download (presigned)
router.get('/:id/download', authMiddleware, async (req, res) => {
  const r = await db.query('SELECT s3_key FROM files WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  if (!r.rowCount) return res.status(404).json({ error:'not found' });
  const key = r.rows[0].s3_key;
  const url = presignedUrl(process.env.S3_BUCKET, key);
  res.json({ url });
});

// Delete
router.delete('/:id', authMiddleware, async (req, res) => {
  await db.query('DELETE FROM files WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
