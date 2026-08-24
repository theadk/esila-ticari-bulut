const fs = require('fs');

let code = fs.readFileSync('pages/Satislar.tsx', 'utf8');

const replacement = `  const handleCancelOrder = (order: Order) => {
    if (order.status === OrderStatus.CANCELLED) return;
    if (!window.confirm(\`\${order.id} numaralı satışı iptal etmek ve ürünleri stoğa geri eklemek istediğinize emin misiniz?\`)) return;

    // Restore stock
    const products = [...store.products];
    order.items.forEach(item => {
      const idx = products.findIndex(p => p.id === item.productId);
      if (idx >= 0) {
        products[idx] = { ...products[idx], stock: (products[idx].stock || 0) + item.quantity };
      }
    });
    store.setProducts(products);
    
    // Reverse customer balance if it was a sale that affected balance
    if (order.customerId) {
        const customers = [...(store.customers || [])];
        const custIdx = customers.findIndex((c: any) => c.id === order.customerId);
        if (custIdx >= 0) {
            customers[custIdx] = { ...customers[custIdx], balance: (customers[custIdx].balance || 0) - order.total };
            store.setCustomers(customers);
            
            const refundTx = {
                id: \`CTX-REF-\${Date.now()}\`,
                customerId: order.customerId,
                date: new Date().toISOString().split('T')[0],
                type: 'Alacak' as const,
                amount: order.total,
                description: \`İptal Edilen Satış/Sipariş #\${order.id}\`
            };
            store.setTransactions((prev: any) => [refundTx, ...(prev || [])]);
        }
    }

    // Cancel order`;

code = code.replace(
  /  const handleCancelOrder = \(order: Order\) => \{\n    if \(order\.status === OrderStatus\.CANCELLED\) return;\n    if \(!window\.confirm.*?return;\n\n    \/\/ Restore stock\n    const products = \[\.\.\.store\.products\];\n    order\.items\.forEach\(item => \{\n      const idx = products\.findIndex\(p => p\.id === item\.productId\);\n      if \(idx >= 0\) \{\n        products\[idx\] = \{ \.\.\.products\[idx\], stock: products\[idx\]\.stock \+ item\.quantity \};\n      \}\n    \}\);\n    store\.setProducts\(products\);\n\n    \/\/ Cancel order/g,
  replacement
);

fs.writeFileSync('pages/Satislar.tsx', code);
console.log("Patched Satislar");
