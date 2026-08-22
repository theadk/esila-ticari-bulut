import { getPool, initDb } from './server/db.js';
async function main() {
  await initDb();
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM _migrations');
  console.log(rows);
  process.exit(0);
}
main();
