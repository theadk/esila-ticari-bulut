import mysql from 'mysql2/promise';
async function run() {
  const pool = mysql.createPool("mysql://esilayaz_esilaticari:q7D6%24ry84@esilayazilim.com:3306/esilayaz_esilaticari");
  const [rows] = await pool.query("SHOW CREATE TABLE orders");
  console.log(rows[0]['Create Table']);
  process.exit(0);
}
run();
