const fs = require('fs');
let code = fs.readFileSync('pages/Ayarlar.tsx', 'utf8');

if (!code.includes('MessageCircle')) {
    code = code.replace("import { Save, Mail, MessageSquare, Printer, Settings as SettingsIcon, Upload, X, Hash, Users, Clock, FileText, Database, Download, BookOpen, Activity } from 'lucide-react';", "import { Save, Mail, MessageSquare, MessageCircle, Printer, Settings as SettingsIcon, Upload, X, Hash, Users, Clock, FileText, Database, Download, BookOpen, Activity } from 'lucide-react';");
}

const stateRegex = /const \[activeTab, setActiveTab\] = useState\('genel'\);/;
code = code.replace(stateRegex, (match) => {
    return match + `\n  const [selectedReminderIds, setSelectedReminderIds] = useState<string[]>([]);\n  const [isReminderSMSOpen, setIsReminderSMSOpen] = useState(false);\n  const [reminderSMSText, setReminderSMSText] = useState('');\n  const [isReminderWhatsAppOpen, setIsReminderWhatsAppOpen] = useState(false);`;
});

const reminderLogic = `
  const reminderCustomers = React.useMemo(() => {
    if (!store.customers) return [];
    const today = new Date();
    today.setHours(0,0,0,0);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    return store.customers.filter((c: any) => {
      if (!c.installments || c.installments.length === 0) return false;
      return c.installments.some((inst: any) => {
        if (inst.isPaid) return false;
        const dueDate = new Date(inst.dueDate);
        dueDate.setHours(0,0,0,0);
        return dueDate <= in7Days; // Overdue or upcoming in 7 days
      });
    }).map((c: any) => {
      const relevantInsts = c.installments.filter((inst: any) => {
        if (inst.isPaid) return false;
        const dueDate = new Date(inst.dueDate);
        dueDate.setHours(0,0,0,0);
        return dueDate <= in7Days;
      });
      const totalAmount = relevantInsts.reduce((sum: number, inst: any) => sum + inst.amount, 0);
      const isOverdue = relevantInsts.some((inst: any) => new Date(inst.dueDate).getTime() < today.getTime());
      
      return {
        ...c,
        totalRelevantAmount: totalAmount,
        isOverdue,
        relevantInsts
      };
    }).sort((a: any, b: any) => b.totalRelevantAmount - a.totalRelevantAmount);
  }, [store.customers]);
`;

code = code.replace("const fetchServerBackups = () => {", reminderLogic + '\n  const fetchServerBackups = () => {');

const tabsRegex = /\{ id: 'kilavuz', label: 'Kullanım Kılavuzu', icon: BookOpen \},/
code = code.replace(tabsRegex, "{ id: 'kilavuz', label: 'Kullanım Kılavuzu', icon: BookOpen },\n    { id: 'hatirlatmalar', label: 'Taksit Hatırlatmaları', icon: Clock },");

// Adding UI tab
const hatirlatmalarTabUI = `
          {activeTab === 'hatirlatmalar' && (
            <div className="space-y-6 animate-fade-in flex flex-col h-full">
              <div className="flex justify-between items-center border-b pb-4">
                 <div>
                    <h3 className="text-xl font-semibold text-gray-800">Toplu Taksit Hatırlatmaları</h3>
                    <p className="text-sm text-gray-500 mt-1">Vadesi yaklaşan (7 gün) veya gecikmiş taksitleri olan carilere toplu WhatsApp/SMS gönderin.</p>
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => setIsReminderWhatsAppOpen(true)}
                      disabled={selectedReminderIds.length === 0}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MessageCircle size={18} />
                      <span className="hidden sm:inline">WhatsApp ({selectedReminderIds.length})</span>
                    </button>
                    <button 
                      onClick={() => setIsReminderSMSOpen(true)}
                      disabled={selectedReminderIds.length === 0}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MessageSquare size={18} />
                      <span className="hidden sm:inline">SMS ({selectedReminderIds.length})</span>
                    </button>
                 </div>
              </div>
              
              <div className="flex-1 overflow-auto border rounded-xl bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm border-b">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 w-10 text-center">
                        <input 
                          type="checkbox"
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          checked={selectedReminderIds.length === reminderCustomers.length && reminderCustomers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedReminderIds(reminderCustomers.map(c => c.id));
                            else setSelectedReminderIds([]);
                          }}
                        />
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Müşteri</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Telefon</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Bekleyen Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reminderCustomers.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-center">
                          <input 
                            type="checkbox"
                            checked={selectedReminderIds.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedReminderIds(prev => [...prev, c.id]);
                              else setSelectedReminderIds(prev => prev.filter(id => id !== c.id));
                            }}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{c.name || c.companyName}</td>
                        <td className="px-4 py-3">
                          <span className={\`px-2.5 py-1 rounded-full text-xs font-medium \${c.isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}\`}>
                            {c.isOverdue ? 'Gecikmiş' : 'Yaklaşan'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{c.phone || '-'}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {c.totalRelevantAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                      </tr>
                    ))}
                    {reminderCustomers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          Vadesi yaklaşan veya geciken taksit bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
`;

