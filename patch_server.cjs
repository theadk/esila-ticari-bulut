const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('"payroll_approvals"')) {
  code = code.replace(
    '"personnel_records",',
    '"personnel_records",\n    "payroll_approvals",'
  );
  fs.writeFileSync('server.ts', code);
  console.log('patched server.ts');
} else {
  console.log('already patched');
}
