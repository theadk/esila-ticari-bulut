import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool("mysql://esilayaz_esilaticari:q7D6%24ry84@esilayazilim.com:3306/esilayaz_esilaticari");
  try {
    const [orders] = await pool.query("SELECT * FROM orders ORDER BY date DESC LIMIT 5");
    console.log(orders);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
