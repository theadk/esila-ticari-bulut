const fs = require('fs');
let code = fs.readFileSync('lib/store.ts', 'utf8');

code = code.replace(
  'loadAllData();\n\nexport const useAppStore',
  `
  export const refreshProposalsFromServer = async () => {
    try {
      const res = await apiFetch('/api/proposals');
      if (res.ok) {
         const data = await res.json();
         globalProposals = data.map((d:any)=>{
           const parsedItems = safeJSONParse(d.items, []);
           const fixedItems = parsedItems.map((i: any) => ({
               ...i, 
               price: Number(i.price !== undefined ? i.price : (i.unitPrice || 0))
           }));
           return { ...d, items: fixedItems, total: Number(d.total !== undefined ? d.total : (d.totalAmount || 0)) };
        });
        emit();
      }
    } catch (e) {
      console.error(e);
    }
  };

loadAllData();

export const useAppStore`
);

code = code.replace(
  'setProposals(updater: any) {',
  'refreshProposals: refreshProposalsFromServer,\n    setProposals(updater: any) {'
);

fs.writeFileSync('lib/store.ts', code);
console.log('patched store.ts with refreshProposals');
