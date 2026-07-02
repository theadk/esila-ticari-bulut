import { getPool } from "./server/db.ts";
import { config } from "dotenv";
config();
async function test() {
  const pool = getPool();
  try {
    const [rows] = await pool.query("SHOW COLUMNS FROM orders");
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
test();
