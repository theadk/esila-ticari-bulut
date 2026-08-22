import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

async function test() {
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL });
  try {
    const [rows] = await pool.query('SELECT companyLogo FROM settings');
    console.log(rows);
  } catch (e) { console.error(e); }
  process.exit(0);
}
test();
