const mysql = require("mysql2/promise");
require("dotenv").config({ override: true });
async function run() {
  const pool = mysql.createPool(process.env.DATABASE_URL);
  const [rows] = await pool.query("SHOW COLUMNS FROM products");
  console.log(rows);
  process.exit(0);
}
run();
