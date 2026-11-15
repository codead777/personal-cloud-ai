const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth');
const { wrap } = require('../util');

const router = express.Router();
const MIN_SCORE = 0.2;

router.get('/', authMiddleware, wrap(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 200);
  if (!q) return res.status(400).json({ error: 'Type something to search for' });

  let embedding;
  try {
    const r = await fetch(`${process.env.AI_SERVICE_URL}/embed-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: q }),
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    ({ embedding } = await r.json());
  } catch (e) {
    console.error('Embedding service error:', e.message);
    return res.status(503).json({ error: 'Smart search is warming up - try again in a moment' });
  }

  const vec = JSON.stringify(embedding); // pgvector literal: [0.1,0.2,...]
  const { rows } = await db.query(
    `SELECT id, filename, size, mime, tags, ai_status, created_at,
            1 - (embedding <=> $1::vector) AS score
       FROM files
      WHERE user_id = $2 AND embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT 20`, [vec, req.user.id]);
  res.json(rows.filter(r => r.score >= MIN_SCORE));
}));

module.exports = router;
