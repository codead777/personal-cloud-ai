require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const s3 = require('./s3');
const { wrap } = require('./util');

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many attempts - try again in a few minutes' } }), require('./routes/auth'));
app.use('/api/files', require('./routes/files'));
app.use('/api/search', require('./routes/search'));

// Internal callback from the AI service (shared-secret protected, not proxied by nginx).
app.post('/internal/save-embedding', (req, res, next) =>
  req.get('x-internal-token') && req.get('x-internal-token') === process.env.INTERNAL_TOKEN ? next() : res.sendStatus(403),
  wrap(async (req, res) => {
    const { id, embedding, tags, status } = req.body;
    if (!/^[0-9a-f-]{36}$/i.test(String(id))) return res.status(400).json({ error: 'bad id' });
    if (status === 'failed' || !embedding) {
      await db.query("UPDATE files SET ai_status='failed' WHERE id=$1", [id]);
      return res.json({ ok: true });
    }
    if (!Array.isArray(embedding) || embedding.length !== 384 || !embedding.every(Number.isFinite))
      return res.status(400).json({ error: 'bad embedding' });
    const cleanTags = (Array.isArray(tags) ? tags : []).map(t => String(t).slice(0, 40)).slice(0, 12);
    await db.query("UPDATE files SET embedding=$1::vector, tags=$2, ai_status='done' WHERE id=$3",
      [JSON.stringify(embedding), cleanTags, id]);
    res.json({ ok: true });
  }));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side' });
});

const port = process.env.BACKEND_PORT || 5000;
(async () => {
  await db.migrate();
  await s3.ensureBucket();
  app.listen(port, '0.0.0.0', () => console.log('Backend listening on', port));
})().catch(e => { console.error('Startup failed:', e); process.exit(1); });
