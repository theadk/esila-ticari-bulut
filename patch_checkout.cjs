const fs = require('fs');

let code = fs.readFileSync('pages/HizliSatis.tsx', 'utf8');

// 1. Update the signature
code = code.replace(
  "const handleCheckout = (paymentMethod: 'Nakit' | 'Kredi Kartı' | 'Cari') => {",
  "const handleCheckout = (paymentMethod: 'Nakit' | 'Kredi Kartı' | 'Cari' | 'Taksit', taksitConfig?: { count: number, intervalDays: number }) => {"
);

// 2. Update cash transaction condition
code = code.replace(
  "if (paymentMethod !== 'Cari') {\n      const txId = `TX-${Date.now()}`;",
  "if (paymentMethod !== 'Cari' && paymentMethod !== 'Taksit') {\n      const txId = `TX-${Date.now()}`;"
);

// 3. Update finalBalanceDelta handling & Installments
const balanceDeltaCode = `      if (paymentMethod !== 'Cari') {
        const tx1 = {
          id: \`CTX-\${Date.now()}\`,
          customerId: currentCustomer.id,
          date: new Date().toISOString().split('T')[0],
          type: 'Alacak' as const,
          amount: totalAmount,
          description: \`Hızlı Satış Tahsilatı (\${paymentMethod})\`
        };
        newTransactions.push(tx1);
        finalBalanceDelta -= totalAmount;
      }`;

const newBalanceDeltaCode = `      if (paymentMethod !== 'Cari' && paymentMethod !== 'Taksit') {
        const tx1 = {
          id: \`CTX-\${Date.now()}\`,
          customerId: currentCustomer.id,
          date: new Date().toISOString().split('T')[0],
          type: 'Alacak' as const,
          amount: totalAmount,
          description: \`Hızlı Satış Tahsilatı (\${paymentMethod})\`
        };
        newTransactions.push(tx1);
        finalBalanceDelta -= totalAmount;
      }

      let newInstallments: any[] = [];
      let newReminders: any[] = [];
      if (paymentMethod === 'Taksit' && taksitConfig) {
         const installmentAmount = totalAmount / taksitConfig.count;
         let currentDate = new Date();
         for (let i = 0; i < taksitConfig.count; i++) {
            currentDate.setDate(currentDate.getDate() + taksitConfig.intervalDays);
            const dueDateStr = currentDate.toISOString().split('T')[0];
            newInstallments.push({
               id: \`INS-\${Date.now()}-\${i}\`,
               orderId: newOrder.id,
               amount: installmentAmount,
               dueDate: dueDateStr,
               isPaid: false,
               description: \`\${i+1}. Taksit\`
            });
            newReminders.push({
               id: \`REM-\${Date.now()}-\${i}\`,
               title: \`Taksit Ödemesi: \${currentCustomer.name}\`,
               description: \`\${newOrder.id} nolu satışa ait \${i+1}. taksit ödemesi.\`,
               date: dueDateStr,
               type: 'customer',
               isCompleted: false,
               relatedId: currentCustomer.id,
               amount: installmentAmount
            });
         }
      }
`;

code = code.replace(balanceDeltaCode, newBalanceDeltaCode);

// 4. Update store.setCustomers
const setCustomersCode = `      store.setCustomers((prev: any) => {
        const customersList = prev || [];
        if (isNewCustomer) {
           return [...customersList, { ...currentCustomer, balance: (currentCustomer!.balance || 0) + finalBalanceDelta }];
        } else {
           return customersList.map((c: any) => {
              if (c.id === currentCustomer!.id) {
                 return { ...c, balance: Number(c.balance || 0) + finalBalanceDelta };
              }
              return c;
           });
        }
      });`;

const newSetCustomersCode = `      store.setCustomers((prev: any) => {
        const customersList = prev || [];
        if (isNewCustomer) {
           const c = { ...currentCustomer, balance: (currentCustomer!.balance || 0) + finalBalanceDelta };
           if (newInstallments.length > 0) c.installments = [...(c.installments||[]), ...newInstallments];
           return [...customersList, c];
        } else {
           return customersList.map((c: any) => {
              if (c.id === currentCustomer!.id) {
                 const updated = { ...c, balance: Number(c.balance || 0) + finalBalanceDelta };
                 if (newInstallments.length > 0) updated.installments = [...(c.installments||[]), ...newInstallments];
                 return updated;
              }
              return c;
           });
        }
      });
      if (newReminders.length > 0) {
        store.setReminderNotes((prev: any) => [...(prev || []), ...newReminders]);
      }`;

code = code.replace(setCustomersCode, newSetCustomersCode);

fs.writeFileSync('pages/HizliSatis.tsx', code);
console.log("Patched HizliSatis checkout logic.");

