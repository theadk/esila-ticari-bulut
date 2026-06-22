import fs from 'fs';
import mysql from 'mysql2/promise';

async function resetAndRestore() {
  console.log("Connecting to the new MySQL server...");
  const pool = mysql.createPool('mysql://esilayaz_esilaticari:Korkmaz66%2A%2A@esilayazilim.com:3306/esilayaz_esilaticari');
  
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  
  console.log("Fetching all tables...");
  const [rows] = await pool.query('SHOW TABLES');
  const tableNames = rows.map((r) => Object.values(r)[0]);
  
  for (const table of tableNames) {
    if (table) {
      console.log(`Dropping table ${table}...`);
      await pool.query(`DROP TABLE IF EXISTS \`${table}\``);
    }
  }
  
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log("All tables dropped cleanly.");
  
  // Now schema script usually creates them, but let's let server.ts do its initDb instead or run it here.
  const schemaSql = fs.readFileSync('esila_ticari_schema.sql', 'utf8');
  const statements = schemaSql.split(';').filter((s) => s.trim().length > 0);
  console.log(`Creating tables from schema (${statements.length} statements)...`);
  for (const stmt of statements) {
    await pool.query(stmt);
  }
  
  console.log("Schema created successfully.");
  pool.end();
}

resetAndRestore().catch(console.error);
