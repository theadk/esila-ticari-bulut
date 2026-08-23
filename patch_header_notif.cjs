const fs = require('fs');
let code = fs.readFileSync('components/Header.tsx', 'utf8');

code = code.replace(
  "if (n.link === 'uretim') setActivePage('uretim');",
  "if (n.link === 'uretim') setActivePage('uretim');\n        if (n.link === '/personel') setActivePage('personel');"
);

fs.writeFileSync('components/Header.tsx', code);
console.log('patched Header.tsx');
