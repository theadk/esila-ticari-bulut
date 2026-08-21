const fs = require('fs');
let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');

// 1. Add states
const statesRegex = /const \[paymentForm, setPaymentForm\] = useState[\s\S]*?;/;
code = code.replace(statesRegex, (match) => {
    return match + `\n  const [isPostponeModalOpen, setIsPostponeModalOpen] = useState(false);\n  const [postponeForm, setPostponeForm] = useState<{ installmentId: string, oldDate: string, newDate: string, notifyCustomer: boolean }>({ installmentId: '', oldDate: '', newDate: '', notifyCustomer: true });`;
});

// 2. Add handlePostponeInstallment
const savePaymentRegex = /const handleSavePayment = \(e: React\.FormEvent\) => \{/;
const handlePostponeFunc = `
  const handlePostponeInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForHistory) return;

    let updatedSelectedCustomer = { ...selectedCustomerForHistory };
    let changedInstallment = null;

    setCustomers((prev: any) => {
      return (prev || []).map((c: any) => {
        if (c.id === selectedCustomerForHistory.id) {
          if (!c.installments) return c;
          
          const updatedInstallments = c.installments.map((inst: any) => {
            if (inst.id === postponeForm.installmentId) {
              changedInstallment = { ...inst, dueDate: postponeForm.newDate };
              return changedInstallment;
            }
            return inst;
          });
          
          updatedInstallments.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
          const finalC = { ...c, installments: updatedInstallments };
          updatedSelectedCustomer = finalC;
          return finalC;
        }
        return c;
      });
    });

    if (isHistoryModalOpen) {
      setSelectedCustomerForHistory(updatedSelectedCustomer);
    }
    setIsPostponeModalOpen(false);

    if (postponeForm.notifyCustomer && updatedSelectedCustomer.email && changedInstallment) {
      let html = \`
        <h2 style="color: #ea580c; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 24px;">Taksit Erteleme Bilgilendirmesi</h2>
        <p style="margin-bottom: 24px;">Sayın <b>\${updatedSelectedCustomer.name || updatedSelectedCustomer.companyName}</b>,<br>Aşağıdaki taksitinizin vade tarihi talebiniz/onayınız doğrultusunda ötelenmiştir.</p>
        <div style="background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background-color: #ffedd5; color: #9a3412; text-align: left; font-size: 14px;">
                    <th style="padding: 12px 16px; border-bottom: 1px solid #fed7aa; font-weight: 600;">Açıklama</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #fed7aa; font-weight: 600;">Eski Vade</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #fed7aa; font-weight: 600;">Yeni Vade</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #fed7aa; font-weight: 600; text-align: right;">Tutar</th>
                </tr>
            </thead>
            <tbody style="background-color: #ffffff;">
                <tr style="font-size: 14px;">
                    <td style="padding: 12px 16px; color: #111827; font-weight: 500;">\${changedInstallment.description || '-'}</td>
                    <td style="padding: 12px 16px; color: #6b7280; text-decoration: line-through;">\${new Date(postponeForm.oldDate).toLocaleDateString('tr-TR')}</td>
                    <td style="padding: 12px 16px; color: #ea580c; font-weight: 700;">\${new Date(changedInstallment.dueDate).toLocaleDateString('tr-TR')}</td>
                    <td style="padding: 12px 16px; color: #111827; font-weight: 700; text-align: right;">\${parseFloat(changedInstallment.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                </tr>
            </tbody>
        </table>
        </div>
        <p style="margin-bottom: 0;">İyi çalışmalar dileriz.</p>
      \`;

      const tenantId = localStorage.getItem('esila_tenant_id') || '1111111111';
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({
          to: updatedSelectedCustomer.email,
          subject: 'Taksit Erteleme Bilgilendirmesi',
          html: html
        })
      }).catch(console.error);
    }
  };
`;
code = code.replace(savePaymentRegex, handlePostponeFunc + '\n  ' + "const handleSavePayment = (e: React.FormEvent) => {");

// 3. Add Postpone button in UI
const oldButtonHtml = `
                              <button
                                onClick={() => {
                                  setPaymentForm({
                                    amount: inst.amount,
                                    description: inst.description + ' Tahsilatı',
                                    type: 'Tahsilat',
                                    date: new Date().toISOString().split('T')[0],
                                    installmentId: inst.id
                                  });
                                  setIsPaymentModalOpen(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 transition-colors text-sm font-medium"
                              >
                                Tahsil Et
                              </button>
`;
const newButtonHtml = `
                              <div className="flex justify-center items-center gap-3">
                                <button
                                  onClick={() => {
                                    setPaymentForm({
                                      amount: inst.amount,
                                      description: inst.description + ' Tahsilatı',
                                      type: 'Tahsilat',
                                      date: new Date().toISOString().split('T')[0],
                                      installmentId: inst.id
                                    });
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-800 transition-colors text-sm font-medium"
                                >
                                  Tahsil Et
                                </button>
                                <button
                                  onClick={() => {
                                    setPostponeForm({
                                      installmentId: inst.id,
                                      oldDate: inst.dueDate,
                                      newDate: inst.dueDate,
                                      notifyCustomer: true
                                    });
                                    setIsPostponeModalOpen(true);
                                  }}
                                  className="text-orange-600 hover:text-orange-800 transition-colors text-sm font-medium"
                                >
                                  Ertele
                                </button>
                              </div>
`;
code = code.replace(oldButtonHtml, newButtonHtml);

// 4. Add Postpone Modal UI
const modalTargetRegex = /\{\/\* Taksit Ekle Modal \*\/\}/;
const postponeModalHtml = `
      {/* Taksit Ertele Modal */}
      {isPostponeModalOpen && selectedCustomerForHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden">
             <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Calendar className="text-orange-600" size={20} />
                Taksit Ertele (Ötele)
              </h3>
              <button type="button" onClick={() => setIsPostponeModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePostponeInstallment} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Vade Tarihi</label>
                <input 
                  type="date"
                  value={postponeForm.oldDate.split('T')[0]}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Vade Tarihi</label>
                <input 
                  type="date"
                  value={postponeForm.newDate.split('T')[0]}
                  onChange={(e) => setPostponeForm({...postponeForm, newDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-orange-50/10"
                />
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={postponeForm.notifyCustomer}
                    onChange={(e) => setPostponeForm({...postponeForm, notifyCustomer: e.target.checked})}
                    className="rounded border-gray-300 text-orange-600 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                  />
                  <span className="text-sm text-gray-700">Ertelemeyi müşteriye e-posta ile bildir</span>
                </label>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t">
                <button 
                  type="button"
                  onClick={() => setIsPostponeModalOpen(false)} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  Ertele
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;
code = code.replace(modalTargetRegex, postponeModalHtml + '\n      {/* Taksit Ekle Modal */}');

fs.writeFileSync('pages/Cariler.tsx', code);
console.log("Patched Cariler.tsx successfully");
