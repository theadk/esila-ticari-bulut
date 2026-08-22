const fs = require('fs');
let code = fs.readFileSync('pages/EFatura.tsx', 'utf8');

code = code.replace(
  'Şablon Düzenleyici',
  '<><Palette size={16} className="inline mr-1 mb-0.5" />Tasarım Editörü</>'
);
code = code.replace(
  'import {',
  'import {\n  Palette,'
);

fs.writeFileSync('pages/EFatura.tsx', code);
