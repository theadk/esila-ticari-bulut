require('dotenv').config();
const mysql = require('mysql2/promise');
async function main() {
  if (!process.env.DATABASE_URL) { console.log("No DB"); return; }
  const pool = mysql.createPool(process.env.DATABASE_URL);
  try {
    const [rows] = await pool.query("SHOW COLUMNS FROM customers LIKE 'installments'");
    console.log("Installments column:", rows);
    const [rows2] = await pool.query("SHOW COLUMNS FROM customers");
    console.log("Columns:", rows2.map(r => r.Field));
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
main();
