import fs from 'fs';
import mysql from 'mysql2/promise';

async function importDb() {
  const BACKUP_FILE = 'local_db.json';
  if (!fs.existsSync(BACKUP_FILE)) {
    console.log("No local_db.json found.");
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(BACKUP_FILE, "utf-8"));
  
  const connectionString = "mysql://esilayaz_esilaticari:Korkmaz66%2A%2A@esilayazilim.com:3306/esilayaz_esilaticari";
  const pool = mysql.createPool(connectionString);
  
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  
  for (const table of Object.keys(data)) {
    try {
      console.log(`Processing ${table}...`);
      const rows = data[table];
      if (rows && rows.length > 0) {
        const columnsSet = new Set();
        rows.forEach((r) => Object.keys(r).forEach(k => columnsSet.add(k)));
        let columns = Array.from(columnsSet);
        
        try {
          const [colRows] = await pool.query(`SHOW COLUMNS FROM \`${table}\``);
          const validColumns = colRows.map((c) => c.Field);
          columns = columns.filter(c => validColumns.includes(c));
        } catch (colErr) {}
        
        if (columns.length === 0) continue;
        
        const chunk_size = 50;
        for (let i = 0; i < rows.length; i += chunk_size) {
          const chunk = rows.slice(i, i + chunk_size);
          const placeholders = chunk.map(() => `(${columns.map(() => '?').join(',')})`).join(',');
          const values = chunk.flatMap((r) => columns.map(c => {
            let val = r[c];
            if (val === undefined || val === null) return null;
            if (typeof val === 'object' && !(val instanceof Date)) return JSON.stringify(val);
            return val;
          }));
          
          const sql = `INSERT INTO \`${table}\` (${columns.map(c => `\`${c}\``).join(',')}) VALUES ${placeholders} ON DUPLICATE KEY UPDATE ${columns.map(c => `\`${c}\`=VALUES(\`${c}\`)`).join(',')}`;
          await pool.query(sql, values);
        }
      }
      console.log(`Success ${table} - Imported ${rows.length} rows`);
    } catch (err) {
      console.error(`Error in table ${table}:`, err.message);
    }
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  pool.end();
}

importDb();
