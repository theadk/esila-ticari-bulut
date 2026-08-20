const mysql = require("mysql2/promise");
require("dotenv").config({ override: true });
async function run() {
  const pool = mysql.createPool(process.env.DATABASE_URL);
  try {
    await pool.query("ALTER TABLE products ADD COLUMN supplierPrice DECIMAL(15,2)");
    console.log("Column added");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') console.log("Column already exists");
    else console.error(err);
  }
  process.exit(0);
}
run();
