import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const regex = /"INSERT INTO tenants \\(vkn, name, email, modules, status\\) VALUES \\(\\?, \\?, \\?, \\?, 'Bekliyor'\\)"/g;
const replacement = '"INSERT INTO tenants (vkn, name, email, modules, status, package, expirationDate) VALUES (?, ?, ?, ?, \\"Bekliyor\\", ?, DATE_ADD(NOW(), INTERVAL 1 YEAR))"';

content = content.replace(regex, replacement);

const regex2 = /await pool\.query\(q, \[data\.vkn, data\.name, data\.email, data\.modules\]\);/g;
const replacement2 = "await pool.query(q, [data.vkn, data.name, data.email, JSON.stringify(data.modules), data.package || 'Yıllık']);";

content = content.replace(regex2, replacement2);

fs.writeFileSync('server.ts', content);
