import fs from 'fs';
const f = 'lib/store.ts';
let txt = fs.readFileSync(f, 'utf8');

txt = txt.replace(
  "import { useState, useEffect } from 'react';",
  "import { useState, useEffect } from 'react';\nimport { get, set } from 'idb-keyval';"
);

// We need to inject idb saving into the getters/setters or emit.
// emit is a good place to save the entire state to IDB!
// Wait, saving the entire state to IDB might be a bit slow if there are thousands of records, but idb-keyval is async and usually fast.
// Let's see how emit is defined.
