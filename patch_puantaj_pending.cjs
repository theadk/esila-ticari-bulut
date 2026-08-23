const fs = require('fs');
let code = fs.readFileSync('components/PuantajMaasView.tsx', 'utf8');

if (!code.includes('CheckCircle, XCircle')) {
  code = code.replace(
    'ChevronDown, ChevronUp } from "lucide-react";',
    'ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";'
  );
}

const pendingRequestsLogic = `
  const pendingRequests = (salaryAdjustments || []).filter(a => a.status === 'Bekliyor');

  const handleApproveRequest = (adj: SalaryAdjustment) => {
    if (window.confirm('Bu avans talebini onaylamak istediğinize emin misiniz? (Onaylandığında tutar otomatik olarak personelin hesabına avans olarak işlenecektir)')) {
      const updated = salaryAdjustments.map(a => a.id === adj.id ? { ...a, status: 'Onaylandı' } : a);
      setSalaryAdjustments(updated);
      
      // Kasadan çıkış yapılabilir veya maaş bordrosunda hesaplanmak üzere sadece kaydedilir.
      // Biz şimdilik maaş hesabına yansıması için Onaylandı yapıyoruz.
    }
  };

  const handleRejectRequest = (adj: SalaryAdjustment) => {
    if (window.confirm('Bu avans talebini reddetmek istediğinize emin misiniz?')) {
      const updated = salaryAdjustments.map(a => a.id === adj.id ? { ...a, status: 'Reddedildi' } : a);
      setSalaryAdjustments(updated);
    }
  };
`;

if (!code.includes('const pendingRequests = ')) {
  code = code.replace(
    'const [expandedPersonnel, setExpandedPersonnel] = useState<string | null>(null);',
    'const [expandedPersonnel, setExpandedPersonnel] = useState<string | null>(null);\n' + pendingRequestsLogic
  );
}

const pendingRequestsUI = `
      {pendingRequests.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-amber-200 bg-amber-100/50 flex items-center justify-between">
            <h3 className="font-bold text-amber-800 flex items-center gap-2">
              <Clock size={18} /> Onay Bekleyen Avans Talepleri
            </h3>
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {pendingRequests.length} Yeni Talep
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-amber-50/50 text-amber-800 font-medium border-b border-amber-100">
                <tr>
                  <th className="px-6 py-3">Personel</th>
                  <th className="px-6 py-3">Tarih</th>
                  <th className="px-6 py-3">Tutar</th>
                  <th className="px-6 py-3">Açıklama</th>
                  <th className="px-6 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {pendingRequests.map(req => {
                  const p = personnel.find(x => x.id === req.personnelId);
                  return (
                    <tr key={req.id} className="hover:bg-amber-100/50">
                      <td className="px-6 py-3 font-medium text-amber-900">{p ? \`\${p.firstName} \${p.lastName}\` : 'Bilinmeyen'}</td>
                      <td className="px-6 py-3 text-amber-800">{new Date(req.date).toLocaleDateString('tr-TR')}</td>
                      <td className="px-6 py-3 font-bold text-amber-900">{req.amount.toLocaleString('tr-TR')} ₺</td>
                      <td className="px-6 py-3 text-amber-800">{req.description}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleApproveRequest(req)} className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded transition-colors" title="Onayla">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => handleRejectRequest(req)} className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors" title="Reddet">
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
`;

code = code.replace(
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">',
  pendingRequestsUI + '\n      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">'
);

fs.writeFileSync('components/PuantajMaasView.tsx', code);
console.log('patched PuantajMaasView.tsx pending requests');
