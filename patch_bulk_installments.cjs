const fs = require('fs');
let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');

// 1. Add selectedInstallmentIds state
const stateSearch = "  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);";
const stateReplace = "  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);\n  const [selectedInstallmentIds, setSelectedInstallmentIds] = useState<string[]>([]);";
code = code.replace(stateSearch, stateReplace);

// 2. Add installmentIds to paymentForm
const paymentFormSearch = "date: string, installmentId?: string";
const paymentFormReplace = "date: string, installmentId?: string, installmentIds?: string[]";
code = code.replace(paymentFormSearch, paymentFormReplace);

// 3. Update handleSavePayment logic
const saveSearch = `          let updatedInstallments = c.installments;
          if (paymentForm.installmentId && updatedInstallments) {
            updatedInstallments = updatedInstallments.map((inst: any) => 
              inst.id === paymentForm.installmentId ? { ...inst, isPaid: true, paidDate: new Date().toISOString() } : inst
            );
          }`;
const saveReplace = `          let updatedInstallments = c.installments;
          if (paymentForm.installmentIds && updatedInstallments) {
            updatedInstallments = updatedInstallments.map((inst: any) => 
              paymentForm.installmentIds.includes(inst.id) ? { ...inst, isPaid: true, paidDate: new Date().toISOString() } : inst
            );
          } else if (paymentForm.installmentId && updatedInstallments) {
            updatedInstallments = updatedInstallments.map((inst: any) => 
              inst.id === paymentForm.installmentId ? { ...inst, isPaid: true, paidDate: new Date().toISOString() } : inst
            );
          }`;
code = code.replace(saveSearch, saveReplace);

// Also reset selectedInstallmentIds after payment
const closePaymentSearch = "setIsPaymentModalOpen(false);";
const closePaymentReplace = "setIsPaymentModalOpen(false);\n    setSelectedInstallmentIds([]);";
code = code.replace(closePaymentSearch, closePaymentReplace);

// 4. Update the Installments UI
const installmentsSearch = `              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6 flex-shrink-0">
                <div className="p-4 border-b bg-indigo-50/50 flex justify-between items-center">
                  <h4 className="font-bold text-indigo-900">Bekleyen Taksitler</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Açıklama</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Durum</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Tutar</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedCustomerForHistory.installments.map(inst => (
                        <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-600">{new Date(inst.dueDate).toLocaleDateString('tr-TR')}</td>
                          <td className="px-6 py-4 text-sm text-gray-800">{inst.description}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={\`px-2 py-1 rounded-full text-xs font-medium \${inst.isPaid ? 'bg-emerald-100 text-emerald-700' : new Date(inst.dueDate) < new Date() ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}\`}>
                              {inst.isPaid ? 'Ödendi' : new Date(inst.dueDate) < new Date() ? 'Gecikti' : 'Bekliyor'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">
                            {inst.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </td>
                          <td className="px-6 py-4 text-center">
                            {!inst.isPaid && (
                              <button
                                onClick={() => {
                                  // Open payment modal with installment details pre-filled
                                  setPaymentForm({
                                    amount: inst.amount,
                                    description: inst.description + ' Tahsilatı',
                                    type: 'Tahsilat',
                                    date: new Date().toISOString().split('T')[0],
                                    installmentId: inst.id
                                  });
                                  // We should ideally mark this exact installment as paid. Since we don't have a specific flow, we just let them do a standard Tahsilat. 
                                  // But let's actually mark it paid too by using a small hack: we attach installmentId to the paymentForm? 
                                  // The simplest is to just do a normal Tahsilat, and the user can manually track it, OR we modify handleSavePayment.
                                  setIsPaymentModalOpen(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 transition-colors text-sm font-medium"
                              >
                                Tahsil Et
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>`;

const installmentsReplace = `              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6 flex-shrink-0">
                <div className="p-4 border-b bg-indigo-50/50 flex justify-between items-center">
                  <h4 className="font-bold text-indigo-900">Bekleyen Taksitler</h4>
                  {selectedInstallmentIds.length > 0 && (
                    <button 
                      onClick={() => {
                        const selectedAmount = selectedCustomerForHistory.installments
                          ?.filter(i => selectedInstallmentIds.includes(i.id))
                          .reduce((sum, i) => sum + i.amount, 0) || 0;
                        setPaymentForm({
                          amount: selectedAmount,
                          description: \`\${selectedInstallmentIds.length} Adet Taksit Tahsilatı\`,
                          type: 'Tahsilat',
                          date: new Date().toISOString().split('T')[0],
                          installmentIds: selectedInstallmentIds
                        });
                        setIsPaymentModalOpen(true);
                      }}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <span>Toplu Tahsil Et ({selectedInstallmentIds.length})</span>
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 w-10 text-center">
                          <input 
                            type="checkbox"
                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 cursor-pointer"
                            onChange={(e) => {
                              const unpaidIds = selectedCustomerForHistory.installments?.filter(i => !i.isPaid).map(i => i.id) || [];
                              if (e.target.checked) {
                                setSelectedInstallmentIds(unpaidIds);
                              } else {
                                setSelectedInstallmentIds([]);
                              }
                            }}
                            checked={
                              (selectedCustomerForHistory.installments?.filter(i => !i.isPaid).length || 0) > 0 && 
                              selectedInstallmentIds.length === (selectedCustomerForHistory.installments?.filter(i => !i.isPaid).length || 0)
                            }
                          />
                        </th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Açıklama</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Durum</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Tutar</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedCustomerForHistory.installments.map(inst => (
                        <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-center">
                            {!inst.isPaid && (
                              <input 
                                type="checkbox"
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 cursor-pointer"
                                checked={selectedInstallmentIds.includes(inst.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedInstallmentIds(prev => [...prev, inst.id]);
                                  } else {
                                    setSelectedInstallmentIds(prev => prev.filter(id => id !== inst.id));
                                  }
                                }}
                              />
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{new Date(inst.dueDate).toLocaleDateString('tr-TR')}</td>
                          <td className="px-6 py-4 text-sm text-gray-800">{inst.description}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={\`px-2 py-1 rounded-full text-xs font-medium \${inst.isPaid ? 'bg-emerald-100 text-emerald-700' : new Date(inst.dueDate) < new Date() ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}\`}>
                              {inst.isPaid ? 'Ödendi' : new Date(inst.dueDate) < new Date() ? 'Gecikti' : 'Bekliyor'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">
                            {inst.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </td>
                          <td className="px-6 py-4 text-center">
                            {!inst.isPaid && (
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
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>`;

code = code.replace(installmentsSearch, installmentsReplace);

fs.writeFileSync('pages/Cariler.tsx', code);
console.log("Patched bulk installments");
