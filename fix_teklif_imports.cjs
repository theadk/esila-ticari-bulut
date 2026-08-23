const fs = require('fs');
let code = fs.readFileSync('pages/Teklifler.tsx', 'utf8');

if (!code.includes('Clock,')) {
  code = code.replace(
    'import { FileBadge, Plus, Search,',
    'import { Clock, FileBadge, Plus, Search,'
  );
  fs.writeFileSync('pages/Teklifler.tsx', code);
}
console.log('fixed imports');
