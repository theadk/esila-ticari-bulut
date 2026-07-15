import fs from 'fs';
const f = 'lib/store.ts';
let txt = fs.readFileSync(f, 'utf8');

txt = txt.replace(
  "import { get, set } from 'idb-keyval';",
  "import * as idb from 'idb-keyval';"
);

txt = txt.replace(/await set\(/g, "await idb.set(");
txt = txt.replace(/await get\(/g, "await idb.get(");

fs.writeFileSync(f, txt);
