const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

code = code.replace(/\\n/g, '\n');

fs.writeFileSync('server/db.ts', code);
console.log("Fixed db.ts syntax");
