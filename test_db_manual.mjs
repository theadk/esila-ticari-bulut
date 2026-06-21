import fs from 'fs';
import mysql from 'mysql2/promise';

async function check() {
  const envFile = fs.readFileSync('.env', 'utf-8');
  let connectionString = '';
  envFile.split('\n').forEach(line => {
    if (line.startsWith('DATABASE_URL=')) {
       connectionString = line.split('=')[1].trim().replace(/"/g, '');
    }
  });

  console.log("Connecting to:", connectionString);
  try {
     const conn = await mysql.createConnection(connectionString);
     const [rows] = await conn.query("SHOW TABLES");
     console.log("Tables:", rows);
     const [count] = await conn.query("SELECT COUNT(*) FROM products");
     console.log("Products Count:", count);
     conn.end();
  } catch (err) {
     console.error("Error:", err.message);
  }
}
check();
