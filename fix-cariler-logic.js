import fs from 'fs';
const f = 'pages/Cariler.tsx';
let txt = fs.readFileSync(f, 'utf8');

txt = txt.replace(
  `    const updatedCustomers = (prev: any) => (prev || []).map(c => {
      if (c.id === selectedCustomerForHistory.id) {
        return { ...c, balance: c.balance + newTransaction.amount };
      }
      return c;
    });
    setCustomers(updatedCustomers);
    
    // Update the selected customer reference inside the modal if it's open
    if (isHistoryModalOpen) {
      setSelectedCustomerForHistory(store.customers.find(c => c.id === selectedCustomerForHistory.id) || null);
    }`,
  `    setCustomers((prev: any) => {
      const updated = (prev || []).map((c: any) => {
        if (c.id === selectedCustomerForHistory.id) {
          return { ...c, balance: c.balance + newTransaction.amount };
        }
        return c;
      });
      if (isHistoryModalOpen) {
        setTimeout(() => setSelectedCustomerForHistory(updated.find((c: any) => c.id === selectedCustomerForHistory.id) || null), 0);
      }
      return updated;
    });`
);
fs.writeFileSync(f, txt);
