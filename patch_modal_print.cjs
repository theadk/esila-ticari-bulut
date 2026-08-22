const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');

code = code.replace(
  /<div className="flex-1 overflow-hidden print:overflow-visible">/g,
  '<div className={`flex-1 overflow-hidden print:overflow-visible ${selectedOrder ? "print:hidden" : ""}`}>'
);

fs.writeFileSync('pages/Siparisler.tsx', code);
