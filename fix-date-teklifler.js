import fs from 'fs';
const f = 'pages/Teklifler.tsx';
let txt = fs.readFileSync(f, 'utf8');

txt = txt.replace(/new Date\(proposal\.date\)/g, "new Date((proposal.date || '').replace(' ', 'T'))");
txt = txt.replace(/new Date\(p\.date\)/g, "new Date((p.date || '').replace(' ', 'T'))");
txt = txt.replace(/new Date\(b\.date\)/g, "new Date((b.date || '').replace(' ', 'T'))");
txt = txt.replace(/new Date\(a\.date\)/g, "new Date((a.date || '').replace(' ', 'T'))");
txt = txt.replace(/new Date\(selectedProposal\.date\)/g, "new Date((selectedProposal.date || '').replace(' ', 'T'))");

fs.writeFileSync(f, txt);
