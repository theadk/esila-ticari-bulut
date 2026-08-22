const fs = require('fs');
let code = fs.readFileSync('pages/EFatura.tsx', 'utf8');

// Just remove all "Palette, "
code = code.replace(/Palette, /g, '');
code = code.replace(/Palette,/g, '');

code = code.replace(
  'FileText,',
  'Palette, FileText,'
);

fs.writeFileSync('pages/EFatura.tsx', code);
