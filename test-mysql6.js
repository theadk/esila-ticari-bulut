import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool("mysql://esilayaz_esilaticari:q7D6%24ry84@esilayazilim.com:3306/esilayaz_esilaticari");
  try {
    const [rows] = await pool.query("SHOW COLUMNS FROM orders");
    console.log("Orders Columns:", rows);
    const [orders] = await pool.query("SELECT * FROM orders LIMIT 2");
    console.log("Orders Data:", orders);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
