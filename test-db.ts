import { getPool, initDb } from "./server/db.js";

async function run() {
  await initDb();
  
  const pool = getPool();
  try {
    const [rows] = await pool.query("SHOW TABLES");
    console.log("Tables in database:", rows);
  } catch (e: any) {
    console.log("Error showing tables:", e.message);
  }

  console.log("Done");
  process.exit(0);
}
run();
