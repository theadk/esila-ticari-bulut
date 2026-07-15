import mysql from 'mysql2/promise';
async function run() {
  const pool = mysql.createPool("mysql://esilayaz_esilaticari:q7D6%24ry84@esilayazilim.com:3306/esilayaz_esilaticari");
  const [rows] = await pool.query("DESCRIBE personnel");
  console.log(rows.filter(r => ['birthDate', 'endDate', 'startDate'].includes(r.Field)));
  process.exit(0);
}
run();
