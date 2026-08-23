const fs = require('fs');
let code = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

code = code.replace(
  "if (currentDay >= 25)",
  "if (currentDay >= 20)"
);

fs.writeFileSync('pages/Dashboard.tsx', code);
console.log('patched Dashboard.tsx trigger');
