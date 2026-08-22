const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');
code = code.replace(
  "date: new Date().toISOString().slice(0, \n      expectedDeliveryDate: expectedDeliveryDate || undefined, 19).replace('T', ' '),",
  "date: new Date().toISOString().slice(0, 19).replace('T', ' '),"
);
fs.writeFileSync('pages/Siparisler.tsx', code);
