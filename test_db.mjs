import dotenv from 'dotenv';
dotenv.config();

import mysql from 'mysql2/promise';

async function check() {
  const connectionString = process.env.DATABASE_URL.replace(/"/g, '');
  console.log("Connecting to:", connectionString);
  try {
     const conn = await mysql.createConnection(connectionString);
     const [rows] = await conn.query("SHOW TABLES");
     console.log("Tables:", rows);
     conn.end();
  } catch (err) {
     console.error("Error:", err.message);
  }
}
check();
