import { getPool } from "./server/db.js";
import { config } from "dotenv";
config({ override: true });

async function run() {
  const pool = getPool();
  const [rows] = await pool.query("SELECT * FROM orders ORDER BY date DESC LIMIT 5");
  console.log("Latest orders:", JSON.stringify(rows, null, 2));
  process.exit(0);
}
run();
