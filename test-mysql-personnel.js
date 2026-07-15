import mysql from 'mysql2/promise';
async function run() {
  const pool = mysql.createPool("mysql://esilayaz_esilaticari:q7D6%24ry84@esilayazilim.com:3306/esilayaz_esilaticari");
  const [cols] = await pool.query("SHOW COLUMNS FROM personnel");
  console.log(cols.map(c => c.Field));
  
  const [orderCols] = await pool.query("SHOW COLUMNS FROM orders");
  console.log("orders:", orderCols.map(c => c.Field));
  
  process.exit(0);
}
run();
