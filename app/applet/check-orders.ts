import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config({ override: true });

async function run() {
  const pool = mysql.createPool(process.env.DATABASE_URL);
  const [rows] = await pool.query("SHOW COLUMNS FROM orders");
  console.log(rows);
  process.exit(0);
}
run();
