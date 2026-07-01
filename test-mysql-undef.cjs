const mysql = require('mysql2/promise');
require('dotenv').config({ override: true });
async function run() {
  const pool = mysql.createPool(process.env.DATABASE_URL);
  try {
    await pool.query('SELECT ? AS val', [undefined]);
    console.log("Success");
  } catch(e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
run();
