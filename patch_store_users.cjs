const fs = require('fs');
let code = fs.readFileSync('lib/store.ts', 'utf8');

code = code.replace(
  "{ name: 'users', ref: (data: any) => { globalUsers = data; } },",
  "{ name: 'users', ref: (data: any) => { globalUsers = data.map((u: any) => ({ ...u, permissions: typeof u.permissions === 'string' ? safeJSONParse(u.permissions, {}) : u.permissions })); } },"
);

fs.writeFileSync('lib/store.ts', code);
