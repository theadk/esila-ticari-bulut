const fs = require('fs');
let code = fs.readFileSync('server/fallbackDb.ts', 'utf8');

if (!code.includes("id: 'wh-1', name: 'Merkez Depo'")) {
  code = code.replace(
    /categories: \[\s*\{[^\}]+\},\s*\{[^\}]+\}\s*\]/m,
    `$&,
  warehouses: [
    { vkn: '1111111111', id: 'wh-1', name: 'Merkez Depo', capacity: 1000 }
  ]`
  );
  fs.writeFileSync('server/fallbackDb.ts', code);
  console.log("Patched server/fallbackDb.ts");
}
