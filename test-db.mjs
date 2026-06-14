import { getPool } from './server/db.js';

const run = async () => {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM tenants WHERE email IS NOT NULL AND status='Bekliyor' LIMIT 1");
    if (rows.length > 0) {
        console.log("Found tenant:", rows[0].vkn);
    } else {
        console.log("No pending tenants found. Using user email...");
        await pool.query("INSERT INTO tenants (vkn, name, email, status) VALUES ('1234567890', 'Test', 'ahdurko@gmail.com', 'Bekliyor')");
        console.log("Inserted test tenant.");
    }
}
run();
