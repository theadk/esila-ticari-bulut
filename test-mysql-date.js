import { getPool } from './server/db.js';

async function test() {
  try {
    const pool = getPool();
    const dateStr = new Date().toISOString();
    console.log("Testing insert with:", dateStr);
    await pool.query(`INSERT IGNORE INTO orders (vkn, id, date) VALUES ('111', 'test-date-1', ?)`, [dateStr]);
    const [rows] = await pool.query(`SELECT id, date FROM orders WHERE id = 'test-date-1'`);
    console.log("Result:", rows);
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit();
}

test();
