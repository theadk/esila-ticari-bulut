import { getPool } from './server/db.js';
const run = async () => {
    const pool = getPool();
    await pool.query(`CREATE TABLE IF NOT EXISTS activation_logs (
    id VARCHAR(255) PRIMARY KEY,
    vkn VARCHAR(50),
    tenantName VARCHAR(255),
    action VARCHAR(50),
    status VARCHAR(50),
    details TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
);`);
    console.log("Done");
    process.exit(0);
}
run();
