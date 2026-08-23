const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf8');

if (!code.includes('PayrollApproval')) {
  code += `
export interface PayrollApproval {
  id: string;
  month: string; // YYYY-MM
  status: 'Onaylandı' | 'Taslak';
  approvedAt?: string;
  approvedBy?: string;
}
`;
  fs.writeFileSync('types.ts', code);
  console.log('Added PayrollApproval to types.ts');
} else {
  console.log('PayrollApproval already exists');
}
