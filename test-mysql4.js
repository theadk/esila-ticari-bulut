import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool("mysql://esilayaz_esilaticari:q7D6%24ry84@esilayazilim.com:3306/esilayaz_esilaticari");
  try {
    const [rows] = await pool.query("SELECT * FROM _migrations");
    console.log("Migrations:", rows);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
