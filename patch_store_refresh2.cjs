const fs = require('fs');
let code = fs.readFileSync('lib/store.ts', 'utf8');

code = code.replace(
  'export async function initializeStore',
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

export async function initializeStore`
);

fs.writeFileSync('lib/store.ts', code);
console.log('patched store.ts properly');
