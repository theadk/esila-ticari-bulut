import { getPool } from './server/db.js';

async function test() {
  const pool = getPool();
  try {
     const [rows] = await pool.query('SELECT 1');
     console.log("SUCCESS:", rows);
     process.exit(0);
  } catch (e) {
     console.error("FAIL:", e);
     process.exit(1);
  }
}
test();
