const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL, skipping.");
    return;
  }
  const pool = mysql.createPool(process.env.DATABASE_URL);
  
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM personnel");
    const colNames = cols.map(c => c.Field);
    
    const alterQueries = [];
    
    if (colNames.includes('name')) alterQueries.push("DROP COLUMN name");
    if (colNames.includes('status')) alterQueries.push("DROP COLUMN status");
    if (colNames.includes('bankName')) alterQueries.push("DROP COLUMN bankName");

    if (!colNames.includes('firstName')) alterQueries.push("ADD COLUMN firstName VARCHAR(255)");
    if (!colNames.includes('lastName')) alterQueries.push("ADD COLUMN lastName VARCHAR(255)");
    if (!colNames.includes('birthDate')) alterQueries.push("ADD COLUMN birthDate VARCHAR(50)");
    if (!colNames.includes('gender')) alterQueries.push("ADD COLUMN gender VARCHAR(20)");
    if (!colNames.includes('bloodType')) alterQueries.push("ADD COLUMN bloodType VARCHAR(10)");
    if (!colNames.includes('endDate')) alterQueries.push("ADD COLUMN endDate VARCHAR(50)");
    if (!colNames.includes('employmentStatus')) alterQueries.push("ADD COLUMN employmentStatus VARCHAR(50)");
    if (!colNames.includes('socialSecurityNo')) alterQueries.push("ADD COLUMN socialSecurityNo VARCHAR(50)");
    if (!colNames.includes('currency')) alterQueries.push("ADD COLUMN currency VARCHAR(10)");
    if (!colNames.includes('records')) alterQueries.push("ADD COLUMN records JSON");
    if (!colNames.includes('payrollRecords')) alterQueries.push("ADD COLUMN payrollRecords JSON");
    if (!colNames.includes('payrolls')) alterQueries.push("ADD COLUMN payrolls JSON");
    
    // Also fix startDate to VARCHAR to avoid strict mode issues with empty dates
    if (colNames.includes('startDate')) alterQueries.push("MODIFY COLUMN startDate VARCHAR(50)");

    if (alterQueries.length > 0) {
      const sql = `ALTER TABLE personnel ${alterQueries.join(', ')}`;
      console.log("Running:", sql);
      await pool.query(sql);
      console.log("personnel table updated.");
    } else {
      console.log("personnel table is already up to date.");
    }
  } catch (e) {
    console.error("Error updating personnel table:", e);
  }
  
  pool.end();
}

run();
