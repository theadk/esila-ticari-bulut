import mysql from 'mysql2/promise';
async function run() {
  const pool = mysql.createPool("mysql://esilayaz_esilaticari:q7D6%24ry84@esilayazilim.com:3306/esilayaz_esilaticari");
  const [rows] = await pool.query("SELECT * FROM orders WHERE id LIKE '64af6100-2efe-4ea4-bb50-fe20e2b6a9ab'");
  console.log(rows);
  process.exit(0);
}
run();
