import { safeSessionStorage } from '../lib/storage';
import React, { useState, useEffect } from 'react';
import { RefreshCcw, Search, Plus, Mail, CheckCircle, XCircle, Clock, Users, MessageCircle, MessageSquare, Mic, MicOff, CheckSquare } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Reconciliation, ReconciliationStatus, Customer } from '../types';
import { apiFetch } from '../lib/api';
import { parseEmailTemplate, defaultTemplates } from '../lib/emailUtils';
import toast from 'react-hot-toast';
import { Pagination } from '../components/Pagination';
import { useSpeechRecognition } from '../lib/useSpeechRecognition';

import { sendSMS } from '../src/utils/smsRequest';
import { hasPermission } from '../lib/permissions';

export const Mutabakat: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === safeSessionStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'mutabakat', 'view');
  const canCreate = hasPermission(currentUser, 'mutabakat', 'create');
  const canEdit = hasPermission(currentUser, 'mutabakat', 'edit');
  const canDelete = hasPermission(currentUser, 'mutabakat', 'delete');

  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { isListening, supported, listen, stop } = useSpeechRecognition();
  const [activeSpeechField, setActiveSpeechField] = useState<string | null>(null);

  const startListening = (field: string, updateFn: (text: string) => void) => {
    if (isListening && activeSpeechField === field) {
      stop();
      setActiveSpeechField(null);
    } else {
      if (isListening) stop();
      setActiveSpeechField(field);
      listen((text) => {
        updateFn(text);
      });
    }
  };

  const [formData, setFormData] = useState<Partial<Reconciliation> & { sendSms?: boolean }>({
    date: new Date().toISOString().split('T')[0],
    balanceType: 'Borç',
    balance: 0,
    status: ReconciliationStatus.PENDING,
    notes: '',
    sendSms: false
  });

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkFormData, setBulkFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    sendSms: false
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
      MUTABAKAT_LINKI: `${window.location.origin}/mutabakat-onay/${reconciliation.id}?vkn=${store.settings.taxNumber || safeSessionStorage.getItem('esila_tenant_id')}`
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
      if (!res.ok) {
         try {
           const errData = await res.json();
           if (errData.error) throw new Error(errData.error);
         } catch(e: any) {
           throw new Error(e.message || "Gönderim başarısız");
         }
         throw new Error("Gönderim başarısız");
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: `${customer.companyName || customer.name} için mutabakat maili gönderiliyor...`,
      success: `${customer.companyName || customer.name} adresine gönderildi.`,
      error: (err) => err.message || `Mail gönderilemedi.`
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
        if (customer) {
            await sendEmailAlert(newlyCreated, customer);
            if (formData.sendSms && customer.phone) {
                const text = `Sayın ${customer.companyName || customer.name} yetkilisi, ${new Date(newlyCreated.date).toLocaleDateString('tr-TR')} tarihi itibariyle bakiyemiz ${newlyCreated.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL (${newlyCreated.balanceType}) mutabıktır. Linkten onaylayabilirsiniz: ${window.location.origin}/mutabakat-onay/${newlyCreated.id}?vkn=${store.settings.taxNumber || safeSessionStorage.getItem('esila_tenant_id')} - ${store.settings?.companyName || ''}`;
                try {
                  await sendSMS(store.settings, [customer.phone], text);
                  toast.success("SMS başarıyla gönderildi!");
                } catch(err: any) {
                  toast.error("SMS Gönderilemedi: " + (err.message || 'Hata'));
                }
            }
        }
        
        setIsModalOpen(false);
        fetchReconciliations();
        // Reset form
        setFormData({
            date: new Date().toISOString().split('T')[0],
            balanceType: 'Borç',
            balance: 0,
            status: ReconciliationStatus.PENDING,
            notes: '',
            sendSms: false
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
          if (bulkFormData.sendSms && customer.phone) {
             const text = `Sayın ${customer.companyName || customer.name} yetkilisi, ${new Date(newlyCreated.date).toLocaleDateString('tr-TR')} tarihi itibariyle bakiyemiz ${newlyCreated.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL (${newlyCreated.balanceType}) mutabıktır. Linkten onaylayabilirsiniz: ${window.location.origin}/mutabakat-onay/${newlyCreated.id}?vkn=${store.settings.taxNumber || safeSessionStorage.getItem('esila_tenant_id')} - ${store.settings?.companyName || ''}`;
             try {
                await sendSMS(store.settings, [customer.phone], text);
             } catch(e) { } // Ignore errors in bulk to continue
          }
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
        notes: '',
        sendSms: false
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

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredReconciliations = reconciliations.filter(r => {
    const searchMatch = r.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    if (!searchMatch) return false;
    if (activeTab === 'pending') return r.status === ReconciliationStatus.PENDING;
    if (activeTab === 'approved') return r.status === ReconciliationStatus.APPROVED;
    if (activeTab === 'rejected') return r.status === ReconciliationStatus.REJECTED;
    return true;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredReconciliations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReconciliations = itemsPerPage === -1 ? filteredReconciliations : filteredReconciliations.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <CheckSquare size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
        <p>Mutabakat modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold rounded-lg text-gray-800">Mutabakat Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">Müşteri/Tedarikçi bakiye mutabakatlarını yönetin</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <>
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
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex space-x-4 px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('all')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'all'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock size={16} />
              Onay Bekleyenler
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'approved'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle size={16} />
              Onaylananlar
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'rejected'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <XCircle size={16} />
              Reddedilenler
            </button>
          </nav>
        </div>

        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative max-w-full sm:max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari adı ile ara..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={searchTerm || ""}
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
                           const link = `${window.location.origin}/mutabakat-onay/${r.id}?vkn=${store.settings.taxNumber || safeSessionStorage.getItem('esila_tenant_id')}`;
                           const ibanText = (r.balanceType === 'B' && store.settings?.iban) ? `\n\nÖdeme Bilgilerimiz:\nBanka: ${store.settings?.bankName || ''}\nIBAN: ${store.settings?.iban}` : '';
                           const text = `Sayın ${r.customerName} yetkilisi, güncel kayıtlarımıza göre ${new Date(r.date).toLocaleDateString('tr-TR')} tarihi itibariyle bakiyemiz ${r.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} (${r.balanceType}) tutarında mutabıktır. Linkten teyit etmenizi rica ederiz: ${link} ${ibanText}\n\nSaygılarımızla, ${store.settings?.companyName || 'Şirket'}`;
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
                           const link = `${window.location.origin}/mutabakat-onay/${r.id}?vkn=${store.settings.taxNumber || safeSessionStorage.getItem('esila_tenant_id')}`;
                           const ibanText = (r.balanceType === 'B' && store.settings?.iban) ? ` Ödeme: ${store.settings?.iban}` : '';
                           const text = `Sayın ${r.customerName} yetkilisi, ${new Date(r.date).toLocaleDateString('tr-TR')} itibariyle bakiyemiz ${r.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL (${r.balanceType}) mutabıktır. Linkten onaylayabilirsiniz: ${link} ${ibanText} ${store.settings?.companyName || 'Şirket'}`;
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
                        <option key={c.id} value={c.id || ""}>{c.companyName || c.name}</option>
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
                      value={formData.balanceType || ""}
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
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Açıklama / Not (Opsiyonel)</label>
                    {supported && (
                      <button
                        type="button"
                        onClick={() => startListening('singleNote', (text) => setFormData(prev => ({ ...prev, notes: prev.notes ? `${prev.notes} ${text}` : text })))}
                        className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${
                          isListening && activeSpeechField === 'singleNote' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={isListening && activeSpeechField === 'singleNote' ? 'Dinlemeyi Durdur' : 'Sesle Yazdır'}
                      >
                        {isListening && activeSpeechField === 'singleNote' ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="Müşteriye iletilecek not..."
                  />
                </div>

                <div className="flex items-center gap-2 mt-4 text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  <input
                    type="checkbox"
                    id="sendSmsSingle"
                    checked={formData.sendSms || false}
                    onChange={(e) => setFormData({...formData, sendSms: e.target.checked})}
                    className="w-4 h-4 text-emerald-600 bg-white border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="sendSmsSingle" className="text-sm font-medium cursor-pointer">
                    Aynı zamanda SMS olarak da gönder (Sadece telefonu kayıtlı olanlara)
                  </label>
                </div>
                
                <div className="bg-emerald-50 p-3 rounded-lg text-sm text-emerald-800">
                    <strong>Bilgi:</strong> Mutabakat kaydedildiğinde, cariye onay/red bağlantısını içeren otomatik bir iletişim gönderilecektir.
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
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Toplu Açıklama / Not (Opsiyonel)</label>
                    {supported && (
                      <button
                        type="button"
                        onClick={() => startListening('bulkNote', (text) => setBulkFormData(prev => ({ ...prev, notes: prev.notes ? `${prev.notes} ${text}` : text })))}
                        className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${
                          isListening && activeSpeechField === 'bulkNote' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={isListening && activeSpeechField === 'bulkNote' ? 'Dinlemeyi Durdur' : 'Sesle Yazdır'}
                      >
                        {isListening && activeSpeechField === 'bulkNote' ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    disabled={isSendingBulk}
                    value={bulkFormData.notes || ''}
                    onChange={(e) => setBulkFormData({...bulkFormData, notes: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Müşterilere iletilecek genel not..."
                  />
                </div>

                <div className="flex items-center gap-2 mt-4 text-indigo-800 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                  <input
                    type="checkbox"
                    id="sendSmsBulk"
                    disabled={isSendingBulk}
                    checked={bulkFormData.sendSms || false}
                    onChange={(e) => setBulkFormData({...bulkFormData, sendSms: e.target.checked})}
                    className="w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="sendSmsBulk" className="text-sm font-medium cursor-pointer">
                    Aynı zamanda SMS olarak da gönder (Sadece telefonu kayıtlı olanlara)
                  </label>
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
