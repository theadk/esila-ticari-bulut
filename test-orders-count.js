import mysql from 'mysql2/promise';
async function run() {
  const pool = mysql.createPool("mysql://esilayaz_esilaticari:q7D6%24ry84@esilayazilim.com:3306/esilayaz_esilaticari");
  const [rows] = await pool.query("SELECT COUNT(*) as c FROM orders WHERE vkn = '1111111111'");
  console.log('orders:', rows[0].c);
  
  const [personnel] = await pool.query("SELECT COUNT(*) as c FROM personnel WHERE vkn = '1111111111'");
  console.log('personnel:', personnel[0].c);
  process.exit(0);
}
run();
