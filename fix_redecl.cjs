const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /const vkn = \(req\.headers\["x-tenant-id"\] as string\) \|\| "1111111111";\s*const id = req\.params\.id;\s*const notes = req\.query\.notes \|\| "";\s*const date = new Date\(\)\.toISOString\(\);\s*const vkn = req\.query\.vkn \|\| \(req\.headers\["x-tenant-id"\] as string\) \|\| "1111111111";/g;

code = code.replace(regex, 'const id = req.params.id;\nconst notes = req.query.notes || "";\nconst date = new Date().toISOString();\nconst vkn = req.query.vkn || (req.headers["x-tenant-id"] as string) || "1111111111";');

fs.writeFileSync('server.ts', code);
console.log('Fixed');
