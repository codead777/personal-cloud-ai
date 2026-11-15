const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 16) {
  console.error('JWT_SECRET is missing or shorter than 16 characters. Set it in .env');
  process.exit(1);
}

const sign = user => jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '7d' });

function authMiddleware(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Please log in' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: 'Session expired - please log in again' }); }
}

module.exports = { sign, authMiddleware };
