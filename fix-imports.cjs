const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = execSync('grep -rlE "safeSessionStorage|safeLocalStorage" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git').toString().split('\n').filter(Boolean);

for (const file of files) {
  if (file === './lib/storage.ts' || file === 'lib/storage.ts' || file === './fix-imports.js') continue;
  
  let content = fs.readFileSync(file, 'utf8');
  let hasSession = content.includes('safeSessionStorage');
  let hasLocal = content.includes('safeLocalStorage');
  
  if (hasSession || hasLocal) {
    const imports = [];
    if (hasSession && !content.includes('safeSessionStorage } from')) imports.push('safeSessionStorage');
    if (hasLocal && !content.includes('safeLocalStorage } from')) imports.push('safeLocalStorage');
    
    if (imports.length > 0) {
      const depth = file.split('/').length - 2; // e.g. ./pages/Login.tsx -> depth 1
      let relativePath = '';
      if (file.startsWith('./')) {
         const d = file.split('/').length - 2;
         if (d === 0) relativePath = './lib/storage';
         else relativePath = '../'.repeat(d) + 'lib/storage';
      } else {
         const d = file.split('/').length - 1;
         if (d === 0) relativePath = './lib/storage';
         else relativePath = '../'.repeat(d) + 'lib/storage';
      }
      // handle files inside src/
      if (file.includes('src/pages') || file.includes('src/components')) {
         const d = file.split('/').length - 1;
         relativePath = '../'.repeat(d-1) + 'lib/storage';
      }
      // Let's just use alias @/lib/storage or calculate exact relative path.
      // Wait, there is no @ alias? Wait, vite.config.ts has `@` mapped to `.`.
      // Let's just use a regex to insert import { safeSessionStorage } from '...'
      // Wait, I can calculate it simpler. Let's just use a relative path from the file's dir to `lib/storage`
      
      const fileDir = path.dirname(file);
      const storageDir = file.startsWith('./') ? './lib' : 'lib';
      let rel = path.relative(fileDir, storageDir) + '/storage';
      if (!rel.startsWith('.')) rel = './' + rel;
      
      const importStatement = `import { ${imports.join(', ')} } from '${rel}';\n`;
      fs.writeFileSync(file, importStatement + content);
      console.log(`Added imports to ${file}`);
    }
  }
}
