import fs from 'fs';
const f = 'App.tsx';
let txt = fs.readFileSync(f, 'utf8');
txt = txt.replace('30 * 60 * 1000', '120 * 60 * 1000');
txt = txt.replace('// 30 minutes', '// 120 minutes');
fs.writeFileSync(f, txt);
