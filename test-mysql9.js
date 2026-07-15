import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool("mysql://esilayaz_esilaticari:q7D6%24ry84@esilayazilim.com:3306/esilayaz_esilaticari");
  try {
    const [orders] = await pool.query("SELECT id, date FROM orders WHERE date IS NULL OR date = ''");
    console.log("Invalid dates:", orders);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
