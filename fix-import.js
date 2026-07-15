import fs from 'fs';
const f = 'lib/store.ts';
let txt = fs.readFileSync(f, 'utf8');

txt = txt.replace(
  "import { useState, useEffect } from 'react';",
  "import { useState, useEffect } from 'react';\nimport { get, set } from 'idb-keyval';"
);

fs.writeFileSync(f, txt);
