import fs from 'fs';
const f = 'pages/Cariler.tsx';
let txt = fs.readFileSync(f, 'utf8');

txt = txt.replace(
  /const updatedCustomers = \(prev: any\) => \(prev \|\| \[\]\)\.map\(c => \{\n\s*if \(c\.id === selectedCustomerForHistory\.id\) \{\n\s*return \{ \.\.\.c, balance: c\.balance \+ newTransaction\.amount \};\n\s*\}\n\s*return c;\n\s*\}\);\n\s*setCustomers\(updatedCustomers\);\n\s*\/\/ Update the selected customer reference inside the modal if it's open\n\s*if \(isHistoryModalOpen\) \{\n\s*setSelectedCustomerForHistory\(updatedCustomers\.find\(c => c\.id === selectedCustomerForHistory\.id\) \|\| null\);\n\s*\}/g,
  `setCustomers((prev: any) => {
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

txt = txt.replace(
  /const updatedCustomers = \(prev: any\) => \(prev \|\| \[\]\)\.map\(c => \{\n\s*if \(c\.id === selectedCustomerForHistory\.id\) \{\n\s*return \{ \.\.\.c, balance: c\.balance - tx\.amount \};\n\s*\}\n\s*return c;\n\s*\}\);\n\s*setCustomers\(updatedCustomers\);\n\s*setSelectedCustomerForHistory\(updatedCustomers\.find\(c => c\.id === selectedCustomerForHistory\.id\) \|\| null\);/g,
  `setCustomers((prev: any) => {
              const updated = (prev || []).map((c: any) => {
                if (c.id === selectedCustomerForHistory.id) {
                  return { ...c, balance: c.balance - tx.amount };
                }
                return c;
              });
              setTimeout(() => setSelectedCustomerForHistory(updated.find((c: any) => c.id === selectedCustomerForHistory.id) || null), 0);
              return updated;
            });`
);

fs.writeFileSync(f, txt);
