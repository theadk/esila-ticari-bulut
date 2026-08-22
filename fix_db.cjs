const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');
code = code.replace(
  "        }\n\n      {\n        name: '007",
  "        }\n      },\n      {\n        name: '007"
);
fs.writeFileSync('server/db.ts', code);
