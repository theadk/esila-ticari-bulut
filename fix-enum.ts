import { config as dotenvConfig } from "dotenv";
dotenvConfig({ override: true });
import { initDb, getPool } from "./server/db.js";

async function run() {
  await initDb();
  const pool = getPool();
  try {
    await pool.query("ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) DEFAULT 'Bekliyor'");
    console.log("SUCCESS");
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
