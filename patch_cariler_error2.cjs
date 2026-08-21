const fs = require('fs');
let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');
code = code.replace("for (const key in row) {", "for (const key in (row as any)) {");
fs.writeFileSync('pages/Cariler.tsx', code);
