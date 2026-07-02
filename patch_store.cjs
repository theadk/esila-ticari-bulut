const fs = require('fs');
let code = fs.readFileSync('lib/store.ts', 'utf8');

const helper = `
const safeJSONParse = (val: any, defaultVal: any = []) => {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch(e) { return defaultVal; }
  }
  return val || defaultVal;
};
`;

code = code.replace(/import \{ create \} from 'zustand';(\n*)/, "import { create } from 'zustand';\n" + helper + "\n");

code = code.replace(/typeof d\.items === 'string' \? JSON\.parse\(d\.items\)\s*:\s*\(d\.items\s*\|\|\s*\[\]\)/g, "safeJSONParse(d.items, [])");
code = code.replace(/typeof d\.tags === 'string' \? JSON\.parse\(d\.tags\)\s*:\s*\(d\.tags\s*\|\|\s*\[\]\)/g, "safeJSONParse(d.tags, [])");
code = code.replace(/typeof p\.records === 'string' \? JSON\.parse\(p\.records\)\s*:\s*\(p\.records\s*\|\|\s*\[\]\)/g, "safeJSONParse(p.records, [])");

fs.writeFileSync('lib/store.ts', code);
