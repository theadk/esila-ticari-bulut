const mysql = require("mysql2/promise");
require("dotenv").config({ override: true });
async function run() {
  const pool = mysql.createPool(process.env.DATABASE_URL);
  const [rows] = await pool.query("SELECT * FROM orders ORDER BY date DESC LIMIT 5");
  console.log("Latest orders:", JSON.stringify(rows, null, 2));
  process.exit(0);
}
run();
