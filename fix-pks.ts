import { config as dotenvConfig } from "dotenv";
dotenvConfig({ override: true });
import { initDb, getPool } from "./server/db.js";

async function run() {
  await initDb();
  const pool = getPool();
  const tablesToFix = [
    'orders', 'proposals', 'e_invoices', 'reconciliations', 'service_tickets'
  ];
  
  for (const table of tablesToFix) {
    try {
      await pool.query(`ALTER TABLE ${table} DROP PRIMARY KEY, ADD PRIMARY KEY(vkn, id)`);
      console.log(`Fixed PK for ${table}`);
    } catch (err: any) {
      console.error(`Error fixing ${table}:`, err.message);
    }
  }
  process.exit(0);
}
run();
