require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const filesRouter = require('./routes/files');
const searchRouter = require('./routes/search');
const { createUser, verifyUser } = require('./auth');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  try { const user = await createUser(email, password); res.json({ id: user.id, email: user.email }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const ok = await verifyUser(email, password);
  if (!ok) return res.status(401).json({ error: 'invalid' });
  res.json(ok);
});

app.use('/api/files', filesRouter);
app.use('/api/search', searchRouter);

// internal endpoint used by AI service to store embeddings/tags
app.post('/internal/save-embedding', async (req, res) => {
  const { id, embedding, tags } = req.body;
  try {
    await db.query('UPDATE files SET embedding=$1, tags=$2 WHERE id=$3', [embedding, tags, id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const port = process.env.BACKEND_PORT || 5000;
app.listen(port, () => console.log('Backend listening on', port));
