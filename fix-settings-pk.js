import { getPool, initDb } from './server/db.js';

async function run() {
  await initDb();
  const pool = getPool();
  try {
    await pool.query('ALTER TABLE settings DROP PRIMARY KEY, ADD PRIMARY KEY (vkn, id)');
    console.log("Settings PK updated");
  } catch(e) {
    console.error(e.message);
  }
  process.exit();
}
run();
