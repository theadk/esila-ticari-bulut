import http from 'http';
async function run() {
  const tables = [
    'users', 'settings', 'customers', 'products', 'categories', 'brands', 'warehouses',
    'customer_transactions', 'cash_transactions', 'boms', 'work_orders', 'bank_accounts',
    'personnel', 'job_applications', 'attendance', 'salary_adjustments', 'personnel_tasks',
    'documents', 'orders', 'proposals'
  ];
  const results = {};
  for (const t of tables) {
    await new Promise((resolve) => {
      http.get(`http://localhost:3000/api/${t}`, { headers: { 'x-tenant-id': '1111111111' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          results[t] = data;
          resolve();
        });
      });
    });
  }
  
  const safeJSONParse = (val, defaultVal = []) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch(e) { return defaultVal; }
    }
    return val || defaultVal;
  };

  try {
    const dOrders = JSON.parse(results['orders']);
    dOrders.map((d)=>{
           const parsedItems = safeJSONParse(d.items, []);
           const fixedItems = parsedItems.map((i) => ({
               ...i, 
               price: Number(i.price !== undefined ? i.price : (i.unitPrice || 0))
           }));
           return { ...d, items: fixedItems, total: Number(d.total !== undefined ? d.total : (d.totalAmount || 0)) };
        });
    console.log('Orders OK');
  } catch(e) { console.error('Orders error', e); }

  try {
    const dProposals = JSON.parse(results['proposals']);
    dProposals.map((d)=>{
           const parsedItems = safeJSONParse(d.items, []);
           const fixedItems = parsedItems.map((i) => ({
               ...i, 
               price: Number(i.price !== undefined ? i.price : (i.unitPrice || 0))
           }));
           return { ...d, items: fixedItems, total: Number(d.total !== undefined ? d.total : (d.totalAmount || 0)) };
        });
    console.log('Proposals OK');
  } catch(e) { console.error('Proposals error', e); }
  
}
run();

  try {
    const dPersonnel = JSON.parse(results['personnel']);
    dPersonnel.map((p) => ({
          ...p,
          records: safeJSONParse(p.records, []),
          payrollRecords: safeJSONParse(p.payrollRecords, []),
          fixtures: safeJSONParse(p.fixtures, []),
          payrolls: safeJSONParse(p.payrolls, []),
          leaveRecords: safeJSONParse(p.leaveRecords, [])
        }));
    console.log('Personnel OK');
  } catch(e) { console.error('Personnel error', e); }
