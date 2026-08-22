const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const vkn = \(req.headers\["x-tenant-id"\] as string\) \|\| "1111111111";/g,
  ""
);

fs.writeFileSync('server.ts', code);
