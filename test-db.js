import { config } from 'dotenv';
import mysql from 'mysql2/promise';

config();

async function test() {
  console.log("URL:", process.env.DATABASE_URL);
  try {
    const pool = mysql.createPool(process.env.DATABASE_URL);
    const connection = await pool.getConnection();
    console.log("Successfully connected to the database!");
    connection.release();
    process.exit(0);
  } catch(e) {
    console.error("DB Connection Error:", e.message);
    process.exit(1);
  }
}
test();
