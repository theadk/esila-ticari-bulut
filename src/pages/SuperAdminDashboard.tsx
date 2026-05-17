import React, { useState, useEffect } from 'react';
import { Plus, Power, Mail, Building, UserCheck } from 'lucide-react';

interface Tenant {
  vkn: string;
  name: string;
  email: string;
  modules: any;
  status: 'Bekliyor' | 'Aktif' | 'Pasif';
  activationToken: string;
  package: string;
  expirationDate: string;
}

export const SuperAdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vkn: '', name: '', email: '', package: 'Yıllık',
    modules: ['cariler', 'urunler']
  });

  const MODULES = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'cariler', name: 'Cariler' },
    { id: 'urunler', name: 'Ürünler' },
    { id: 'depo', name: 'Depo' },
    { id: 'kasa', name: 'Kasa / Banka' },
    { id: 'personel', name: 'Personel' },
    { id: 'siparisler', name: 'Siparişler' },
    { id: 'teklifler', name: 'Teklifler' },
    { id: 'mutabakat', name: 'Mutabakat' },
    { id: 'raporlar', name: 'Raporlar' }
  ];

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/tenants');
      if (res.ok) {
        setTenants(await res.json());
      }
    } catch(e) {}
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, modules: JSON.stringify(formData.modules) })
      });
      setIsModalOpen(false);
      fetchTenants();
      alert(`Firma eklendi. ${formData.email} adresine mail gönderimi simüle edildi.\nYönetici Şifresi: ${formData.vkn}123`);
    } catch(e) {
      alert("Hata oluştu.");
    }
  };

  const handleActivate = async (vkn: string) => {
    try {
      await fetch(`/api/tenants/${vkn}/activate`, { method: 'PUT' });
      fetchTenants();
      alert('Firma başarıyla aktive edildi.');
    } catch(e) {
      alert("Aktivasyon sırasında hata oluştu.");
    }
  };

  const toggleModule = (modId: string) => {
    if (formData.modules.includes(modId)) {
      setFormData({ ...formData, modules: formData.modules.filter(m => m !== modId) });
    } else {
      setFormData({ ...formData, modules: [...formData.modules, modId] });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <Building size={24} className="text-emerald-400" />
          <h1 className="text-xl font-bold">Esila - VKN Yönetim Paneli</h1>
        </div>
        <button onClick={onLogout} className="text-gray-300 hover:text-white flex items-center gap-2">
          <Power size={18} /> Çıkış 
        </button>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Lisanslı Şirketler (Tenants)</h2>
          <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus size={18} /> Yeni Şirket Ekle
          </button>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="p-4">VKN</th>
                <th className="p-4">Firma Adı & E-Posta</th>
                <th className="p-4">Paket & Modüller</th>
                <th className="p-4">Bitiş Tarihi</th>
                <th className="p-4">Durum</th>
                <th className="p-4">Yönetici Şifresi</th>
                <th className="p-4">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.map(t => (
                <tr key={t.vkn} className="text-sm">
                  <td className="p-4 font-mono font-medium text-gray-900">{t.vkn}</td>
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{t.name}</div>
                    <div className="text-gray-500 text-xs mt-1">{t.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-emerald-700">{t.package || 'Yıllık'}</div>
                    <div className="text-gray-500 text-xs mt-1 line-clamp-2 max-w-[200px]" title={t.modules ? (typeof t.modules === 'string' ? JSON.parse(t.modules) : t.modules)?.map((m: string) => MODULES.find(x => x.id === m)?.name || m).join(', ') : 'Tümü'}>
                      {(t.modules ? (typeof t.modules === 'string' ? JSON.parse(t.modules) : t.modules) : ['all'])?.map((m: string) => MODULES.find(x => x.id === m)?.name || m).join(', ')}
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{t.expirationDate ? new Date(t.expirationDate).toLocaleDateString('tr-TR') : '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${t.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status}</span>
                  </td>
                  <td className="p-4 font-mono text-xs font-bold text-gray-600">
                    {t.vkn}123
                  </td>
                  <td className="p-4">
                    {t.status === 'Bekliyor' ? (
                       <div className="flex flex-col sm:flex-row items-center gap-2">
                         <button className="text-blue-600 flex items-center gap-1 hover:underline text-xs bg-blue-50 px-2 py-1 rounded" onClick={() => alert('Mail yeniden gönderildi.')}>
                           <Mail size={14} /> Mail
                         </button>
                         <button className="text-emerald-600 flex items-center gap-1 hover:underline text-xs bg-emerald-50 px-2 py-1 rounded" onClick={() => handleActivate(t.vkn)}>
                           <UserCheck size={14} /> Aktive Et
                         </button>
                       </div>
                    ) : (
                       <span className="text-gray-400 flex items-center gap-1 text-xs"><UserCheck size={14} /> Aktive Edildi</span>
                    )}
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500">Kayıtlı şirket yok.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-6 border-b bg-gray-50">
               <h3 className="text-xl font-bold text-gray-800">Yeni Firma Tanımla</h3>
             </div>
             <form onSubmit={handleCreate} className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">VKN *</label>
                    <input required type="text" value={formData.vkn} onChange={e=>setFormData({...formData, vkn: e.target.value})} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" placeholder="Örn: 1111111111" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Firma Adı *</label>
                    <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" placeholder="Firma A.Ş." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Yönetici E-Postası *</label>
                    <input required type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" placeholder="admin@firma.com" />
                  </div>
                   <div>
                    <label className="text-sm font-medium text-gray-700">Lisans Paketi *</label>
                    <select value={formData.package} onChange={e=>setFormData({...formData, package: e.target.value})} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white">
                       <option value="Aylık">Aylık Paket (1 Ay)</option>
                       <option value="Yıllık">Yıllık Paket (1 Yıl)</option>
                       <option value="Sınırsız">Sınırsız Paket</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Aktif Edilecek Modüller</label>
                  <div className="grid grid-cols-2 gap-3">
                    {MODULES.map(mod => (
                      <label key={mod.id} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded border cursor-pointer hover:bg-gray-100">
                        <input type="checkbox" checked={formData.modules.includes(mod.id)} onChange={() => toggleModule(mod.id)} className="rounded text-emerald-600 focus:ring-emerald-500" />
                        {mod.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">İptal</button>
                  <button type="submit" className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg flex items-center gap-2 text-sm font-medium">
                    <Plus size={16} /> Tanımla ve Mail Gönder
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

