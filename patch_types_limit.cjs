const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf8');

if (!code.includes('advanceLimit?: number;')) {
  code = code.replace(
    'salary: number;\n  iban: string;',
    'salary: number;\n  advanceLimit?: number;\n  iban: string;'
  );
  fs.writeFileSync('types.ts', code);
  console.log('patched types.ts');
}
