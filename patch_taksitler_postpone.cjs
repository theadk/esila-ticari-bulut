const fs = require('fs');
let code = fs.readFileSync('components/Taksitler.tsx', 'utf8');

// 1. Add X to lucide-react imports if it's missing
if (!code.includes('import { Calendar, Search, Filter, CheckCircle2, Circle, AlertCircle, X }')) {
    code = code.replace(/import \{ Calendar, Search, Filter, CheckCircle2, Circle, AlertCircle \} from 'lucide-react';/, "import { Calendar, Search, Filter, CheckCircle2, Circle, AlertCircle, X } from 'lucide-react';");
}

// 2. Add state for postpone form
const statesRegex = /const \[statusFilter, setStatusFilter\] = useState[\s\S]*?;/;
code = code.replace(statesRegex, (match) => {
    return match + `\n  const [isPostponeModalOpen, setIsPostponeModalOpen] = useState(false);\n  const [postponeForm, setPostponeForm] = useState<{ customerId: string, installmentId: string, oldDate: string, newDate: string, notifyCustomer: boolean, description: string }>({ customerId: '', installmentId: '', oldDate: '', newDate: '', notifyCustomer: true, description: '' });`;
});

// 3. Add handlePostponeInstallment inside Taksitler
const funcInject = `
  const handlePostponeInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    
    const c = customers.find(x => x.id === postponeForm.customerId);
    if (!c) return;

    let updatedInstallments = (c.installments || []).map(inst => {
        if (inst.id === postponeForm.installmentId) {
            return { ...inst, dueDate: postponeForm.newDate };
        }
        return inst;
    });
    
    updatedInstallments.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    const updatedCustomers = customers.map(cust => {
        if (cust.id === postponeForm.customerId) {
            return { ...cust, installments: updatedInstallments };
        }
        return cust;
    });
    
    setCustomers(updatedCustomers);
    setIsPostponeModalOpen(false);

    if (postponeForm.notifyCustomer && c.email) {
      let html = \`
        <h2 style="color: #ea580c; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 24px;">Taksit Erteleme Bilgilendirmesi</h2>
        <p style="margin-bottom: 24px;">Sayın <b>\${c.name || c.companyName}</b>,<br>Aşağıdaki taksitinizin vade tarihi talebiniz/onayınız doğrultusunda ötelenmiştir.</p>
        <div style="background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background-color: #ffedd5; color: #9a3412; text-align: left; font-size: 14px;">
                    <th style="padding: 12px 16px; border-bottom: 1px solid #fed7aa; font-weight: 600;">Açıklama</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #fed7aa; font-weight: 600;">Eski Vade</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #fed7aa; font-weight: 600;">Yeni Vade</th>
                </tr>
            </thead>
            <tbody style="background-color: #ffffff;">
                <tr style="font-size: 14px;">
                    <td style="padding: 12px 16px; color: #111827; font-weight: 500;">\${postponeForm.description || '-'}</td>
                    <td style="padding: 12px 16px; color: #6b7280; text-decoration: line-through;">\${new Date(postponeForm.oldDate).toLocaleDateString('tr-TR')}</td>
                    <td style="padding: 12px 16px; color: #ea580c; font-weight: 700;">\${new Date(postponeForm.newDate).toLocaleDateString('tr-TR')}</td>
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
          to: c.email,
          subject: 'Taksit Erteleme Bilgilendirmesi',
          html: html
        })
      }).catch(console.error);
    }
  };
`;
const totalUnpaidRegex = /const totalUnpaid = /;
code = code.replace(totalUnpaidRegex, funcInject + '\n  const totalUnpaid = ');

// 4. Update action buttons in table row
const actionButtonsOld = `
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleInstallmentStatus(inst.customerId, inst.id)}
                          className={\`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors \${
                            inst.isPaid 
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }\`}
                        >
                          {inst.isPaid ? 'Geri Al' : 'Tahsil Et'}
                        </button>
                      </td>
`;
const actionButtonsNew = `
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                            <button
                            onClick={() => toggleInstallmentStatus(inst.customerId, inst.id)}
                            className={\`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors \${
                                inst.isPaid 
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }\`}
                            >
                            {inst.isPaid ? 'Geri Al' : 'Tahsil Et'}
                            </button>
                            {!inst.isPaid && (
                                <button
                                    onClick={() => {
                                        setPostponeForm({
                                            customerId: inst.customerId,
                                            installmentId: inst.id,
                                            oldDate: inst.dueDate,
                                            newDate: inst.dueDate,
                                            notifyCustomer: true,
                                            description: inst.description
                                        });
                                        setIsPostponeModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-orange-50 text-orange-600 hover:bg-orange-100"
                                >
                                    Ertele
                                </button>
                            )}
                        </div>
                      </td>
`;
code = code.replace(actionButtonsOld, actionButtonsNew);

// 5. Append Modal JSX
const modalHtml = `
      {/* Taksit Ertele Modal */}
      {isPostponeModalOpen && (
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
    </div>
`;
code = code.replace(/<\/div>\n  \);\n\}\n$/, modalHtml + '\n  );\n}\n');

fs.writeFileSync('components/Taksitler.tsx', code);
console.log("Patched Taksitler.tsx");
