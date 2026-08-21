const fs = require('fs');
let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');

// 1. Add Installment states
const stateSearch = "const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);";
const stateReplace = `const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [installmentForm, setInstallmentForm] = useState({ totalAmount: 0, count: 1, firstDueDate: new Date().toISOString().split('T')[0], period: 'monthly', description: 'Taksit', addToBalance: true });`;
code = code.replace(stateSearch, stateReplace);

// 2. Add handleSaveInstallmentPlan
const savePaymentSearch = "const handleSavePayment = (e: React.FormEvent) => {";
const saveInstallmentFn = `  const handleSaveInstallmentPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForHistory || installmentForm.totalAmount <= 0 || installmentForm.count < 1) return;

    let updatedSelectedCustomer = { ...selectedCustomerForHistory };
    let newInstallments: any[] = [];
    
    const amountPerInstallment = installmentForm.totalAmount / installmentForm.count;
    let currentDate = new Date(installmentForm.firstDueDate);
    
    for (let i = 0; i < installmentForm.count; i++) {
        newInstallments.push({
            id: Math.random().toString(36).substr(2, 9),
            amount: amountPerInstallment,
            dueDate: currentDate.toISOString(),
            isPaid: false,
            description: \`\${installmentForm.description} (\${i+1}/\${installmentForm.count})\`
        });
        
        // increment date
        if (installmentForm.period === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (installmentForm.period === 'weekly') {
            currentDate.setDate(currentDate.getDate() + 7);
        } else {
            // daily
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    // Optional: Add as debt
    if (installmentForm.addToBalance) {
        const newTransaction = {
            id: Math.random().toString(36).substr(2, 9),
            customerId: selectedCustomerForHistory.id,
            date: new Date().toISOString().split('T')[0],
            type: 'Borçlandırma',
            amount: installmentForm.totalAmount,
            description: installmentForm.description + ' (Taksitli)'
        };
        setTransactions((prev: any) => [...(prev || []), newTransaction]);
        updatedSelectedCustomer.balance += installmentForm.totalAmount;
    }

    updatedSelectedCustomer.installments = [...(updatedSelectedCustomer.installments || []), ...newInstallments];
    
    setCustomers((prev: any) => {
      return (prev || []).map((c: any) => {
        if (c.id === selectedCustomerForHistory.id) {
          return updatedSelectedCustomer;
        }
        return c;
      });
    });

    if (isHistoryModalOpen) {
        setSelectedCustomerForHistory(updatedSelectedCustomer);
    }

    setIsInstallmentModalOpen(false);
    toast.success("Taksit planı oluşturuldu");
  };

  const handleSavePayment = (e: React.FormEvent) => {`;
code = code.replace(savePaymentSearch, saveInstallmentFn);

// 3. Add 'Taksitlendir' button next to Borçlandır in the list
const borclandirBtnSearch = `<button 
                          title="Manuel Borçlandır"
                          onClick={() => handleOpenPayment(customer, 'Borçlandırma')}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-orange-600 transition-colors"
                        >
                          <CreditCard size={18} />
                        </button>`;
const borclandirBtnReplace = `<button 
                          title="Manuel Borçlandır"
                          onClick={() => handleOpenPayment(customer, 'Borçlandırma')}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-orange-600 transition-colors"
                        >
                          <CreditCard size={18} />
                        </button>
                        <button 
                          title="Taksitlendir"
                          onClick={() => {
                            setSelectedCustomerForHistory(customer);
                            setInstallmentForm({ totalAmount: 0, count: 1, firstDueDate: new Date().toISOString().split('T')[0], period: 'monthly', description: 'Taksit', addToBalance: true });
                            setIsInstallmentModalOpen(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors"
                        >
                          <Calendar size={18} />
                        </button>`;
code = code.replace(borclandirBtnSearch, borclandirBtnReplace);

// 4. Add the same button in History Modal header
const historyModalBtnSearch = `<button 
                  onClick={() => handleOpenPayment(selectedCustomerForHistory, 'Borçlandırma')}
                  className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-orange-700 transition-colors flex items-center gap-1"
                >
                  <CreditCard size={16} /> <span className="hidden sm:inline">Borçlandır</span>
                </button>`;
