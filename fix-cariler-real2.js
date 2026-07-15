import fs from 'fs';
const f = 'pages/Cariler.tsx';
let txt = fs.readFileSync(f, 'utf8');

txt = txt.replace(
  `            const updatedCustomers = (prev: any) => (prev || []).map(c => {
               if (c.id === selectedCustomerForHistory.id) {
                 return { ...c, balance: c.balance + totalAmountChange };
               }
               return c;
            });
            setCustomers(updatedCustomers);
            setSelectedCustomerForHistory(updatedCustomers.find(c => c.id === selectedCustomerForHistory.id) || null);`,
  `            setCustomers((prev: any) => {
              const updated = (prev || []).map((c: any) => {
                if (c.id === selectedCustomerForHistory.id) {
                  return { ...c, balance: c.balance + totalAmountChange };
                }
                return c;
              });
              setTimeout(() => setSelectedCustomerForHistory(updated.find((c: any) => c.id === selectedCustomerForHistory.id) || null), 0);
              return updated;
            });`
);

fs.writeFileSync(f, txt);
