import fs from 'fs';
import mysql from 'mysql2/promise';

async function migrate() {
    const TABLES = [
        'users', 'settings', 'customers', 'customer_transactions', 
        'cash_transactions', 'personnel', 'personnel_records', 
        'orders', 'proposals', 'warehouses', 'categories', 
        'brands', 'products', 'reconciliations'
    ];
    let pool;
    if (process.env.DATABASE_URL) {
        pool = mysql.createPool(process.env.DATABASE_URL);
    } else {
        console.log("No DB url");
        return;
    }

    try {
        await pool.query(`
        CREATE TABLE IF NOT EXISTS tenants (
            vkn VARCHAR(50) PRIMARY KEY,
            companyName VARCHAR(255),
            email VARCHAR(255),
            modules JSON,
            status ENUM('Bekliyor', 'Aktif', 'Pasif') DEFAULT 'Bekliyor',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        `);

        for (const table of TABLES) {
            try {
                await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN vkn VARCHAR(50)`);
                console.log(`Added vkn to ${table}`);
            } catch (e) {
                if (e.code !== 'ER_DUP_FIELDNAME') {
                    console.log(`Error adding vkn to ${table}`, e.message);
                }
            }
        }
        
        await pool.query(`INSERT IGNORE INTO tenants (vkn, companyName, status, modules) VALUES ('1111111111', 'Esila Master', 'Aktif', '["all"]')`);
        
        for (const table of TABLES) {
            await pool.query(`UPDATE \`${table}\` SET vkn = '1111111111' WHERE vkn IS NULL`);
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
migrate();
