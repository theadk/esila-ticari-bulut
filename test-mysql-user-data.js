import mysql from 'mysql2/promise';
async function run() {
  const pool = mysql.createPool("mysql://esilayaz_esilaticari:q7D6%24ry84@esilayazilim.com:3306/esilayaz_esilaticari");
  const [orders] = await pool.query("SELECT id, status, date FROM orders WHERE vkn = '5770426720'");
  console.log('User orders count:', orders.length);
  console.log('Orders:', orders);
  
  const [personnel] = await pool.query("SELECT id, firstName, tcNo FROM personnel WHERE vkn = '5770426720'");
  console.log('User personnel count:', personnel.length);
  
  process.exit(0);
}
run();
