const fs = require('fs');

let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');

// Remove addOrderToDB
code = code.replace(
  /const addOrderToDB = async \(order: Order\) => \{[\s\S]*?^  \};\n/m,
  ''
);

// Fix handleCreateOrder
const oldHandleCreateOrderRegex = /await addOrderToDB\(newOrder\);\s*\n\s*\/\/ Optimistic update\s*\n\s*store\.setOrders\(\(prev: Order\[\]\) => \[newOrder, \.\.\.\(prev || \[\]\)\]\);/g;

const newCreateOrderLines = `      store.setOrders((prev: Order[]) => [newOrder, ...(prev || [])]);

      // Cari'ye yazma işlemi (Update customer balance and transactions)
      if (customerInfo.id) {
        const customer = store.customers?.find((c: any) => c.id === customerInfo.id);
        if (customer) {
           const newTx = {
             id: \`CTX-ORD-\${Date.now()}\`,
             customerId: customer.id,
             date: new Date().toISOString().split('T')[0],
             type: 'Borç',
             amount: totals.total,
             description: \`Sipariş #\${newOrder.id.substring(0,8).toUpperCase()}\`
           };
           
           const currentBalance = customer.balance || 0;
           store.setCustomers((prev: any) => prev.map((c: any) => 
              c.id === customer.id ? { ...c, balance: currentBalance + totals.total } : c
           ));
           
           store.setTransactions((prev: any) => [newTx, ...(prev || [])]);
        }
      }`;

code = code.replace(oldHandleCreateOrderRegex, newCreateOrderLines);

fs.writeFileSync('pages/Siparisler.tsx', code);
console.log("Patched Siparisler");
