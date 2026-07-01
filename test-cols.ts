import { initDb, getPool } from "./server/db.js";

async function run() {
  await initDb();
  const pool = getPool();
  const [rows] = await pool.query("SHOW COLUMNS FROM `settings`");
  console.log(rows.map((r: any) => r.Field));
  process.exit(0);
}
run().catch(console.error);
