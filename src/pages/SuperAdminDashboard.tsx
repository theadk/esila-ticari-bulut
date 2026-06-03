import React, { useState, useEffect } from 'react';
import { Plus, Power, Mail, Building, UserCheck, XCircle } from 'lucide-react';

interface Tenant {
  vkn: string;
  name: string;
  email: string;
  modules: any;
  status: 'Bekliyor' | 'Aktif' | 'Pasif';
  activationToken: string;
  package: string;
  expirationDate: string;
  password?: string;
  sector?: string;
}

export const SuperAdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tenants' | 'logs'>('tenants');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    vkn: '', name: '', email: '', package: 'Yıllık', sector: '',
    modules: ['dashboard', 'cariler', 'urunler', 'hizlisatis', 'kasa'],
    expirationDate: ''
  });

  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');

  const filteredTenants = tenants.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (sectorFilter && t.sector !== sectorFilter) return false;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      if (!t.name.toLowerCase().includes(lower) && !t.vkn.includes(lower) && !t.email.toLowerCase().includes(lower)) return false;
    }
    return true;
  });

  const sectoralData = tenants.reduce((acc: any, t) => {
     const sec = t.sector || 'Belirtilmemiş';
     acc[sec] = (acc[sec] || 0) + 1;
     return acc;
  }, {});

  const MODULES = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'hizlisatis', name: 'Hızlı Satış' },
    { id: 'cariler', name: 'Cariler' },
    { id: 'urunler', name: 'Ürünler' },
    { id: 'depo', name: 'Depo' },
    { id: 'kasa', name: 'Kasa / Banka' },
    { id: 'personel', name: 'Personel' },
    { id: 'siparisler', name: 'Siparişler' },
    { id: 'efatura', name: 'E-Fatura' },
    { id: 'teklif', name: 'Teklifler' },
    { id: 'mutabakat', name: 'Mutabakat' },
    { id: 'raporlar', name: 'Raporlar' },
    { id: 'ariza', name: 'Arıza Formları' }
  ];

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/tenants');
      if (res.ok) {
        setTenants(await res.json());
      }
    } catch(e) {}
  };

  const fetchEmailLogs = async () => {
    try {
      const res = await fetch('/api/admin/email-logs');
      if (res.ok) setEmailLogs(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    fetchTenants();
    fetchEmailLogs();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await fetch(`/api/tenants/${formData.vkn}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, modules: formData.modules })
        });
        setIsModalOpen(false);
        fetchTenants();
        alert('Firma güncellendi.');
      } else {
        const res = await fetch('/api/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, modules: formData.modules })
        });
        const data = await res.json();
        setIsModalOpen(false);
        fetchTenants();
        alert(`Firma eklendi. Yönetici Şifresi: ${data.password || 'Oluşturuldu'}\nFirma aktif edildiğinde e-posta ile bilgilendirilecektir.`);
      }
    } catch(e) {
      alert("Hata oluştu.");
    }
  };

  const handleEdit = (tenant: Tenant) => {
    let mods = tenant.modules;
    if (typeof mods === 'string') {
      try { mods = JSON.parse(mods); } catch(e) { mods = []; }
    }
    if (!mods) mods = [];
    setFormData({
      vkn: tenant.vkn,
      name: tenant.name,
      email: tenant.email,
      sector: tenant.sector,
      package: tenant.package,
      modules: mods,
      expirationDate: tenant.expirationDate ? tenant.expirationDate.split('T')[0] : ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (vkn: string) => {
    if (confirm("Bu firmayı tamamen silmek istediğinize emin misiniz? Tüm çalışan, ürün ve diğer verileri silinecektir!")) {
      try {
        await fetch(`/api/tenants/${vkn}`, { method: 'DELETE' });
        fetchTenants();
        alert('Firma silindi.');
      } catch(e) {
        alert("Hata oluştu.");
      }
    }
  };

  const handleReject = async (vkn: string) => {
    if (confirm("Bu başvuruyu reddetmek ve silmek istediğinize emin misiniz? Başvuru sahibine ret maili gidecektir.")) {
      try {
        await fetch(`/api/tenants/${vkn}/reject`, { method: 'PUT' });
        fetchTenants();
        alert('Başvuru reddedildi ve mail iletildi.');
      } catch(e) {
        alert("Ret işlemi sırasında hata oluştu.");
      }
    }
  };

  
  const handleResetPassword = async (vkn: string) => {
    if (confirm("Bu firmanın yönetici şifresi sıfırlanacak ve e-posta ile gönderilecektir. Onaylıyor musunuz?")) {
      try {
        const res = await fetch(`/api/tenants/${vkn}/reset-password`, { method: 'POST' });
        if (res.ok) {
           const data = await res.json();
           alert(`Şifre sıfırlandı: ${data.password}\nYeni şifre firmaya e-posta ile iletildi.`);
           fetchTenants();
        } else {
           alert("Hata oluştu.");
        }
      } catch(e) {
        alert("Hata oluştu.");
      }
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

  const handleToggleStatus = async (vkn: string) => {
    try {
      await fetch(`/api/tenants/${vkn}/toggle-status`, { method: 'PUT' });
      fetchTenants();
      alert('Firma durumu güncellendi.');
    } catch(e) {
      alert("Durum güncellenirken hata oluştu.");
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
        
        <div className="flex space-x-1 mb-6 bg-white p-1 rounded-lg shadow-sm border border-gray-200 inline-flex">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'tenants' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Şirketler
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'logs' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Mail Gönderim Logları
          </button>
        </div>

        {activeTab === 'tenants' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow border border-gray-200 col-span-1 md:col-span-4 grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
            <div className="col-span-2 md:col-span-2">
              <label className="text-xs text-gray-500 font-medium ml-1">Firma / VKN Ara</label>
              <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Ara..." className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="text-xs text-gray-500 font-medium ml-1">Sektöre Göre Filtrele</label>
              <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Tümü</option>
                {Object.keys(sectoralData).map(sec => (
                  <option key={sec} value={sec}>{sec} ({sectoralData[sec]})</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="text-xs text-gray-500 font-medium ml-1">Duruma Göre Filtrele</label>
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Tümü</option>
                <option value="Aktif">Aktif</option>
                <option value="Pasif">Pasif</option>
                <option value="Bekliyor">Bekliyor</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          {Object.entries(sectoralData).sort((a:any, b:any) => b[1] - a[1]).slice(0, 5).map(([sec, count]) => (
            <div key={sec} className="bg-white p-4 rounded-xl shadow border border-gray-200">
               <div className="text-xs text-gray-500 font-medium mb-1 truncate">{sec}</div>
               <div className="text-2xl font-bold text-gray-800">{count as number} <span className="text-sm font-normal text-gray-500">firma</span></div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Lisanslı Şirketler (Tenants)</h2>
          <button onClick={() => {
            setIsEditing(false);
            setFormData({
              vkn: '', name: '', email: '', package: 'Yıllık', sector: '',
              modules: ['dashboard', 'cariler', 'urunler', 'hizlisatis', 'kasa'],
              expirationDate: ''
            });
            setIsModalOpen(true);
          }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
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
              {filteredTenants.map(t => (
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
                    {t.password || '*****'}

                     <div className="mt-2">
                        <button onClick={() => handleResetPassword(t.vkn)} className="text-gray-500 hover:text-gray-800 hover:underline text-xs flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                          Yeni Şifre Gönder
                        </button>
                     </div>
                  </td>
                  <td className="p-4">
                    {t.status === 'Bekliyor' ? (
                       <div className="flex flex-col xl:flex-row items-center gap-2 mb-2">
                         <button className="text-emerald-600 flex items-center gap-1 hover:underline text-xs bg-emerald-50 px-2 py-1 rounded" onClick={() => handleActivate(t.vkn)}>
                           <UserCheck size={14} /> Onayla
                         </button>
                         <button className="text-red-600 flex items-center gap-1 hover:underline text-xs bg-red-50 px-2 py-1 rounded" onClick={() => handleReject(t.vkn)}>
                           <XCircle size={14} /> Reddet
                         </button>
                       </div>
                    ) : (
                       <div className="mb-2">
                         <button onClick={() => handleToggleStatus(t.vkn)} className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${t.status === 'Aktif' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                           <Power size={14} /> {t.status === 'Aktif' ? 'Pasife Al' : 'Aktif Et'}
                         </button>
                       </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(t)} className="text-blue-600 hover:underline text-xs">Düzenle</button>
                      <button onClick={() => handleDelete(t.vkn)} className="text-red-600 hover:underline text-xs">Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTenants.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500">Kayıtlı şirket yok.</td></tr>}
            </tbody>
          </table>
        </div>
        </>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
            <h2 className="text-xl font-bold text-gray-800 p-4 border-b">Mail Gönderim Logları</h2>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-4 font-semibold text-gray-600 text-sm">Tarih</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">VKN</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Alıcı</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Konu</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Durum</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Hata Mesajı</th>
                </tr>
              </thead>
              <tbody>
                {emailLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50/50">
                    <td className="p-4 text-sm text-gray-800">{new Date(log.date).toLocaleString('tr-TR')}</td>
                    <td className="p-4 text-sm text-gray-600">{log.vkn}</td>
                    <td className="p-4 text-sm text-gray-800 font-medium">{log.recipient}</td>
                    <td className="p-4 text-sm text-gray-700">{log.subject}</td>
                    <td className="p-4 text-sm text-gray-700">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.status === 'Başarılı' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                         {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500 max-w-xs truncate" title={log.errorMessage || ''}>{log.errorMessage || '-'}</td>
                  </tr>
                ))}
                {emailLogs.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-500">Log kaydı bulunamadı.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-6 border-b bg-gray-50">
               <h3 className="text-xl font-bold text-gray-800">{isEditing ? 'Firmayı Düzenle' : 'Yeni Firma Tanımla'}</h3>
             </div>
             <form onSubmit={handleCreate} className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">VKN *</label>
                    <input required type="text" value={formData.vkn} disabled={isEditing} onChange={e=>setFormData({...formData, vkn: e.target.value})} className={`w-full mt-1 border rounded-lg px-3 py-2 text-sm ${isEditing ? 'bg-gray-100' : ''}`} placeholder="Örn: 1111111111" />
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
                    <label className="text-sm font-medium text-gray-700">Sektör</label>
                    <select value={formData.sector || ''} onChange={e=>setFormData({...formData, sector: e.target.value})} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white">
                      <option value="">Seçiniz</option>
                      <option value="Bilişim & Teknoloji">Bilişim & Teknoloji</option>
                      <option value="Perakende & Mağazacılık">Perakende & Mağazacılık</option>
                      <option value="Toptan Ticaret">Toptan Ticaret</option>
                      <option value="Üretim & İmalat">Üretim & İmalat</option>
                      <option value="Gıda & Tarım">Gıda & Tarım</option>
                      <option value="İnşaat & Yapı">İnşaat & Yapı</option>
                      <option value="Eğitim & Danışmanlık">Eğitim & Danışmanlık</option>
                      <option value="Sağlık & Medikal">Sağlık & Medikal</option>
                      <option value="Otomotiv & Lojistik">Otomotiv & Lojistik</option>
                      <option value="Hizmet & Diğer">Hizmet & Diğer</option>
                    </select>
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

                {isEditing && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 block">Lisans Bitiş Tarihi</label>
                    <p className="text-xs text-gray-500 mb-1">Eğer özel bir bitiş tarihi girmek istiyorsanız seçiniz (Boş bırakılırsa yukarıdaki pakete göre baştan hesaplanır).</p>
                    <input type="date" value={formData.expirationDate} onChange={e=>setFormData({...formData, expirationDate: e.target.value})} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
                  </div>
                )}
                
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
                    {isEditing ? 'Güncelle' : <><Plus size={16} /> Tanımla ve Mail Gönder</>}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

