require('dotenv').config({ path: '/app/applet/.env' });
const mysql = require('mysql2/promise');
async function main() {
  let url = process.env.DATABASE_URL;
  if (!url) { console.log("No DB"); return; }
  if (url.startsWith('"') && url.endsWith('"')) { url = url.slice(1, -1); }
  const pool = mysql.createPool(url);
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
