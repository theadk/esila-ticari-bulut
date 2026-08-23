const fs = require('fs');
let code = fs.readFileSync('pages/Teklifler.tsx', 'utf8');

if (!code.includes('refreshProposals')) {
  code = code.replace(
    'const setProposals = store.setProposals;',
    'const setProposals = store.setProposals;\n  const refreshProposals = (store as any).refreshProposals;'
  );

  code = code.replace(
    'const customers = store.customers;',
    `const customers = store.customers;

  useEffect(() => {
    if (refreshProposals) {
      const int = setInterval(refreshProposals, 10000);
      return () => clearInterval(int);
    }
  }, [refreshProposals]);`
  );
  
  fs.writeFileSync('pages/Teklifler.tsx', code);
  console.log('patched Teklifler.tsx');
}
