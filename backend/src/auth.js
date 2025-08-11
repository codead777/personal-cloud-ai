const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');

async function createUser(email, password) {
  const hash = await bcrypt.hash(password, 10);
  const res = await db.query('INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING *', [email, hash]);
  return res.rows[0];
}

async function verifyUser(email, password) {
  const res = await db.query('SELECT * FROM users WHERE email=$1', [email]);
  const user = res.rows[0];
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { token, user };
}

function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'unauth' });
  const token = h.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; next();
  } catch (e) { return res.status(401).json({ error: 'invalid token' }) }
}

module.exports = { createUser, verifyUser, authMiddleware };
