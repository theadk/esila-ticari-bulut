const mysql = require('mysql2/promise');

async function test() {
  const url = "mysql://esilayaz_esilaticari:Korkmaz66**@www.esilayazilim.com:3306/esilayaz_esilaticari";
  console.log("Connecting to:", url);
  try {
    const pool = mysql.createPool({
      uri: url,
      connectTimeout: 20000,
      ssl: { rejectUnauthorized: false }
    });
    const [rows] = await pool.query('SELECT 1 as val');
    console.log("Connection successful! Result:", rows);
    await pool.end();
  } catch (err) {
    console.error("Connection failed:", err);
  }
}

test();
