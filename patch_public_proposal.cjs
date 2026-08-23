const fs = require('fs');
let code = fs.readFileSync('pages/PublicProposalView.tsx', 'utf8');

code = code.replace(
  'const updated = { ...proposal, status: ProposalStatus.ACCEPTED };',
  'const updated = { ...proposal, status: ProposalStatus.ACCEPTED, updatedAt: new Date().toISOString() };'
);

code = code.replace(
  'const updated = { ...proposal, status: ProposalStatus.REJECTED };',
  'const updated = { ...proposal, status: ProposalStatus.REJECTED, updatedAt: new Date().toISOString() };'
);

fs.writeFileSync('pages/PublicProposalView.tsx', code);
console.log('patched PublicProposalView.tsx');
