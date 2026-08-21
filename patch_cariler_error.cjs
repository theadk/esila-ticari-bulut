const fs = require('fs');

let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');

const searchStr = `            const updatedCustomers = (prev: any) => (prev || []).map(c => {
               if (c.id === selectedCustomerForHistory.id) {
                 return { ...c, balance: c.balance + totalAmountChange };
               }
               return c;
            });
            setCustomers(updatedCustomers);
            setSelectedCustomerForHistory(updatedCustomers.find(c => c.id === selectedCustomerForHistory.id) || null);`;

const replaceStr = `            setCustomers((prev: any) => (prev || []).map(c => {
               if (c.id === selectedCustomerForHistory.id) {
                 const updated = { ...c, balance: c.balance + totalAmountChange };
                 setSelectedCustomerForHistory(updated);
                 return updated;
               }
               return c;
            }));`;

code = code.replace(searchStr, replaceStr);

fs.writeFileSync('pages/Cariler.tsx', code);
console.log("Patched Cariler TS error");
