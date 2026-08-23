const fs = require('fs');
let code = fs.readFileSync('pages/Mutabakat.tsx', 'utf8');

if (!code.includes('setInterval(fetchReconciliations')) {
  code = code.replace(
    'useEffect(() => {\n    fetchReconciliations();\n  }, []);',
    'useEffect(() => {\n    fetchReconciliations();\n    const int = setInterval(fetchReconciliations, 10000);\n    return () => clearInterval(int);\n  }, []);'
  );
  
  fs.writeFileSync('pages/Mutabakat.tsx', code);
  console.log('patched Mutabakat.tsx');
}
