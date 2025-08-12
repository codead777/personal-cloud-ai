const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth');
const fetch = require('node-fetch');

const router = express.Router();

// Natural language search: forward query to AI service to get embedding, then nearest neighbor in Postgres pgvector
router.get('/', authMiddleware, async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'no query' });
  // get embedding from AI service
  const r = await fetch(`${process.env.AI_SERVICE_URL}/embed-text`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: q })
  });
  const { embedding } = await r.json();
  // Search in Postgres using cosine distance
  const sql = `SELECT id, filename, tags, size, created_at, embedding <#> $1 as distance FROM files WHERE user_id=$2 ORDER BY embedding <#> $1 LIMIT 10`;
  const result = await db.query(sql, [embedding, req.user.id]);
  res.json(result.rows);
});

module.exports = router;
