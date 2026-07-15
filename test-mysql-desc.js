import mysql from 'mysql2/promise';
async function run() {
  const pool = mysql.createPool("mysql://esilayaz_esilaticari:q7D6%24ry84@esilayazilim.com:3306/esilayaz_esilaticari");
  const [rows] = await pool.query("DESCRIBE orders");
  console.log('orders constraints:');
  console.log(rows.filter(r => r.Null === 'NO' && r.Default === null && r.Extra !== 'auto_increment'));
  
  const [pRows] = await pool.query("DESCRIBE personnel");
  console.log('personnel constraints:');
  console.log(pRows.filter(r => r.Null === 'NO' && r.Default === null && r.Extra !== 'auto_increment'));
  
  process.exit(0);
}
run();
