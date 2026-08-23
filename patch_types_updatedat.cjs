const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf8');

if (!code.includes('updatedAt?: string;')) {
  code = code.replace(
    'isConvertedToOrder?: boolean;',
    'isConvertedToOrder?: boolean;\n  updatedAt?: string;'
  );
  fs.writeFileSync('types.ts', code);
  console.log('patched types.ts');
}
