import fs from 'fs';

let content = fs.readFileSync('esila_ticari_schema.sql', 'utf8');

content = content.replace("CREATE TABLE IF NOT EXISTS users (", `
CREATE TABLE IF NOT EXISTS tenants (
    vkn VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    modules JSON,
    status ENUM('Bekliyor', 'Aktif', 'Pasif') DEFAULT 'Bekliyor',
    activationToken VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS users (
    vkn VARCHAR(50),
`);

const tables = [
    'settings', 'warehouses', 'categories', 'brands', 'products', 'customers',
    'customer_transactions', 'cash_transactions', 'personnel', 'personnel_records',
    'orders', 'proposals', 'reconciliations'
];

for(const t of tables) {
    content = content.replace(`CREATE TABLE IF NOT EXISTS ${t} (`, `CREATE TABLE IF NOT EXISTS ${t} (\n    vkn VARCHAR(50),`);
}

content = content.replace(/INSERT IGNORE INTO users[\s\S]*/, `
INSERT IGNORE INTO tenants (vkn, name, email, modules, status) VALUES ('1111111111', 'Esila Master', 'admin@firma.com', '["all"]', 'Aktif');

INSERT IGNORE INTO users (id, vkn, name, username, email, passwordHash, role, status)
VALUES ('admin-1', '1111111111', 'Sistem Yöneticisi', 'admin', 'admin@firma.com', 'admin123', 'Admin', 'Aktif');
`);

fs.writeFileSync('esila_ticari_schema.sql', content);
