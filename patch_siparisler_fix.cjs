const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');
code = code.replace(/\}c      store\.setOrders/g, '}\n      store.setOrders');
fs.writeFileSync('pages/Siparisler.tsx', code);
console.log("Fixed c syntax error");
