const mysql = require('mysql2/promise');
async function main() {
  const url = "mysql://esilayaz_esilaticari:q7D6%24ry84@esilayazilim.com:3306/esilayaz_esilaticari";
  const pool = mysql.createPool(url);
  try {
    const [rows] = await pool.query("SELECT id, installments FROM customers WHERE id = 'TEST11'");
    console.log(rows);
  } catch(e) { console.error(e); }
  process.exit(0);
}
main();
