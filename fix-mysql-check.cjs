const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/if \(\!isMysql\)/g, 'if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))');
fs.writeFileSync('server.ts', code);
console.log('Fixed');
