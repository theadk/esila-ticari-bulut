const fs = require('fs');

function fixFile(file) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  code = code.replace(/req\.headers\["x-tenant-id"\] \|\| "1111111111"/g, '(req.headers["x-tenant-id"] as string) || "1111111111"');
  code = code.replace(/req\.headers\["x-user-id"\]/g, '(req.headers["x-user-id"] as string)');
  
  code = code.replace(/rows\.map/g, '(rows as any[]).map');
  code = code.replace(/rows\.length/g, '(rows as any[]).length');
  code = code.replace(/rRows\.length/g, '(rRows as any[]).length');

  fs.writeFileSync(file, code);
}

fixFile('server.ts');
fixFile('server2.ts');
