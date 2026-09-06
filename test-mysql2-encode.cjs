const mysql = require('mysql2/promise');
const url = "mysql://esilayaz_esilaticari:Korkmaz66%2A%2A@esilayazilim.com:3306/esilayaz_esilaticari";
async function test() {
  console.log("URL is:", url);
  try {
    const pool = mysql.createPool(url);
    const conn = await pool.getConnection();
    console.log("SUCCESS!");
    conn.release();
    process.exit(0);
  } catch(e) {
    console.error("FAIL:", e.message);
    process.exit(1);
  }
}
test();
