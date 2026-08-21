const fs = require('fs');
let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');

const oldHandleSavePayment = `  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForHistory) return;
    
    const newTransaction: CustomerTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      customerId: selectedCustomerForHistory.id,
      date: paymentForm.date || new Date().toISOString().split('T')[0],
      type: paymentForm.type,
      amount: paymentForm.type === 'Tahsilat' ? -Math.abs(paymentForm.amount) : Math.abs(paymentForm.amount),
      description: paymentForm.description
    };

    
    setTransactions((prev: any) => [...(prev || []), newTransaction]);

    if (paymentForm.type !== 'Borçlandırma') {
      const newCashTx: CashTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        date: newTransaction.date,
        type: paymentForm.type === 'Tahsilat' ? 'Gelir' : 'Gider',
        category: paymentForm.type === 'Tahsilat' ? 'Cari Tahsilat' : 'Cari Ödeme',
        amount: Math.abs(paymentForm.amount),
        description: paymentForm.description + ' (' + (selectedCustomerForHistory.companyName || selectedCustomerForHistory.name) + ')',
        customerId: selectedCustomerForHistory.id
      };
      setCashTransactions((prev: any) => [...(prev || []), newCashTx]);
    }

    const updatedCustomers = (prev: any) => (prev || []).map(c => {
      if (c.id === selectedCustomerForHistory.id) {
        return { ...c, balance: c.balance + newTransaction.amount };
      }
      return c;
    });
    setCustomers(updatedCustomers);
    
    // Update the selected customer reference inside the modal if it's open
    if (isHistoryModalOpen) {
      setSelectedCustomerForHistory(updatedCustomers.find(c => c.id === selectedCustomerForHistory.id) || null);
    }
    
    setIsPaymentModalOpen(false);
  };`;

const newHandleSavePayment = `  const printPaymentReceipt = (tx: CustomerTransaction, customer: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const isTahsilat = tx.type === 'Tahsilat';
    const title = isTahsilat ? 'TAHSİLAT MAKBUZU' : 'ÖDEME MAKBUZU';
    const amountAbs = Math.abs(tx.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    
    const html = \`
      <html>
        <head>
          <title>\${title}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; margin: 0 auto; max-width: 800px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 24px; color: #1f2937; letter-spacing: 1px; }
            .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
            .content { display: flex; flex-direction: column; gap: 20px; }
            .row { display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding: 10px 0; }
            .label { font-weight: bold; color: #4b5563; }
            .value { color: #111827; }
            .amount-box { text-align: right; margin-top: 30px; padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
            .amount-box .total { font-size: 24px; font-weight: bold; color: #059669; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; }
            .signature { width: 200px; border-top: 1px solid #9ca3af; padding-top: 10px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>\${title}</h1>
            <p>Tarih: \${new Date(tx.date).toLocaleDateString('tr-TR')}</p>
            <p>Makbuz No: \${tx.id.toUpperCase()}</p>
          </div>
          <div class="content">
            <div class="row">
              <span class="label">Cari Ünvanı / Adı:</span>
              <span class="value">\${customer.companyName || customer.name}</span>
            </div>
            <div class="row">
              <span class="label">Açıklama:</span>
              <span class="value">\${tx.description || '-'}</span>
            </div>
            <div class="row">
              <span class="label">İşlem Tipi:</span>
              <span class="value">\${tx.type}</span>
            </div>
          </div>
          <div class="amount-box">
            <div class="label">İşlem Tutarı</div>
            <div class="total">\${amountAbs} ₺</div>
          </div>
          <div class="footer">
            <div class="signature">Müşteri Kaşe/İmza</div>
            <div class="signature">Firma Yetkilisi İmza</div>
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    \`;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForHistory) return;
    
    const newTransaction: CustomerTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      customerId: selectedCustomerForHistory.id,
      date: paymentForm.date || new Date().toISOString().split('T')[0],
      type: paymentForm.type,
      amount: paymentForm.type === 'Tahsilat' ? -Math.abs(paymentForm.amount) : Math.abs(paymentForm.amount),
      description: paymentForm.description
    };

    setTransactions((prev: any) => [...(prev || []), newTransaction]);

    if (paymentForm.type !== 'Borçlandırma') {
      const newCashTx = {
        id: Math.random().toString(36).substr(2, 9),
        date: newTransaction.date,
        type: paymentForm.type === 'Tahsilat' ? 'Gelir' : 'Gider',
        category: paymentForm.type === 'Tahsilat' ? 'Cari Tahsilat' : 'Cari Ödeme',
        amount: Math.abs(paymentForm.amount),
        description: paymentForm.description + ' (' + (selectedCustomerForHistory.companyName || selectedCustomerForHistory.name) + ')',
        customerId: selectedCustomerForHistory.id
      };
      setCashTransactions((prev: any) => [...(prev || []), newCashTx]);
    }

    let updatedSelectedCustomer = { ...selectedCustomerForHistory };

    setCustomers((prev: any) => {
      return (prev || []).map((c: any) => {
        if (c.id === selectedCustomerForHistory.id) {
          let updatedInstallments = c.installments;
          if (paymentForm.installmentId && updatedInstallments) {
            updatedInstallments = updatedInstallments.map((inst: any) => 
              inst.id === paymentForm.installmentId ? { ...inst, isPaid: true, paidDate: new Date().toISOString() } : inst
            );
          }
          const finalC = { ...c, balance: c.balance + newTransaction.amount, installments: updatedInstallments };
          updatedSelectedCustomer = finalC;
          return finalC;
        }
        return c;
      });
    });
    
    // Update the selected customer reference inside the modal if it's open
    if (isHistoryModalOpen) {
      setSelectedCustomerForHistory(updatedSelectedCustomer);
    }
    
    setIsPaymentModalOpen(false);
    
    // Auto print receipt if Tahsilat/Ödeme
    if (paymentForm.type === 'Tahsilat' || paymentForm.type === 'Ödeme') {
        printPaymentReceipt(newTransaction, updatedSelectedCustomer);
    }
  };`;

// Note: Replace using a regex pattern or manual substring to avoid whitespace mismatch issues.
const startIdx = code.indexOf('  const handleSavePayment = (e: React.FormEvent) => {');
const endIdx = code.indexOf('  const handleDeleteTransaction = (tx: CustomerTransaction) => {');

if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + newHandleSavePayment + "\n\n" + code.substring(endIdx);
    fs.writeFileSync('pages/Cariler.tsx', code);
    console.log("Replaced handleSavePayment successfully.");
} else {
    console.log("Could not find start or end index.");
}
