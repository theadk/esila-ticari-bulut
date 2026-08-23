const fs = require('fs');
let code = fs.readFileSync('pages/Mutabakat.tsx', 'utf8');

code = code.replace(
  '<div className="grid grid-cols-1 xl:grid-cols-4 gap-6">\n        <div className="xl:col-span-3 space-y-6">\n          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">\n        <div className="xl:col-span-3 space-y-6">',
  '<div className="grid grid-cols-1 xl:grid-cols-4 gap-6">\n        <div className="xl:col-span-3 space-y-6">'
);

fs.writeFileSync('pages/Mutabakat.tsx', code);
