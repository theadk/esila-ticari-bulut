require('dotenv').config();
const mysql = require('mysql2/promise');
async function test() {
  if (!process.env.DATABASE_URL) {
     console.log("No DB URL");
     process.exit(0);
  }
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL });
  const [rows] = await pool.query('SELECT companyLogo FROM settings');
  console.log(rows);
  process.exit(0);
}
test();
