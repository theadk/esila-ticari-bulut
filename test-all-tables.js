import http from 'http';
const tables = [
  'users', 'settings', 'products', 'customers', 'documents', 'orders', 'proposals',
  'e_invoices', 'e_archives', 'customer_transactions', 'cash_transactions', 'boms',
  'work_orders', 'bank_accounts', 'cheques', 'warehouses', 'warehouse_stocks',
  'stock_transfers', 'personnel', 'payroll', 'purchase_requests', 'tasks'
];
for (const t of tables) {
  http.get(`http://localhost:3000/api/${t}`, { headers: { 'x-tenant-id': '1111111111' } }, (res) => {
    if (res.statusCode !== 200) {
      console.log(`Error on ${t}: ${res.statusCode}`);
    }
  });
}
