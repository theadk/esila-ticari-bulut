const fs = require('fs');

function fixFile(file) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  code = code.replace(/use\(rRows as any\[\]\)\.length/g, '(userRows as any[]).length');
  code = code.replace(/tRows\.length/g, '(tRows as any[]).length');

  fs.writeFileSync(file, code);
}

fixFile('server.ts');
fixFile('server2.ts');
