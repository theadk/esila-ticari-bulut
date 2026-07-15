import { safeSessionStorage } from '../lib/storage';
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { CreditCard, Plus, FileText, Wallet, Search, Filter, Trash2, Edit2, CheckCircle, ArrowRightCircle, CheckSquare, XCircle } from 'lucide-react';
import { ChequeNote, ChequeNoteStatus, Customer } from '../types';
import toast from 'react-hot-toast';

import { hasPermission } from '../lib/permissions';

export const CekSenet: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === safeSessionStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'ceksenet', 'view');
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alinan' | 'verilen'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState<ChequeNote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [formData, setFormData] = useState<Partial<ChequeNote>>({
    type: 'Çek',
    isGiven: false,
    documentNumber: '',
    customerId: '',
    amount: 0,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Portföyde',
    bankName: '',
    branchName: '',
    accountNumber: '',
    drawer: '',
    endorser: ''
  });

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/cheque_notes', {
        headers: { 'x-tenant-id': safeSessionStorage.getItem('esila_tenant_id') || '1111111111' }
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
        store.setChequeNotes?.(data);
      }
    } catch (e) { console.error(e); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers', {
        headers: { 'x-tenant-id': safeSessionStorage.getItem('esila_tenant_id') || '1111111111' }
      });
      if (res.ok) {
        setCustomers(await res.json());
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchNotes();
    fetchCustomers();
  }, []);

  const handleStatusChange = async (id: string, newStatus: ChequeNoteStatus) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    try {
      const res = await fetch(`/api/cheque_notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': safeSessionStorage.getItem('esila_tenant_id') || '1111111111' },
        body: JSON.stringify({ ...note, status: newStatus })
      });
      if (res.ok) {
        toast.success(`Durum '${newStatus}' olarak güncellendi`);
        fetchNotes();
      }
    } catch (e) {
      toast.error('Hata oluştu');
    }
  };

  const saveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.documentNumber || !formData.amount || !formData.customerId) {
       return toast.error('Lütfen zorunlu alanları doldurun.');
    }
    
    try {
      const customer = customers.find(c => c.id === formData.customerId);
      const dataToSave = {
        ...formData,
        customerName: customer?.name || customer?.companyName || 'Bilinmiyor',
        id: formData.id || `CS-${Date.now()}`
      };
      
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id ? `/api/cheque_notes/${formData.id}` : '/api/cheque_notes';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': safeSessionStorage.getItem('esila_tenant_id') || '1111111111' },
        body: JSON.stringify(dataToSave)
      });
      
      if (res.ok) {
        toast.success('Kaydedildi');
        setIsModalOpen(false);
        fetchNotes();
      }
    } catch (e) {
      toast.error('Hata oluştu');
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/cheque_notes/${id}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': safeSessionStorage.getItem('esila_tenant_id') || '1111111111' }
      });
      if (res.ok) {
        toast.success('Kayıt silindi');
        fetchNotes();
      }
    } catch (e) {
      toast.error('Hata oluştu');
    }
  };

  const dashboardStats = {
    toplamAlinan: notes.filter(n => !n.isGiven).reduce((acc, n) => acc + Number(n.amount), 0),
    toplamVerilen: notes.filter(n => n.isGiven).reduce((acc, n) => acc + Number(n.amount), 0),
    tahsildeAlinan: notes.filter(n => !n.isGiven && n.status === 'Tahsilde').reduce((acc, n) => acc + Number(n.amount), 0),
    portfoydeAlinan: notes.filter(n => !n.isGiven && n.status === 'Portföyde').reduce((acc, n) => acc + Number(n.amount), 0),
    yaklasanTahsiller: notes.filter(n => !n.isGiven && n.status !== 'Tahsil Edildi' && n.status !== 'İade Edildi' && new Date(n.dueDate) <= new Date(Date.now() + 7*24*60*60*1000)),
    yaklasanOdemeler: notes.filter(n => n.isGiven && n.status !== 'Ödendi' && n.status !== 'İade Edildi' && new Date(n.dueDate) <= new Date(Date.now() + 7*24*60*60*1000)),
  };

  if (!canView) return <div className="p-8 text-center text-red-600">Bu sayfayı görüntüleme yetkiniz yok.</div>;

  return (
    <div className="animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="text-emerald-600" />
            Çek & Senet Takibi
          </h2>
          <p className="text-sm text-gray-500 mt-1">Alınan ve verilen çek/senetlerinizi yönetin.</p>
        </div>
        
        <div className="flex gap-2">
          <div className="bg-white p-1 rounded-lg border flex text-sm">
            <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-1.5 rounded-md ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>Özet</button>
            <button onClick={() => setActiveTab('alinan')} className={`px-4 py-1.5 rounded-md ${activeTab === 'alinan' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>Alınanlar</button>
            <button onClick={() => setActiveTab('verilen')} className={`px-4 py-1.5 rounded-md ${activeTab === 'verilen' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>Verilenler</button>
          </div>
          {(activeTab === 'alinan' || activeTab === 'verilen') && (
            <button 
              onClick={() => {
                setFormData({
                  type: 'Çek',
                  isGiven: activeTab === 'verilen',
                  documentNumber: '',
                  customerId: '',
                  amount: 0,
                  issueDate: new Date().toISOString().split('T')[0],
                  dueDate: new Date().toISOString().split('T')[0],
                  status: 'Portföyde',
                  bankName: '',
                  branchName: '',
                  accountNumber: '',
                  drawer: '',
                  endorser: ''
                });
                setIsModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={18} /> Yeni {activeTab === 'alinan' ? 'Alınan' : 'Verilen'}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
               <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Toplam Alınan</p>
                    <h3 className="text-2xl font-bold text-gray-800">{dashboardStats.toplamAlinan.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Wallet size={20} /></div>
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
               <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Portföyde (Alınan)</p>
                    <h3 className="text-2xl font-bold text-gray-800">{dashboardStats.portfoydeAlinan.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><FileText size={20} /></div>
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
               <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Tahsildeki Çekler</p>
                    <h3 className="text-2xl font-bold text-gray-800">{dashboardStats.tahsildeAlinan.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle size={20} /></div>
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
               <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Toplam Verilen</p>
                    <h3 className="text-2xl font-bold text-gray-800">{dashboardStats.toplamVerilen.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><ArrowRightCircle size={20} /></div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white border rounded-xl shadow-sm p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard size={18} className="text-amber-500"/> Yaklaşan Tahsilatlar (7 Gün)</h3>
                <div className="space-y-3">
                   {dashboardStats.yaklasanTahsiller.length === 0 ? (
                      <p className="text-gray-500 text-sm">Yaklaşan tahsilat bulunmuyor.</p>
                   ) : (
                      dashboardStats.yaklasanTahsiller.map(n => (
                         <div key={n.id} className="flex justify-between items-center p-3 border rounded-lg bg-amber-50/30">
                            <div>
                               <p className="font-semibold text-gray-800">{n.customerName}</p>
                               <p className="text-xs text-gray-500">{n.type} No: {n.documentNumber} | Vade: {new Date(n.dueDate).toLocaleDateString('tr-TR')}</p>
                            </div>
                            <div className="text-right">
                               <p className="font-bold text-gray-800">{Number(n.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                               <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{n.status}</span>
                            </div>
                         </div>
                      ))
                   )}
                </div>
             </div>
             
             <div className="bg-white border rounded-xl shadow-sm p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><ArrowRightCircle size={18} className="text-red-500"/> Yaklaşan Ödemeler (7 Gün)</h3>
                <div className="space-y-3">
                   {dashboardStats.yaklasanOdemeler.length === 0 ? (
                      <p className="text-gray-500 text-sm">Yaklaşan ödeme bulunmuyor.</p>
                   ) : (
                      dashboardStats.yaklasanOdemeler.map(n => (
                         <div key={n.id} className="flex justify-between items-center p-3 border rounded-lg bg-red-50/30">
                            <div>
                               <p className="font-semibold text-gray-800">{n.customerName}</p>
                               <p className="text-xs text-gray-500">{n.type} No: {n.documentNumber} | Vade: {new Date(n.dueDate).toLocaleDateString('tr-TR')}</p>
                            </div>
                            <div className="text-right">
                               <p className="font-bold text-gray-800">{Number(n.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                               <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">{n.status}</span>
                            </div>
                         </div>
                      ))
                   )}
                </div>
             </div>
          </div>
        </div>
      )}

      {(activeTab === 'alinan' || activeTab === 'verilen') && (
         <div className="bg-white border rounded-xl shadow-sm overflow-hidden animate-in fade-in">
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-600">
               <thead className="bg-gray-50 border-b text-gray-700 font-medium">
                 <tr>
                   <th className="px-4 py-3">Tür / No</th>
                   <th className="px-4 py-3">{activeTab === 'alinan' ? 'Müşteri (Alınan)' : 'Tedarikçi (Verilen)'}</th>
                   <th className="px-4 py-3">Vade Tarihi</th>
                   <th className="px-4 py-3">Tutar</th>
                   <th className="px-4 py-3">Durum</th>
                   <th className="px-4 py-3 text-right">İşlem</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {notes.filter(n => activeTab === 'alinan' ? !n.isGiven : n.isGiven).map(n => (
                   <tr key={n.id} className="hover:bg-gray-50">
                     <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{n.type}</div>
                        <div className="text-xs text-gray-500">No: {n.documentNumber}</div>
                     </td>
                     <td className="px-4 py-3 font-medium text-gray-900">{n.customerName}</td>
                     <td className="px-4 py-3">{new Date(n.dueDate).toLocaleDateString('tr-TR')}</td>
                     <td className="px-4 py-3 font-bold text-gray-800">{Number(n.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                     <td className="px-4 py-3">
                       <span className={`px-2 py-1 rounded text-xs font-semibold
                         ${n.status === 'Tahsil Edildi' || n.status === 'Ödendi' ? 'bg-emerald-100 text-emerald-700' :
                           n.status === 'Karşılıksız/Ödenmedi' ? 'bg-red-100 text-red-700' :
                           n.status === 'Tahsilde' ? 'bg-blue-100 text-blue-700' :
                           'bg-amber-100 text-amber-700'
                         }`}>
                         {n.status}
                       </span>
                     </td>
                     <td className="px-4 py-3 text-right space-x-2">
                       {n.status === 'Portföyde' && !n.isGiven && (
                          <button onClick={() => handleStatusChange(n.id, 'Tahsilde')} className="text-blue-600 hover:text-blue-800" title="Tahsile Ver"><ArrowRightCircle size={16}/></button>
                       )}
                       {n.status === 'Tahsilde' && !n.isGiven && (
                          <button onClick={() => handleStatusChange(n.id, 'Tahsil Edildi')} className="text-emerald-600 hover:text-emerald-800" title="Tahsil Edildi İşaretle"><CheckCircle size={16}/></button>
                       )}
                       {n.status === 'Portföyde' && n.isGiven && (
                          <button onClick={() => handleStatusChange(n.id, 'Ödendi')} className="text-emerald-600 hover:text-emerald-800" title="Ödendi İşaretle"><CheckCircle size={16}/></button>
                       )}
                       <button onClick={() => { setFormData(n); setIsModalOpen(true); }} className="text-gray-500 hover:text-gray-800" title="Düzenle"><Edit2 size={16}/></button>
                       <button onClick={() => deleteNote(n.id)} className="text-red-500 hover:text-red-800" title="Sil"><Trash2 size={16}/></button>
                     </td>
                   </tr>
                 ))}
                 {notes.filter(n => activeTab === 'alinan' ? !n.isGiven : n.isGiven).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Kayıt bulunamadı.</td>
                    </tr>
                 )}
               </tbody>
             </table>
           </div>
         </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center p-6 border-b">
               <h2 className="text-xl font-semibold">{formData.id ? 'Düzenle' : 'Yeni'} {formData.isGiven ? 'Verilen' : 'Alınan'} {formData.type}</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><XCircle size={24} /></button>
             </div>
             
             <form onSubmit={saveNote} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                      <select value={formData.type || ""} onChange={e => setFormData({...formData, type: e.target.value as 'Çek' | 'Senet'})} className="w-full border rounded-lg px-3 py-2">
                         <option value="Çek">Çek</option>
                         <option value="Senet">Senet</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                      <select value={formData.status || ""} onChange={e => setFormData({...formData, status: e.target.value as ChequeNoteStatus})} className="w-full border rounded-lg px-3 py-2">
                         <option value="Portföyde">Portföyde</option>
                         <option value="Tahsilde">Tahsilde</option>
                         <option value="Ciro Edildi">Ciro Edildi</option>
                         <option value="Tahsil Edildi">Tahsil Edildi</option>
                         <option value="Ödendi">Ödendi</option>
                         <option value="Karşılıksız/Ödenmedi">Karşılıksız/Ödenmedi</option>
                         <option value="İade Edildi">İade Edildi</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Belge No</label>
                      <input type="text" required value={formData.documentNumber || ""} onChange={e => setFormData({...formData, documentNumber: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri / Tedarikçi</label>
                      <select required value={formData.customerId || ""} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                         <option value="">Seçiniz...</option>
                         {customers.map(c => <option key={c.id} value={c.id || ""}>{c.name || c.companyName}</option>)}
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tutar</label>
                      <input type="number" min="0" step="0.01" required value={formData.amount || ""} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full border rounded-lg px-3 py-2" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Düzenlenme Tarihi</label>
                      <input type="date" required value={formData.issueDate || ""} onChange={e => setFormData({...formData, issueDate: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vade Tarihi</label>
                      <input type="date" required value={formData.dueDate || ""} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                   </div>
                </div>

                {formData.type === 'Çek' && (
                   <div className="grid grid-cols-3 gap-4 border-t pt-4 mt-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Banka</label>
                         <input type="text" value={formData.bankName || ''} onChange={e => setFormData({...formData, bankName: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Şube</label>
                         <input type="text" value={formData.branchName || ''} onChange={e => setFormData({...formData, branchName: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Hesap No</label>
                         <input type="text" value={formData.accountNumber || ''} onChange={e => setFormData({...formData, accountNumber: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                      </div>
                   </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Keşideci</label>
                      <input type="text" value={formData.drawer || ''} onChange={e => setFormData({...formData, drawer: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ciranta</label>
                      <input type="text" value={formData.endorser || ''} onChange={e => setFormData({...formData, endorser: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                   </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
                   <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">Kaydet</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
