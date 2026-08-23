const fs = require('fs');
let code = fs.readFileSync('components/PuantajMaasView.tsx', 'utf8');

if (!code.includes('performanceScores,')) {
  code = code.replace(
    'setCashTransactions,\n  } = useAppStore();',
    'setCashTransactions,\n    performanceScores,\n    setPerformanceScores,\n  } = useAppStore();'
  );
  fs.writeFileSync('components/PuantajMaasView.tsx', code);
  console.log('patched store vars');
}
