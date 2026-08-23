const fs = require('fs');
let code = fs.readFileSync('components/PuantajMaasView.tsx', 'utf8');

const perfLogic = `
  const getPerformanceScore = (personnelId: string, month: string) => {
    const scoreRecord = performanceScores?.find(
      (s) => s.personnelId === personnelId && s.month === month
    );
    return scoreRecord ? scoreRecord.score : null;
  };

  const getPerformanceBonus = (personnelId: string, month: string) => {
    const score = getPerformanceScore(personnelId, month);
    if (score === null) return 0;
    const p = personnel.find((p) => p.id === personnelId);
    if (!p) return 0;
    // Maksimum prim = Maaşın %10'u
    // Performans notuna göre (0-100) bu maksimum primin yüzdesi alınır
    return (p.salary || 0) * 0.10 * (score / 100);
  };
`;

if (!code.includes('const getPerformanceScore')) {
  code = code.replace(
    'const getAttendanceStats = (personnelId: string, month: string) => {',
    perfLogic + '\n  const getAttendanceStats = (personnelId: string, month: string) => {'
  );
}

// Modify calculateNetSalary
if (code.includes('return netSalary;')) {
  // Wait, let's find the exact calculateNetSalary function body
}

fs.writeFileSync('components/PuantajMaasView.tsx', code);
console.log('patched calc logic');
