import http from 'http';
const tables = [
  'users', 'settings', 'customers', 'products', 'categories', 'brands', 'warehouses',
  'customer_transactions', 'cash_transactions', 'boms', 'work_orders', 'bank_accounts',
  'personnel', 'job_applications', 'attendance', 'salary_adjustments', 'personnel_tasks',
  'documents', 'orders', 'proposals'
];

async function check() {
  for (const t of tables) {
    await new Promise((resolve) => {
      http.get(`http://localhost:3000/api/${t}`, { headers: { 'x-tenant-id': '1111111111' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (data.startsWith('<')) {
            console.log(`Failed (HTML): /api/${t}`);
          } else {
            console.log(`OK: /api/${t}`);
          }
          resolve();
        });
      });
    });
  }
}
check();
