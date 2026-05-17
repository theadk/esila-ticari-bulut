import mysql from 'mysql2/promise';

async function run() {
  if (!process.env.DATABASE_URL) return;
  const pool = mysql.createPool(process.env.DATABASE_URL);
  try {
    await pool.query("ALTER TABLE tenants ADD COLUMN package VARCHAR(50) DEFAULT 'Yıllık'");
    await pool.query("ALTER TABLE tenants ADD COLUMN expirationDate DATETIME");
    await pool.query("UPDATE tenants SET expirationDate = DATE_ADD(NOW(), INTERVAL 1 YEAR)");
    console.log('Migration finished');
  } catch(e) {
    if (e.code !== 'ER_DUP_FIELDNAME') {
      console.error(e);
    } else {
      console.log('Columns already exist.');
    }
  }
  process.exit(0);
}
run();
