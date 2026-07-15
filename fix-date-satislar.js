import fs from 'fs';
const f = 'pages/Satislar.tsx';
let txt = fs.readFileSync(f, 'utf8');

txt = txt.replace(/new Date\(order\.date\)/g, "new Date((order.date || '').replace(' ', 'T'))");
txt = txt.replace(/new Date\(o\.date\)/g, "new Date((o.date || '').replace(' ', 'T'))");
txt = txt.replace(/new Date\(b\.date\)/g, "new Date((b.date || '').replace(' ', 'T'))");
txt = txt.replace(/new Date\(a\.date\)/g, "new Date((a.date || '').replace(' ', 'T'))");
txt = txt.replace(/new Date\(selectedOrder\.date\)/g, "new Date((selectedOrder.date || '').replace(' ', 'T'))");

fs.writeFileSync(f, txt);
