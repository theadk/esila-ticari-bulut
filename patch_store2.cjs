const fs = require('fs');
let code = fs.readFileSync('lib/store.ts', 'utf8');

code = code.replace(/typeof ([\w\.]+)\s*===\s*'string'\s*\?\s*JSON\.parse\(\1\)\s*:\s*\(\1\s*\|\|\s*\[\]\)/g, "safeJSONParse($1, [])");

fs.writeFileSync('lib/store.ts', code);
