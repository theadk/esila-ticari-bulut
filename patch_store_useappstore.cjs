const fs = require('fs');
let code = fs.readFileSync('lib/store.ts', 'utf8');

code = code.replace(
  'get proposals() { return globalProposals; },',
  'get proposals() { return globalProposals; },\n    refreshProposals: refreshProposalsFromServer,'
);

fs.writeFileSync('lib/store.ts', code);
console.log('patched store.ts useAppStore');
