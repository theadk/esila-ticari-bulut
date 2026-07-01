const mysql = require('mysql2/promise');
require('dotenv').config({ override: true });
async function run() {
  const pool = mysql.createPool(process.env.DATABASE_URL);
  try {
    const vkn = "1111111111";
    const date = new Date().toISOString();
    const query = "INSERT INTO orders (vkn, id, date, customerId) VALUES (?, ?, ?, ?)";
    await pool.query(query, [vkn, "SIP-TEST-349", date, "CUS-1782415367930"]);
    console.log("Success! Date:", date);
  } catch(e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
run();
