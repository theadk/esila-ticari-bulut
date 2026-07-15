import fs from 'fs';
const f = 'server.ts';
let txt = fs.readFileSync(f, 'utf8');

txt = txt.replace(
  /const values = Object\.values\(data\)\.map\(\(v\) =>\n\s*typeof v === "object" && v !== null \? JSON\.stringify\(v\) : v,\n\s*\);/g,
  `const values = Object.values(data).map((v) => {
          let val = typeof v === "object" && v !== null ? JSON.stringify(v) : v;
          if (val === "") return null;
          return val;
        });`
);

txt = txt.replace(
  /const values = keys\.map\(\(k\) =>\n\s*typeof data\[k\] === "object" && data\[k\] !== null\n\s*\? JSON\.stringify\(data\[k\]\)\n\s*: data\[k\],\n\s*\);/g,
  `const values = keys.map((k) => {
          let val = typeof data[k] === "object" && data[k] !== null ? JSON.stringify(data[k]) : data[k];
          if (val === "") return null;
          return val;
        });`
);

fs.writeFileSync(f, txt);
console.log('Fixed server.ts values mapping');
