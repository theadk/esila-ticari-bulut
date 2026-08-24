const fs = require('fs');

let code = fs.readFileSync('lib/store.ts', 'utf8');

// 1. Add globalWarehouses
if (!code.includes('let globalWarehouses: any[] = [];')) {
  code = code.replace(
    'let globalCustomers: Customer[] = [];',
    'let globalWarehouses: any[] = [];\nlet globalCustomers: Customer[] = [];'
  );
}

// 2. Fix the ref function in tableMappings
code = code.replace(
  "{ name: 'warehouses', ref: (data: any) => { /* ... */ } },",
  "{ name: 'warehouses', ref: (data: any) => { globalWarehouses = data; } },"
);

// 3. Add get/set for warehouses
if (!code.includes('get warehouses()')) {
  const getSetProducts = `    get products() { return globalProducts; },
    setProducts(updater: any) {
      const old = [...globalProducts];
      globalProducts = typeof updater === 'function' ? updater(globalProducts) : updater;
      syncArray('products', old, globalProducts);
      emit();
    },`;
    
  const getSetWarehouses = `    get warehouses() { return globalWarehouses; },
    setWarehouses(updater: any) {
      const old = [...globalWarehouses];
      globalWarehouses = typeof updater === 'function' ? updater(globalWarehouses) : updater;
      syncArray('warehouses', old, globalWarehouses);
      emit();
    },`;
    
  code = code.replace(getSetProducts, getSetProducts + '\n' + getSetWarehouses);
}

fs.writeFileSync('lib/store.ts', code);
console.log("Patched lib/store.ts");
