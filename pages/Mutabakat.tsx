import React, { useState, useEffect } from 'react';
import { RefreshCcw, Search, Plus, Mail, CheckCircle, XCircle, Clock, Users, MessageCircle, MessageSquare } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Reconciliation, ReconciliationStatus, Customer } from '../types';
import { apiFetch } from '../lib/api';
import { parseEmailTemplate, defaultTemplates } from '../lib/emailUtils';
import toast from 'react-hot-toast';
import { Pagination } from '../components/Pagination';

import { sendSMS } from '../src/utils/smsRequest';

export const Mutabakat: React.FC = () => {
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const store = useAppStore();

  const [formData, setFormData] = useState<Partial<Reconciliation>>({
    date: new Date().toISOString().split('T')[0],
    balanceType: 'Borç',
    balance: 0,
    status: ReconciliationStatus.PENDING,
    notes: ''
  });

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkFormData, setBulkFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchReconciliations = async () => {
    try {
      const res = await apiFetch('/api/reconciliations');
      const data = await res.json();
      setReconciliations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliations();
  }, []);

  const sendEmailAlert = async (reconciliation: any, customer: Customer) => {
    if (!customer.email) return;
    const templateRaw = store.settings.email_template_reconciliation || defaultTemplates.reconciliation;
    const body = parseEmailTemplate(templateRaw, {
      MUSTERI_ADI: customer.companyName || customer.name || '',
      BAKIYE: reconciliation.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
      BAKIYE_TIPI: reconciliation.balanceType,
      FIRMA_ADI: store.settings.companyName || '',
      FIRMA_TELEFON: store.settings.phone || '',
      FIRMA_MAIL: store.settings.email || '',
      FIRMA_ADRES: store.settings.address || '',
      FIRMA_VERGI_DAIRESI: store.settings.taxOffice || '',
      FIRMA_VKN: store.settings.taxNumber || '',
      TARIH: new Date(reconciliation.date).toLocaleDateString('tr-TR'),
      MUTABAKAT_LINKI: `${window.location.origin}/mutabakat-onay/${reconciliation.id}?vkn=${store.settings.taxNumber || localStorage.getItem('esila_tenant_id')}`
    });

    const promise = fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
         to: customer.email, 
         subject: `Bakiye Mutabakatı - ${store.settings.companyName}`, 
         html: body 
      })
    }).then(async res => {
      if (!res.ok) throw new Error("Gönderim başarısız");
      return res.json();
    });

    toast.promise(promise, {
      loading: `${customer.companyName || customer.name} için mutabakat maili gönderiliyor...`,
      success: `${customer.companyName || customer.name} adresine gönderildi.`,
      error: `Mail gönderilemedi.`
    });
    
    // We await for the promise slightly so that if called in loop it blocks
    try {
      await promise;
    } catch(e) {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
        alert("Lütfen Cari seçiniz");
        return;
    }
    const customer = store.customers.find(c => c.id === formData.customerId);
    
    try {
      const res = await apiFetch('/api/reconciliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          customerName: customer?.companyName || customer?.name || 'Bilinmiyor',
          customerEmail: customer?.email || '',
        }),
      });
      if (res.ok) {
        const newlyCreated = await res.json();
        if (customer) await sendEmailAlert(newlyCreated, customer);
        
        setIsModalOpen(false);
        fetchReconciliations();
        // Reset form
        setFormData({
            date: new Date().toISOString().split('T')[0],
            balanceType: 'Borç',
            balance: 0,
            status: ReconciliationStatus.PENDING,
            notes: ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingBulk(true);
    let sentCount = 0;

    for (const customer of store.customers) {
      if (!customer.email && customer.balance === 0) continue; // skip if no email or 0 balance ? lets just do what was originally there

      const isDebt = customer.balance >= 0;
      const bType = customer.balance === 0 ? 'Yok' : (isDebt ? 'Borç' : 'Alacak');
      
      try {
        const res = await apiFetch('/api/reconciliations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: customer.id,
            customerName: customer.companyName || customer.name || 'Bilinmiyor',
            customerEmail: customer.email || '',
            date: bulkFormData.date,
            balance: Math.abs(customer.balance),
            balanceType: bType,
            status: ReconciliationStatus.PENDING,
            notes: bulkFormData.notes
          }),
        });
        if (res.ok) {
          const newlyCreated = await res.json();
          await sendEmailAlert(newlyCreated, customer);
        }
        sentCount++;
      } catch (err) {
        console.error(err);
      }
    }
    
    setIsSendingBulk(false);
    setIsBulkModalOpen(false);
    fetchReconciliations();
    setBulkFormData({
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });
    alert(`${sentCount} adet cariye mutabakat başarıyla gönderildi.`);
  };

  const calculateAutoBalance = (customerId: string) => {
    const customer = store.customers.find(c => c.id === customerId);
    if (!customer) return;
    const isDebt = customer.balance >= 0;
    setFormData(prev => ({
        ...prev,
        customerId,
        balance: Math.abs(customer.balance),
        balanceType: customer.balance === 0 ? 'Yok' : (isDebt ? 'Borç' : 'Alacak')
    }));
  };

  const filteredReconciliations = reconciliations.filter(r => 
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredReconciliations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReconciliations = itemsPerPage === -1 ? filteredReconciliations : filteredReconciliations.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold rounded-lg text-gray-800">Mutabakat Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">Müşteri/Tedarikçi bakiye mutabakatlarını yönetin</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Users size={20} />
            <span className="hidden sm:inline">Toplu Mutabakat Gönder</span>
            <span className="sm:hidden">Toplu Gönder</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Yeni Mutabakat Gönder</span>
            <span className="sm:hidden">Yeni Gönder</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative max-w-full sm:max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari adı ile ara..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchReconciliations} className="flex gap-2 items-center text-emerald-600 hover:bg-emerald-50 px-3 py-2 rounded-lg">
              <RefreshCcw size={18} /> Yenile
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="py-3 px-4 rounded-tl-lg">Tarih</th>
                <th className="py-3 px-4">Cari Adı</th>
                <th className="py-3 px-4">Bakiye</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4 text-center">İşlemler</th>
                <th className="py-3 px-4 text-right">Müşteri Linki (Test)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">Yükleniyor...</td>
                </tr>
              ) : paginatedReconciliations.length === 0 ? (
                <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">Kayıtlı mutabakat bulunamadı.</td>
                </tr>
              ) : paginatedReconciliations.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">{new Date(r.date).toLocaleDateString('tr-TR')}</td>
                  <td className="py-3 px-4 font-medium text-gray-800">{r.customerName}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800">{r.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div>
                    <div className="text-xs text-gray-500">{r.balanceType}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex inline-flex items-center gap-1 ${
                      r.status === ReconciliationStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                      r.status === ReconciliationStatus.REJECTED ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {r.status === ReconciliationStatus.APPROVED && <CheckCircle size={14} />}
                      {r.status === ReconciliationStatus.REJECTED && <XCircle size={14} />}
                      {r.status === ReconciliationStatus.PENDING && <Clock size={14} />}
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                       {r.emailSentAt ? (
                           <div className="text-xs text-gray-500 flex items-center gap-1" title={new Date(r.emailSentAt).toLocaleString('tr-TR')}>
                               <Mail size={16} className="text-blue-500" /> 
                           </div>
                       ) : <Mail size={16} className="text-gray-300" />}
                       
                       <button 
                         onClick={() => {
                           const customer = store.customers.find(c => c.id === r.customerId);
                           if (!customer?.phone) {
                             alert("Müşterinin telefon numarası kayıtlı değil.");
                             return;
                           }
                           const text = `Sayın ${r.customerName} yetkilisi, güncel kayıtlarımıza göre ${new Date(r.date).toLocaleDateString('tr-TR')} tarihi itibariyle bakiyemiz ${r.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} (${r.balanceType}) tutarında mutabıktır. Teyit etmenizi rica ederiz. Saygılarımızla, ${store.settings?.companyName || 'Şirket'}`;
                           window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                         }}
                         className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors title='WhatsApp ile Gönder'"
                         title="WhatsApp ile Gönder"
                       >
                         <MessageCircle size={16} />
                       </button>
                       <button 
                         onClick={async () => {
                           const customer = store.customers.find(c => c.id === r.customerId);
                           if (!customer?.phone) {
                             alert("Müşterinin telefon numarası kayıtlı değil.");
                             return;
                           }
                           const text = `Sayın ${r.customerName} yetkilisi, ${new Date(r.date).toLocaleDateString('tr-TR')} tarihi itibariyle bakiyemiz ${r.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} (${r.balanceType}) mutabıktır. ${store.settings?.companyName || 'Şirket'}`;
                           try {
                             await sendSMS(store.settings, [customer.phone], text);
                             toast.success("SMS başarıyla gönderildi!");
                           } catch (err: any) {
                             toast.error(err.message || "SMS gönderilirken bir hata oluştu.");
                           }
                         }}
                         className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors title='SMS ile Gönder'"
                         title="SMS ile Gönder"
                       >
                         <MessageSquare size={16} />
                       </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {r.status === ReconciliationStatus.PENDING && (
                       <div className="flex justify-end gap-2">
                         <a href={`/api/reconciliations/${r.id}/approve`} target="_blank" className="text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded">Onayla</a>
                         <a href={`/api/reconciliations/${r.id}/reject`} target="_blank" className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded">Reddet</a>
                       </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={filteredReconciliations.length}
        />
      </div>

      {/* New Reconciliation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Yeni Mutabakat Gönder</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cari Seçimi</label>
                  <select
                    required
                    value={formData.customerId || ''}
                    onChange={(e) => calculateAutoBalance(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">Cari Seçiniz</option>
                    {store.customers.map(c => (
                        <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mutabakat Tarihi</label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bakiye (₺)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.balance || ''}
                      onChange={(e) => setFormData({...formData, balance: Number(e.target.value)})}
                      className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bakiye Yönü</label>
                    <select
                      value={formData.balanceType}
                      onChange={(e) => setFormData({...formData, balanceType: e.target.value as any})}
                      className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="Borç">Borçlu</option>
                      <option value="Alacak">Alacaklı</option>
                      <option value="Yok">Bakiye Yok</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama / Not (Opsiyonel)</label>
                  <textarea
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="Müşteriye iletilecek not..."
                  />
                </div>
                
                <div className="bg-emerald-50 p-3 rounded-lg text-sm text-emerald-800">
                    <strong>Bilgi:</strong> Mutabakat kaydedildiğinde, cariye onay/red bağlantısını içeren otomatik bir e-posta gönderilecektir.
                </div>
              </div>
              
              <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Mail size={16} /> Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Reconciliation Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users className="text-indigo-600" size={24} />
                Toplu Mutabakat Gönder
              </h2>
              <button disabled={isSendingBulk} onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleBulkSend} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-sm text-indigo-800">
                  <p><strong>{store.customers.length}</strong> adet aktif cariye otomatik bakiye hesaplanarak mutabakat gönderilecektir.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mutabakat Tarihi</label>
                  <input
                    type="date"
                    required
                    disabled={isSendingBulk}
                    value={bulkFormData.date || ''}
                    onChange={(e) => setBulkFormData({...bulkFormData, date: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toplu Açıklama / Not (Opsiyonel)</label>
                  <textarea
                    rows={3}
                    disabled={isSendingBulk}
                    value={bulkFormData.notes || ''}
                    onChange={(e) => setBulkFormData({...bulkFormData, notes: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Müşterilere iletilecek genel not..."
                  />
                </div>
              </div>
              
              <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                <button
                  type="button"
                  disabled={isSendingBulk}
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSendingBulk || store.customers.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                >
                  <Mail size={16} /> 
                  {isSendingBulk ? 'Gönderiliyor...' : 'Tümüne Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
