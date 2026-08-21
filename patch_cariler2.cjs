const fs = require('fs');

let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');

code = code.replace(
  "const [paymentForm, setPaymentForm] = useState<{ amount: number, description: string, type: 'Tahsilat' | 'Ödeme' | 'Borçlandırma', date: string }>({ amount: 0, description: '', type: 'Tahsilat', date: new Date().toISOString().split('T')[0] });",
  "const [paymentForm, setPaymentForm] = useState<{ amount: number, description: string, type: 'Tahsilat' | 'Ödeme' | 'Borçlandırma', date: string, installmentId?: string }>({ amount: 0, description: '', type: 'Tahsilat', date: new Date().toISOString().split('T')[0] });"
);

// In the handleSavePayment, check if installmentId exists and update it.
const searchPaymentSave = `    if (customers && setCustomers) {
      setCustomers((prev: any) => (prev || []).map(c => c.id === selectedCustomerForHistory.id ? {...c, balance: newBalance} : c));
      setSelectedCustomerForHistory({...selectedCustomerForHistory, balance: newBalance});
    }`;

const replacePaymentSave = `    if (customers && setCustomers) {
      setCustomers((prev: any) => (prev || []).map(c => {
        if (c.id === selectedCustomerForHistory.id) {
          let updatedInstallments = c.installments;
          if (paymentForm.installmentId && updatedInstallments) {
            updatedInstallments = updatedInstallments.map((inst: any) => 
              inst.id === paymentForm.installmentId ? { ...inst, isPaid: true, paidDate: new Date().toISOString() } : inst
            );
          }
          return { ...c, balance: newBalance, installments: updatedInstallments };
        }
        return c;
      }));
      
      let updatedSelectedInstallments = selectedCustomerForHistory.installments;
      if (paymentForm.installmentId && updatedSelectedInstallments) {
          updatedSelectedInstallments = updatedSelectedInstallments.map(inst => 
             inst.id === paymentForm.installmentId ? { ...inst, isPaid: true, paidDate: new Date().toISOString() } : inst
          );
      }
      setSelectedCustomerForHistory({...selectedCustomerForHistory, balance: newBalance, installments: updatedSelectedInstallments});
    }`;

code = code.replace(searchPaymentSave, replacePaymentSave);

// Also pass the installmentId when opening from the button:
code = code.replace(
  "date: new Date().toISOString().split('T')[0]\n                                  });",
  "date: new Date().toISOString().split('T')[0],\n                                    installmentId: inst.id\n                                  });"
);

fs.writeFileSync('pages/Cariler.tsx', code);
console.log("Patched Cariler Payment Logic");
