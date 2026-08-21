const mysql = require('mysql2/promise');
async function main() {
  const url = "mysql://esilayaz_esilaticari:q7D6%24ry84@esilayazilim.com:3306/esilayaz_esilaticari";
  const pool = mysql.createPool(url);
  try {
    await pool.query("ALTER TABLE customers ADD COLUMN installments JSON");
    console.log("Column added.");
  } catch(e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
main();
