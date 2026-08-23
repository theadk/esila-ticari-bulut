const fs = require('fs');
let code = fs.readFileSync('components/PuantajMaasView.tsx', 'utf8');

code = code.replace(
  'const adjs = getSalaryAdjustments(personnelId, month);',
  'const adjs = getSalaryAdjustments(personnelId, month);\n    const performanceBonus = getPerformanceBonus(personnelId, month);'
);

code = code.replace(
  'adjs.prim -\n      adjs.avans -\n      adjs.kesinti',
  'adjs.prim -\n      adjs.avans -\n      adjs.kesinti +\n      performanceBonus'
);

fs.writeFileSync('components/PuantajMaasView.tsx', code);
console.log('patched calculateNetSalary');
