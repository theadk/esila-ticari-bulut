const fs = require('fs');
let code = fs.readFileSync('components/PuantajMaasView.tsx', 'utf8');

if (code.includes('setPayrollApprovals')) {
  console.log('Already patched');
  process.exit(0);
}

// 1. Add payrollApprovals from store
code = code.replace(
  'attendance,',
  'attendance,\n    payrollApprovals,'
);

// 2. Add validation before saving attendance
code = code.replace(
  'const handleSaveAttendance = (e: React.FormEvent) => {',
  \`const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (attendanceForm.date) {
      const month = attendanceForm.date.substring(0, 7);
      const isApproved = payrollApprovals?.some((a: any) => a.month === month && a.status === 'Onaylandı');
      if (isApproved) {
        alert("Bu aya ait bordro onaylandığı için yeni puantaj girişi yapılamaz.");
        return;
      }
    }\`
);
code = code.replace(
  'e.preventDefault();',
  ''
);

// 3. Add validation before saving salary adjustment
code = code.replace(
  'const handleSaveAdj = (e: React.FormEvent) => {',
  \`const handleSaveAdj = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjForm.date) {
      const month = adjForm.date.substring(0, 7);
      const isApproved = payrollApprovals?.some((a: any) => a.month === month && a.status === 'Onaylandı');
      if (isApproved) {
        alert("Bu aya ait bordro onaylandığı için yeni avans/kesinti/prim eklenemez.");
        return;
      }
    }\`
);
// Replace the original e.preventDefault(); for adj
const parts = code.split('const handleSaveAdj = (e: React.FormEvent) => {');
if(parts.length > 1) {
  parts[1] = parts[1].replace('e.preventDefault();', '');
  code = parts.join('const handleSaveAdj = (e: React.FormEvent) => {');
}

fs.writeFileSync('components/PuantajMaasView.tsx', code);
console.log('Patched PuantajMaasView.tsx');
