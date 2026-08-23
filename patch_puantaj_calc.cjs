const fs = require('fs');
let code = fs.readFileSync('components/PuantajMaasView.tsx', 'utf8');

code = code.replace(
  'const adjs = salaryAdjustments.filter(\n      (s) => s.personnelId === personnelId && s.date.startsWith(month),\n    );',
  `const adjs = salaryAdjustments.filter(
      (s) => s.personnelId === personnelId && s.date.startsWith(month) && (s.status === 'Onaylandı' || !s.status),
    );`
);

code = code.replace(
  'const monthAdjs = salaryAdjustments.filter(s => s.personnelId === p.id && s.date.startsWith(selectedMonth));',
  'const monthAdjs = salaryAdjustments.filter(s => s.personnelId === p.id && s.date.startsWith(selectedMonth) && s.status !== "Reddedildi");'
);

fs.writeFileSync('components/PuantajMaasView.tsx', code);
console.log('patched calc logic');