const historyModalBtnReplace = `<button 
                  onClick={() => handleOpenPayment(selectedCustomerForHistory, 'Borçlandırma')}
                  className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-orange-700 transition-colors flex items-center gap-1"
                >
                  <CreditCard size={16} /> <span className="hidden sm:inline">Borçlandır</span>
                </button>
                <button 
                  onClick={() => {
                    setInstallmentForm({ totalAmount: 0, count: 1, firstDueDate: new Date().toISOString().split('T')[0], period: 'monthly', description: 'Taksit', addToBalance: true });
                    setIsInstallmentModalOpen(true);
                  }}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700 transition-colors flex items-center gap-1"
                >
                  <Calendar size={16} /> <span className="hidden sm:inline">Taksit Ekle</span>
                </button>`;
code = code.replace(historyModalBtnSearch, historyModalBtnReplace);

// 5. Add the Installment Modal component at the end
const endOfModalsSearch = "{/* A4 Ekstre Print Modal */}";
const installmentModal = `
      {/* Taksit Ekle Modal */}
      {isInstallmentModalOpen && selectedCustomerForHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden">
             <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Calendar className="text-indigo-600" size={20} />
                Taksit Planı Oluştur
              </h3>
              <button type="button" onClick={() => setIsInstallmentModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveInstallmentPlan} className="p-4 sm:p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cari: <span className="font-bold text-gray-900">{selectedCustomerForHistory.companyName || selectedCustomerForHistory.name}</span></label>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Tutar</label>
                    <input 
                      type="number" 
                      required 
                      step="0.01" 
                      className="w-full p-2 border border-gray-300 rounded-lg" 
                      value={installmentForm.totalAmount || ''} 
                      onChange={e => setInstallmentForm({...installmentForm, totalAmount: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Taksit Sayısı</label>
                    <input 
                      type="number" 
                      required 
                      min="1" 
                      max="120"
                      className="w-full p-2 border border-gray-300 rounded-lg" 
                      value={installmentForm.count} 
                      onChange={e => setInstallmentForm({...installmentForm, count: Number(e.target.value)})}
                    />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İlk Taksit Tarihi</label>
                    <input 
                      type="date" 
                      required 
                      className="w-full p-2 border border-gray-300 rounded-lg" 
                      value={installmentForm.firstDueDate} 
                      onChange={e => setInstallmentForm({...installmentForm, firstDueDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Periyot</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg" 
                      value={installmentForm.period} 
                      onChange={e => setInstallmentForm({...installmentForm, period: e.target.value})}
                    >
                        <option value="monthly">Aylık</option>
                        <option value="weekly">Haftalık</option>
                        <option value="daily">Günlük</option>
                    </select>
                  </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama (Örn: Senet, Kredi Kartı)</label>
                 <input 
                    type="text" 
                    required 
                    className="w-full p-2 border border-gray-300 rounded-lg" 
                    value={installmentForm.description} 
                    onChange={e => setInstallmentForm({...installmentForm, description: e.target.value})}
                 />
               </div>

               <div className="flex items-center gap-2 mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <input 
                    type="checkbox" 
                    id="addToBalance" 
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    checked={installmentForm.addToBalance}
                    onChange={e => setInstallmentForm({...installmentForm, addToBalance: e.target.checked})}
                  />
                  <label htmlFor="addToBalance" className="text-sm text-gray-700 cursor-pointer select-none">
                    Toplam tutarı müşterinin hesabına <span className="font-bold">borç</span> olarak yansıt.
                  </label>
               </div>
               
               <div className="pt-4 flex justify-end gap-3 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsInstallmentModalOpen(false)} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
                  Oluştur ({installmentForm.totalAmount > 0 && installmentForm.count > 0 ? (installmentForm.totalAmount / installmentForm.count).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺ x ' + installmentForm.count : '...'})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* A4 Ekstre Print Modal */}`;
code = code.replace(endOfModalsSearch, installmentModal);

fs.writeFileSync('pages/Cariler.tsx', code);
console.log("Patched add installment plan feature");
