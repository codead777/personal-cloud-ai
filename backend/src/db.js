const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

// Idempotent migration, retried until Postgres accepts connections.
async function migrate(retries = 20) {
  const sql = fs.readFileSync(path.join(__dirname, '../migrations/init.sql'), 'utf8');
  for (let i = 1; ; i++) {
    try { await pool.query(sql); return; }
    catch (e) {
      if (i >= retries) throw e;
      console.log(`Database not ready (${e.message}) - retry ${i}/${retries}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

module.exports = { query: (t, p) => pool.query(t, p), pool, migrate };