code = code.replace("{activeTab === 'kilavuz' && (", hatirlatmalarTabUI + "\n          {activeTab === 'kilavuz' && (");

// Add Modals at the end of the component
const modalsHtml = `
      {/* WhatsApp Modal */}
      {isReminderWhatsAppOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center rounded-t-xl">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <MessageCircle className="text-green-600" />
                Toplu WhatsApp Hatırlatması
              </h3>
              <button onClick={() => setIsReminderWhatsAppOpen(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-sm text-gray-600">
                Seçilen <strong>{selectedReminderIds.length}</strong> cariye sırayla WhatsApp mesajı gönderebilirsiniz. 
                Mesaj içeriği otomatik olarak (Geciken/Yaklaşan taksit tutarına göre) oluşturulacaktır.
              </p>
              
              <div className="space-y-3">
                {selectedReminderIds.map((id, index) => {
                  const customer = reminderCustomers.find(c => c.id === id);
                  if (!customer || !customer.phone) return null;
                  
                  const phone = customer.phone.replace(/\\D/g, '');
                  const formattedPhone = phone.startsWith('90') ? phone : (phone.startsWith('0') ? '9' + phone : '90' + phone);
                  
                  const msgText = \`Sayın \${customer.name || customer.companyName}, sistemimizde \${customer.isOverdue ? 'vadesi geçmiş' : 'vadesi yaklaşan'} \${customer.totalRelevantAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL tutarında taksit ödemeniz bulunmaktadır. Bilginize sunarız.\`;
                  
                  const waUrl = \`https://wa.me/\${formattedPhone}?text=\${encodeURIComponent(msgText)}\`;
                  
                  return (
                    <div key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{customer.name || customer.companyName}</p>
                        <p className="text-xs text-gray-500">{customer.phone}</p>
                      </div>
                      <a 
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-sm font-medium transition-colors"
                      >
                        Gönder ({index + 1})
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsReminderWhatsAppOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Modal */}
      {isReminderSMSOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center rounded-t-xl">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <MessageSquare className="text-blue-600" />
                Toplu SMS Hatırlatması
              </h3>
              <button onClick={() => setIsReminderSMSOpen(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Seçilen <strong>{selectedReminderIds.length}</strong> cariye aynı anda toplu SMS gönderilecektir. (Sadece telefon numarası olan carilere gönderilir).
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj İçeriği Şablonu</label>
                <textarea 
                  value={reminderSMSText || "Sayın müşterimiz, sistemimizde vadesi yaklaşan veya geçmiş taksit ödemeniz bulunmaktadır. Detaylı bilgi için lütfen iletişime geçiniz."}
                  onChange={(e) => setReminderSMSText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 h-32 text-sm"
                  placeholder="Gönderilecek mesajınızı yazın..."
                />
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsReminderSMSOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
              >
                İptal
              </button>
              <button 
                onClick={async () => {
                  const phones = selectedReminderIds
                    .map(id => reminderCustomers.find(c => c.id === id)?.phone)
                    .filter(Boolean) as string[];
                  if (phones.length === 0) {
                     toast.error("Seçili carilerin geçerli telefon numarası bulunmuyor.");
                     return;
                  }
                  const textToSend = reminderSMSText || "Sayın müşterimiz, sistemimizde vadesi yaklaşan veya geçmiş taksit ödemeniz bulunmaktadır. Detaylı bilgi için lütfen iletişime geçiniz.";
                  
                  try {
                    const tenantId = localStorage.getItem('esila_tenant_id') || '1111111111';
                    const res = await fetch('/api/send-sms', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
                      body: JSON.stringify({
                        phones: phones.map(p => {
                           const phone = p.replace(/\\D/g, '');
                           return phone.startsWith('90') ? phone : (phone.startsWith('0') ? '9' + phone : '90' + phone);
                        }),
                        message: textToSend
                      })
                    });
                    const data = await res.json();
                    if (!data.success) throw new Error(data.error || "Bilinmeyen hata");
                    
                    toast.success(phones.length + " adet SMS başarıyla gönderildi.");
                    setReminderSMSText('');
                    setIsReminderSMSOpen(false);
                    setSelectedReminderIds([]);
                  } catch (err: any) {
                    toast.error(err.message || "SMS gönderilirken bir hata oluştu.", { id: 'bulkSms' });
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex-1 text-center"
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/<\/div>\n  \);\n\};\n?$/, modalsHtml + "\n    </div>\n  );\n};\n");

fs.writeFileSync('pages/Ayarlar.tsx', code);
console.log("Patched Ayarlar.tsx for hatirlatmalar tab");
