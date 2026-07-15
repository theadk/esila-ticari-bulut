import fs from 'fs';
const f = 'pages/Siparisler.tsx';
let txt = fs.readFileSync(f, 'utf8');
txt = txt.replace(
  "comparison = new Date(a.date).getTime() - new Date(b.date).getTime();",
  `const timeA = new Date((a.date || '').replace(' ', 'T')).getTime();
        const timeB = new Date((b.date || '').replace(' ', 'T')).getTime();
        comparison = (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);`
);
txt = txt.replace(
  "{new Date(order.date).toLocaleString('tr-TR', {",
  "{new Date((order.date || '').replace(' ', 'T')).toLocaleString('tr-TR', {"
);
fs.writeFileSync(f, txt);
