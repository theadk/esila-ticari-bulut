const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

code = code.replace(/CREATE TABLE IF NOT EXISTS waybills/g, 'WAYBILLS_PLACEHOLDER');
code = code.replace(/relatedEntityId VARCHAR\(255\)\n\s*\);\s*WAYBILLS_PLACEHOLDER/g, 'relatedEntityId VARCHAR(255)\n        );\n      `);\n      await client.query(`\n        CREATE TABLE IF NOT EXISTS waybills');

code = code.replace(/;\n\s*`;\n\s*await client\.query\(`/g, ''); // cleanup any messes I made

fs.writeFileSync('server/db.ts', code);
