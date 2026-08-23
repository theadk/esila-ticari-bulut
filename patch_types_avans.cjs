const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf8');

if (!code.includes("status?: 'Bekliyor' | 'Onaylandı' | 'Reddedildi'")) {
  code = code.replace(
    "amount: number;\n  description: string;\n}",
    "amount: number;\n  description: string;\n  status?: 'Bekliyor' | 'Onaylandı' | 'Reddedildi';\n}"
  );
  fs.writeFileSync('types.ts', code);
  console.log('patched types.ts');
}
