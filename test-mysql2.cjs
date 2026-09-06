const mysql = require('mysql2/promise');
require('dotenv').config({ override: true });

async function test() {
  const url = process.env.DATABASE_URL;
  console.log("URL is:", url);
  try {
    const pool = mysql.createPool(url);
    const conn = await pool.getConnection();
    console.log("SUCCESS!");
    conn.release();
    process.exit(0);
  } catch(e) {
    console.error("FAIL:", e.message);
    process.exit(1);
  }
}
test();
