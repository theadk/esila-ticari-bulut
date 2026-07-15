import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool("mysql://esilayaz_esilaticari:q7D6%24ry84@esilayazilim.com:3306/esilayaz_esilaticari");
  try {
    await pool.query("ALTER TABLE personnel ADD COLUMN branch VARCHAR(255)");
    console.log("Altered table!");
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
