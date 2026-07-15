import fs from 'fs';
const f = 'pages/Personel.tsx';
let txt = fs.readFileSync(f, 'utf8');
txt = txt.replace(
  /p\.tcNo\.includes\(searchTerm\)/g,
  '(p.tcNo || "").includes(searchTerm)'
);
txt = txt.replace(
  /p\.department\.toLowerCase\(\)\.includes/g,
  '(p.department || "").toLowerCase().includes'
);
txt = txt.replace(
  /p\.position\.toLowerCase\(\)\.includes/g,
  '(p.position || "").toLowerCase().includes'
);
fs.writeFileSync(f, txt);
