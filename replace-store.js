import fs from 'fs';

let content = fs.readFileSync('lib/store.ts', 'utf8');

const syncHelper = `
async function syncArray(table: string, oldArray: any[], newArray: any[]) {
  try {
    const oldIds = new Set(oldArray.map(x => x.id));
    const newIds = new Set(newArray.map(x => x.id));
    
    // Deletes
    for (const item of oldArray) {
      if (!newIds.has(item.id)) {
        fetch(\`/api/\${table}/\${item.id}\`, { method: 'DELETE' }).catch(console.error);
      }
    }
    
    // Inserts and Updates
    for (const item of newArray) {
      if (!oldIds.has(item.id)) {
        fetch(\`/api/\${table}\`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(item) 
        }).catch(console.error);
      } else {
        const oldItem = oldArray.find(x => x.id === item.id);
        if (JSON.stringify(oldItem) !== JSON.stringify(item)) {
          fetch(\`/api/\${table}/\${item.id}\`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(item) 
          }).catch(console.error);
        }
      }
    }
  } catch (err) {
    console.error("Sync error:", err);
  }
}

async function syncObject(table: string, oldObj: any, newObj: any) {
  try {
     if (JSON.stringify(oldObj) !== JSON.stringify(newObj)) {
         fetch(\`/api/\${table}/1\`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(newObj)
         }).catch(console.error);
     }
  } catch (err) {
    console.error("Sync object error:", err);
  }
}

let isInitialized = false;
export async function initializeStore() {
  if (isInitialized) return;
  isInitialized = true;
  try {
    const tables = [
      { name: 'users', ref: (data: any) => { globalUsers = data; } },
      { name: 'settings', ref: (data: any) => { if(data.length > 0) globalSettings = data[0]; } },
      { name: 'customers', ref: (data: any) => { globalCustomers = data; } },
      { name: 'products', ref: (data: any) => { globalProducts = data.map((d:any)=>({...d, warehouseStocks: typeof d.warehouseStocks === 'string' ? JSON.parse(d.warehouseStocks): (d.warehouseStocks||[])})); } },
      { name: 'categories', ref: (data: any) => { /* already in another branch but if we migrate.. */ } },
      { name: 'brands', ref: (data: any) => { /* ... */ } },
      { name: 'warehouses', ref: (data: any) => { /* ... */ } },
      { name: 'customer_transactions', ref: (data: any) => { globalTransactions = data; } },
      { name: 'cash_transactions', ref: (data: any) => { globalCashTransactions = data; } },
      { name: 'personnel', ref: (data: any) => { globalPersonnel = data; } },
      { name: 'orders', ref: (data: any) => { globalOrders = data.map((d:any)=>({...d, items: typeof d.items === 'string' ? JSON.parse(d.items): (d.items||[])})); } },
      { name: 'proposals', ref: (data: any) => { globalProposals = data.map((d:any)=>({...d, items: typeof d.items === 'string' ? JSON.parse(d.items): (d.items||[])})); } }
    ];
    
    for (const t of tables) {
      const res = await fetch(\`/api/\${t.name}\`);
      if (res.ok) {
         const data = await res.json();
         if (data && data.length > 0) {
            t.ref(data);
         }
      }
    }
    emit();
  } catch (e) {
    console.error("Failed to initialize store", e);
  }
}

`;

// Insert the sync helper before useAppStore
content = content.replace("export const useAppStore = () => {", syncHelper + "export const useAppStore = () => {");

const replaceSetter = (name, globalName, table) => {
   const rx = new RegExp(`set${name}\\(updater:.*?\\{(?:.|\\n|\\r)*?emit\\(\\);\\s*\\},`);
   const newCode = `set${name}(updater: any) {
      const old = ${globalName};
      ${globalName} = typeof updater === 'function' ? updater(${globalName}) : updater;
      ${table ? (globalName === 'globalSettings' ? `syncObject('${table}', old, ${globalName});` : `syncArray('${table}', old, ${globalName});`) : ''}
      emit();
    },`;
   content = content.replace(rx, newCode);
};

replaceSetter('Users', 'globalUsers', 'users');
replaceSetter('Customers', 'globalCustomers', 'customers');
replaceSetter('Products', 'globalProducts', 'products');
replaceSetter('Transactions', 'globalTransactions', 'customer_transactions');
replaceSetter('CashTransactions', 'globalCashTransactions', 'cash_transactions');
replaceSetter('Personnel', 'globalPersonnel', 'personnel');
replaceSetter('Orders', 'globalOrders', 'orders');
replaceSetter('Proposals', 'globalProposals', 'proposals');
replaceSetter('Settings', 'globalSettings', 'settings');

fs.writeFileSync('lib/store.ts', content);
