import fs from 'fs';
const f = 'pages/Depo.tsx';
let txt = fs.readFileSync(f, 'utf8');
txt = txt.replace(/new Date\(order\.date\)/g, "new Date((order.date || '').replace(' ', 'T'))");
fs.writeFileSync(f, txt);
