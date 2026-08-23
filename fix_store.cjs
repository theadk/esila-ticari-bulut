const fs = require('fs');
let code = fs.readFileSync('lib/store.ts', 'utf8');
code = code.replace(
  'refreshProposals: refreshProposalsFromServer,\n    refreshProposals: refreshProposalsFromServer,',
  'refreshProposals: refreshProposalsFromServer,'
);
fs.writeFileSync('lib/store.ts', code);
