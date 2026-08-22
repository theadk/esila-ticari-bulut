const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /function processAndSaveImage[\s\S]*?return `\/resimler\/\$\{tenantId\}\/\$\{filename\}`;[\s\S]*?\}/;
code = code.replace(regex, '');

fs.writeFileSync('server.ts', code);
