const mysql = require('mysql2/promise');

async function run() {
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('mysql')) {
    console.log('No mysql db url');
    return;
  }
  
  const pool = mysql.createPool(process.env.DATABASE_URL);
  
  try {
    await pool.query('ALTER TABLE settings ADD COLUMN plumbingChecklistTemplate JSON;');
    console.log('Added plumbingChecklistTemplate to settings');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('plumbingChecklistTemplate already exists');
    } else {
      console.error(e);
    }
  }

  try {
    await pool.query('ALTER TABLE service_tickets ADD COLUMN plumbingChecklist JSON;');
    console.log('Added plumbingChecklist to service_tickets');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('plumbingChecklist already exists');
    } else {
      console.error(e);
    }
  }
  
  pool.end();
}

run();
