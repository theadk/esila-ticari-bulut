const tables = [
  'users', 'settings', 'customers', 'products', 'inventory_transactions',
  'categories', 'transactions', 'cash_transactions', 'orders', 'proposals',
  'e_invoices', 'service_tickets', 'reminder_notes', 'notifications',
  'campaigns', 'waybills', 'purchase_requests', 'cheque_notes',
  'suspended_carts', 'personnel_kpis', 'meeting_notes'
];
async function run() {
  for (const t of tables) {
    const res = await fetch("http://localhost:3000/api/" + t, { headers: { "x-tenant-id": "1111111111" } });
    console.log(t, res.status);
    if (!res.ok) {
       console.log("Failed:", t, await res.text());
    }
  }
}
run();
