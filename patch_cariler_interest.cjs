const fs = require('fs');
let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');

// 1. Add states
const statesRegex = /const \[postponeForm, setPostponeForm\] = useState[\s\S]*?;/;
code = code.replace(statesRegex, (match) => {
    return match + `\n  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);\n  const [interestForm, setInterestForm] = useState({ installmentId: '', baseAmount: 0, daysOverdue: 0, ratePerMonth: 5, interestAmount: 0, newTotalAmount: 0, newDueDate: new Date().toISOString().split('T')[0] });`;
});

// 2. Add handleApplyInterest
const savePaymentRegex = /const handlePostponeInstallment = \(e: React\.FormEvent\) => \{/;
const handleInterestFunc = `
  const handleApplyInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForHistory) return;

    let updatedSelectedCustomer = { ...selectedCustomerForHistory };
    let changedInstallment = null;

    setCustomers((prev: any) => {
      return (prev || []).map((c: any) => {
        if (c.id === selectedCustomerForHistory.id) {
          if (!c.installments) return c;
          
          const updatedInstallments = c.installments.map((inst: any) => {
            if (inst.id === interestForm.installmentId) {
              changedInstallment = { 
                ...inst, 
                amount: interestForm.newTotalAmount,
                dueDate: interestForm.newDueDate,
                description: \`\${inst.description} (+ %\${interestForm.ratePerMonth} Gecikme Faizi)\`
              };
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
    
    // Add transaction for interest
    if (interestForm.interestAmount > 0 && changedInstallment) {
        const newTransaction = {
            id: Math.random().toString(36).substr(2, 9),
            customerId: selectedCustomerForHistory.id,
            date: new Date().toISOString().split('T')[0],
            type: 'Borçlandırma',
            amount: interestForm.interestAmount,
            description: \`Gecikme Faizi - \${(changedInstallment as any).description}\`
        };
        setTransactions((prev: any) => [...(prev || []), newTransaction]);
    }

    if (isHistoryModalOpen) {
      setSelectedCustomerForHistory(updatedSelectedCustomer);
    }
    setIsInterestModalOpen(false);
  };
`;
code = code.replace(savePaymentRegex, handleInterestFunc + '\n  ' + "const handlePostponeInstallment = (e: React.FormEvent) => {");

// 3. Add Yapılandır button next to Ertele
const erteleButtonRegex = /<button\s+onClick=\{\(\) => \{\s+setPostponeForm\(\{\s+installmentId: inst\.id,\s+oldDate: inst\.dueDate,\s+newDate: inst\.dueDate,\s+notifyCustomer: true\s+\}\);\s+setIsPostponeModalOpen\(true\);\s+\}\}\s+className="text-orange-600 hover:text-orange-800 transition-colors text-sm font-medium"\s+>\s+Ertele\s+<\/button>/;

const newButtonsHtml = `
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
                                {new Date(inst.dueDate) < new Date(new Date().setHours(0,0,0,0)) && (
                                  <button
                                    onClick={() => {
                                      const today = new Date();
                                      today.setHours(0,0,0,0);
                                      const due = new Date(inst.dueDate);
                                      due.setHours(0,0,0,0);
                                      const days = Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 3600 * 24)));
                                      
                                      const rate = 5; // %5 aylık temerrüt faizi varsayımı
                                      // Aylık %5 = günlük % (5/30)
                                      const interest = Number(((inst.amount * (rate / 30) * days) / 100).toFixed(2));
                                      const nextMonth = new Date();
                                      nextMonth.setMonth(nextMonth.getMonth() + 1);

                                      setInterestForm({
                                        installmentId: inst.id,
                                        baseAmount: inst.amount,
                                        daysOverdue: days,
                                        ratePerMonth: rate,
                                        interestAmount: interest,
                                        newTotalAmount: inst.amount + interest,
                                        newDueDate: nextMonth.toISOString().split('T')[0]
                                      });
                                      setIsInterestModalOpen(true);
                                    }}
                                    className="text-red-600 hover:text-red-800 transition-colors text-sm font-medium"
                                  >
                                    Yapılandır
                                  </button>
                                )}
`;
code = code.replace(erteleButtonRegex, newButtonsHtml);

// 4. Add the Interest Modal UI
const modalTargetRegex = /\{\/\* Taksit Ekle Modal \*\/\}/;
const interestModalHtml = `
      {/* Taksit Gecikme Faizi / Yapılandırma Modal */}
      {isInterestModalOpen && selectedCustomerForHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden">
             <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <AlertCircle className="text-red-600" size={20} />
                Gecikme Faizi & Yapılandırma
              </h3>
              <button type="button" onClick={() => setIsInterestModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleApplyInterest} className="p-4 sm:p-6 space-y-4">
              <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-4">
                <p className="text-sm text-red-800">
                  Bu taksit <strong>{interestForm.daysOverdue} gün</strong> gecikmiş durumda. 
                  Otomatik faiz hesaplaması yaparak yeni bir ödeme tarihi belirleyebilirsiniz.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ana Para</label>
                  <input 
                    type="text"
                    value={interestForm.baseAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aylık Faiz Oranı (%)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={interestForm.ratePerMonth}
                    onChange={(e) => {
                      const rate = Number(e.target.value);
                      const interest = Number(((interestForm.baseAmount * (rate / 30) * interestForm.daysOverdue) / 100).toFixed(2));
                      setInterestForm({
                        ...interestForm, 
                        ratePerMonth: rate,
                        interestAmount: interest,
                        newTotalAmount: interestForm.baseAmount + interest
                      });
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hesaplanan Faiz</label>
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={interestForm.interestAmount}
                      onChange={(e) => {
                        const interest = Number(e.target.value);
                        setInterestForm({
                          ...interestForm,
                          interestAmount: interest,
                          newTotalAmount: interestForm.baseAmount + interest
                        });
                      }}
                      className="w-full px-4 py-2 border border-red-300 rounded-lg bg-red-50/30 text-red-700 focus:ring-red-500 focus:border-red-500"
                    />
                    <span className="absolute right-3 top-2.5 text-red-600 font-medium">₺</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Toplam Tutar</label>
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.01"
                      value={interestForm.newTotalAmount}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-bold text-gray-900"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-600 font-bold">₺</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Vade Tarihi</label>
                <input 
                  type="date"
                  value={interestForm.newDueDate}
                  onChange={(e) => setInterestForm({...interestForm, newDueDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t">
                <button 
                  type="button"
                  onClick={() => setIsInterestModalOpen(false)} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  Faizle Yapılandır
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;
code = code.replace(modalTargetRegex, interestModalHtml + '\n      {/* Taksit Ekle Modal */}');

fs.writeFileSync('pages/Cariler.tsx', code);
console.log("Patched Cariler.tsx with Interest/Restructure module");
