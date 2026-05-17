import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const regex2 = /await pool\.query\(q, \[data\.vkn, data\.name, data\.email,  JSON\.stringify\(data\.modules\), data\.package \|\| 'Yıllık'\]\);/g;
const replacement2 = "let expInterval = '1 YEAR'; if(data.package==='Aylık') expInterval = '1 MONTH'; if(data.package==='Sınırsız') expInterval = '100 YEAR'; await pool.query(q.replace('DATE_ADD(NOW(), INTERVAL 1 YEAR)', `DATE_ADD(NOW(), INTERVAL ${expInterval})`), [data.vkn, data.name, data.email, JSON.stringify(data.modules), data.package || 'Yıllık']);";

content = content.replace(regex2, replacement2);
content = content.replace(/JSON.stringify\(JSON.stringify/, "JSON.stringify"); // fix double stringify if happens

fs.writeFileSync('server.ts', content);
