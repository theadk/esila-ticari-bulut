import { getPool } from './server/db.js';

async function test() {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM orders ORDER BY date DESC LIMIT 5');
    console.log(rows);
  } catch (e) {
    console.error(e);
  }
  process.exit();
}

test();
