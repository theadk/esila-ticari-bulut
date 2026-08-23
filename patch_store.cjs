const fs = require('fs');
let code = fs.readFileSync('lib/store.ts', 'utf8');

code = code.replace(
  'PayrollApproval } from \'../types\';',
  'PayrollApproval, PerformanceScore } from \'../types\';'
);

if (!code.includes('performanceScores: PerformanceScore[]')) {
  code = code.replace(
    'payrollApprovals: PayrollApproval[];',
    'payrollApprovals: PayrollApproval[];\n  performanceScores: PerformanceScore[];'
  );
  code = code.replace(
    'setPayrollApprovals: (approvals: PayrollApproval[]) => void;',
    'setPayrollApprovals: (approvals: PayrollApproval[]) => void;\n  setPerformanceScores: (scores: PerformanceScore[]) => void;'
  );
  code = code.replace(
    'payrollApprovals: [],',
    'payrollApprovals: [],\n  performanceScores: [],'
  );
  code = code.replace(
    'setPayrollApprovals: (approvals) => set({ payrollApprovals: approvals }),',
    'setPayrollApprovals: (approvals) => set({ payrollApprovals: approvals }),\n  setPerformanceScores: (scores) => set({ performanceScores: scores }),'
  );
  fs.writeFileSync('lib/store.ts', code);
  console.log('patched store.ts');
}
