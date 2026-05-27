import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, X, Save, Building, User, FileText, History, Download, CreditCard, Send, Upload, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Customer, CustomerTransaction, CashTransaction } from '../types';
import { useAppStore } from '../lib/store';
import { parseEmailTemplate, defaultTemplates } from '../lib/emailUtils';
import toast from 'react-hot-toast';

const INITIAL_FORM: Customer = {
  id: '',
  customerType: 'Şahıs',
  name: '',
  companyName: '',
  email: '',
  phone: '',
  city: '',
  district: '',
  address: '',
  taxOffice: '',
  taxNumber: '',
  iban: '',
  type: 'Alıcı',
  balance: 0,
  status: 'Aktif'
};

interface Province {
  id: number;
  name: string;
  districts: { id: number; name: string }[];
}

export const Cariler: React.FC = () => {
  const store = useAppStore();
  const customers = store.customers;
  const setCustomers = store.setCustomers;
  const transactions = store.transactions;
  const setTransactions = store.setTransactions;
  const cashTransactions = store.cashTransactions;
  const setCashTransactions = store.setCashTransactions;

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Customer>(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);

  // Transaction History States
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  // Payment Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<{ amount: number, description: string, type: 'Tahsilat' | 'Ödeme' }>({ amount: 0, description: '', type: 'Tahsilat' });

  const handleOpenHistory = (customer: Customer) => {
    setSelectedCustomerForHistory(customer);
    setIsHistoryModalOpen(true);
  };

  const handleOpenPayment = (customer: Customer, type: 'Tahsilat' | 'Ödeme') => {
    setSelectedCustomerForHistory(customer);
    setPaymentForm({ amount: 0, description: '', type });
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForHistory) return;
    
    const newTransaction: CustomerTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      customerId: selectedCustomerForHistory.id,
      date: new Date().toISOString().split('T')[0],
      type: paymentForm.type,
      amount: paymentForm.type === 'Tahsilat' ? -Math.abs(paymentForm.amount) : Math.abs(paymentForm.amount),
      description: paymentForm.description
    };

    const newTransactions = [...transactions, newTransaction];
    setTransactions(newTransactions);

    const newCashTx: CashTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: newTransaction.date,
      type: paymentForm.type === 'Tahsilat' ? 'Gelir' : 'Gider',
      category: paymentForm.type === 'Tahsilat' ? 'Cari Tahsilat' : 'Cari Ödeme',
      amount: Math.abs(paymentForm.amount),
      description: paymentForm.description + ' (' + (selectedCustomerForHistory.companyName || selectedCustomerForHistory.name) + ')',
      customerId: selectedCustomerForHistory.id
    };
    setCashTransactions([...cashTransactions, newCashTx]);

    const updatedCustomers = customers.map(c => {
      if (c.id === selectedCustomerForHistory.id) {
        return { ...c, balance: c.balance + newTransaction.amount };
      }
      return c;
    });
    setCustomers(updatedCustomers);
    
    // Update the selected customer reference inside the modal if it's open
    if (isHistoryModalOpen) {
      setSelectedCustomerForHistory(updatedCustomers.find(c => c.id === selectedCustomerForHistory.id) || null);
    }
    
    setIsPaymentModalOpen(false);
  };

  const [printEkstreModalOpen, setPrintEkstreModalOpen] = useState(false);

  const printCustomerHistory = (customer: Customer) => {
    setPrintEkstreModalOpen(true);
  };

  const downloadHistoryExcel = (customer: Customer) => {
    const customerTransactions = transactions.filter(t => t.customerId === customer.id);
    
    // Sort transactions by date (optional, but good practice)
    const sortedTransactions = customerTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const exportData = sortedTransactions.map(t => ({
      'Tarih': t.date,
      'İşlem Tipi': t.type,
      'Açıklama': t.description,
      'Tutar': t.amount,
      'Kasa/Banka': t.bankId ? banks.find(b => b.id === t.bankId)?.name || '' : ''
    }));

    // Add current balance as the last row for summary
    exportData.push({
      'Tarih': 'GENEL TOPLAM / BAKİYE',
      'İşlem Tipi': '',
      'Açıklama': '',
      'Tutar': customer.balance,
      'Kasa/Banka': ''
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hareketler");
    
    // Auto-size columns slightly
    const wscols = [
      {wch: 15}, // Tarih
      {wch: 15}, // İşlem Tipi
      {wch: 40}, // Açıklama
      {wch: 15}, // Tutar
      {wch: 20}  // Kasa/Banka
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, `${customer.name.replace(/\s+/g, '_')}_Hareketler.xlsx`);
  };

  const sendHistoryEmail = async (customer: Customer) => {
    if (!customer.email) {
      toast.error("Bu carinin e-posta adresi kayıtlı değil.");
      return;
    }
    const subject = `Cari Hesap Ekstresi - ${store.settings.companyName || customer.companyName || customer.name}`;
    
    // Şablon yükleme veya varsayılan
    const templateRaw = store.settings.email_template_customer || defaultTemplates.customer_statement;
    const body = parseEmailTemplate(templateRaw, {
      MUSTERI_ADI: customer.companyName || customer.name || '',
      BAKIYE: customer.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
      FIRMA_ADI: store.settings.companyName || '',
      FIRMA_TELEFON: store.settings.phone || '',
      FIRMA_MAIL: store.settings.email || '',
      FIRMA_ADRES: store.settings.address || '',
      FIRMA_VERGI_DAIRESI: store.settings.taxOffice || '',
      FIRMA_VKN: store.settings.taxNumber || '',
      TARIH: new Date().toLocaleDateString('tr-TR')
    });
    
    const promise = fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: customer.email, subject, html: body })
    }).then(async res => {
      if (!res.ok) throw new Error('Mail gönderilemedi.');
      return res.json();
    });

    toast.promise(promise, {
      loading: 'E-posta gönderiliyor...',
      success: 'E-posta başarıyla gönderildi.',
      error: 'Mail gönderimi sırasında hata oluştu.'
    });
  };

  useEffect(() => {
    fetch('https://turkiyeapi.dev/api/v1/provinces')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'OK') {
          // Sort alphabetically
          const sorted = data.data.sort((a: Province, b: Province) => a.name.localeCompare(b.name, 'tr'));
          setProvinces(sorted);
        }
      })
      .catch(err => console.error("Could not fetch provinces:", err));
  }, []);

  useEffect(() => {
    if (formData.city) {
      const selectedProvince = provinces.find(p => p.name === formData.city);
      if (selectedProvince) {
        setDistricts(selectedProvince.districts.sort((a, b) => a.name.localeCompare(b.name, 'tr')));
      } else {
        setDistricts([]);
      }
    } else {
      setDistricts([]);
    }
  }, [formData.city, provinces]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToExcel = () => {
    const exportData = filteredCustomers.map(c => ({
      'Tür': c.customerType,
      'Cari Tipi': c.type,
      'Ad Soyad / Yetkili': c.name,
      'Firma Unvanı': c.companyName || '',
      'E-Posta': c.email || '',
      'Telefon': c.phone || '',
      'İl': c.city || '',
      'İlçe': c.district || '',
      'Adres': c.address || '',
      'Vergi Dairesi': c.taxOffice || '',
      'Vergi / TC No': c.taxNumber || '',
      'IBAN': c.iban || '',
      'Durum': c.status,
      'Bakiye': c.balance
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cariler");
    XLSX.writeFile(wb, "cari_listesi.xlsx");
  };

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const newCustomers: Customer[] = data.map((row: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          customerType: (row['Tür'] === 'Tüzel' ? 'Tüzel' : 'Şahıs') as 'Şahıs' | 'Tüzel',
          type: (row['Cari Tipi'] === 'Satıcı' ? 'Satıcı' : 'Alıcı') as 'Alıcı' | 'Satıcı',
          name: row['Ad Soyad / Yetkili']?.toString() || '',
          companyName: row['Firma Unvanı']?.toString() || '',
          email: row['E-Posta']?.toString() || '',
          phone: row['Telefon']?.toString() || '',
          city: row['İl']?.toString() || '',
          district: row['İlçe']?.toString() || '',
          address: row['Adres']?.toString() || '',
          taxOffice: row['Vergi Dairesi']?.toString() || '',
          taxNumber: row['Vergi / TC No']?.toString() || '',
          iban: row['IBAN']?.toString() || '',
          status: (row['Durum'] === 'Pasif' ? 'Pasif' : 'Aktif') as 'Aktif' | 'Pasif',
          balance: Number(row['Bakiye']) || 0
        })).filter((c: any) => c.name || c.companyName);
        
        if (newCustomers.length > 0) {
          setCustomers([...customers, ...newCustomers]);
          alert(`${newCustomers.length} cari başarıyla eklendi.`);
        }
      } catch (error) {
        console.error("Error importing excel:", error);
        alert("Excel dosyası okunurken bir hata oluştu.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const filteredCustomers = customers.filter(c => {
    const searchStr = searchTerm.toLowerCase();
    const matchName = c.name?.toLowerCase().includes(searchStr);
    const matchTitle = c.companyName?.toLowerCase().includes(searchStr);
    const matchEmail = c.email?.toLowerCase().includes(searchStr);
    return matchName || matchTitle || matchEmail;
  });

  const handleAddNew = () => {
    const nextId = `${store.settings.prefix_customer || 'CAR'}-${store.settings.next_customer_id || 1001}`;
    setFormData({ ...INITIAL_FORM, id: nextId });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setFormData({ ...customer });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu cariyi silmek istediğinizden emin misiniz?')) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      setCustomers(customers.map(c => c.id === formData.id ? formData : c));
    } else {
      setCustomers([...customers, formData]);
      store.setSettings({
        ...store.settings,
        next_customer_id: (store.settings.next_customer_id || 1001) + 1
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Cari Hesaplar</h2>
        <div className="flex flex-wrap gap-2">
          <input type="file" ref={fileInputRef} onChange={importFromExcel} className="hidden" accept=".xlsx, .xls, .csv" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Upload size={18} />
            <span className="hidden sm:inline">İçe Aktar</span>
          </button>
          <button 
            onClick={exportToExcel}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Dışa Aktar</span>
          </button>
          <button 
            onClick={handleAddNew}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Yeni Cari Ekle</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari ara..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Cari Türü</th>
                <th className="px-6 py-4">Cari Adı / Ünvan</th>
                <th className="px-6 py-4">İletişim</th>
                <th className="px-6 py-4">Adres</th>
                <th className="px-6 py-4">Bakiye</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        customer.customerType === 'Tüzel' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {customer.customerType === 'Tüzel' ? <Building size={12} /> : <User size={12} />}
                        {customer.customerType}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">{customer.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">
                        {customer.companyName || customer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.companyName ? customer.name : ''}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">#{customer.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Mail size={14} className="text-emerald-500" /> {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} className="text-emerald-500" /> {customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400 min-w-[14px]" />
                        <span className="truncate max-w-[200px]">
                          {customer.city ? `${customer.city}${customer.district ? `, ${customer.district}` : ''}` : customer.address}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${customer.balance > 0 ? 'text-emerald-600' : customer.balance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {Number(customer.balance).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          title="Cari Hesap Ekstresi (Geçmiş)"
                          onClick={() => handleOpenHistory(customer)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <History size={18} />
                        </button>
                        <button 
                          title="Ödeme Yap"
                          onClick={() => handleOpenPayment(customer, 'Ödeme')}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <CreditCard size={18} />
                        </button>
                        <button 
                          title="Tahsilat Al"
                          onClick={() => handleOpenPayment(customer, 'Tahsilat')}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors"
                        >
                          <CreditCard size={18} />
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-1"></div>
                        <button 
                          title="Düzenle"
                          onClick={() => handleEdit(customer)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          title="Sil"
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b bg-gray-50 flex justify-between items-center rounded-t-xl shrink-0">
              <div>
                <h3 className="font-bold text-xl text-gray-800">{isEditing ? 'Cari Düzenle' : 'Yeni Cari Ekle'}</h3>
                <p className="text-sm text-gray-500 mt-1">Müşteri veya tedarikçi bilgilerini eksiksiz doldurun.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col overflow-hidden">
              <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
              
                   <div className="flex gap-4 sm:p-6 pb-4 border-b">
                <div className="flex-1">
                   <label className="block text-sm font-semibold text-gray-700 mb-2">Cari Türü</label>
                   <div className="flex flex-wrap gap-4">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="customerType" 
                          value="Şahıs" 
                          checked={formData.customerType === 'Şahıs'}
                          onChange={(e) => setFormData({...formData, customerType: e.target.value as 'Şahıs'|'Tüzel', taxNumber: ''})}
                          className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>Şahıs</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="customerType" 
                          value="Tüzel" 
                          checked={formData.customerType === 'Tüzel'}
                          onChange={(e) => setFormData({...formData, customerType: e.target.value as 'Şahıs'|'Tüzel', taxNumber: ''})}
                          className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>Tüzel</span>
                     </label>
                   </div>
                </div>
                <div className="flex-1">
                   <label className="block text-sm font-semibold text-gray-700 mb-2">Bağlantı Tipi</label>
                   <div className="flex flex-wrap gap-4">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="connectionType" 
                          value="Alıcı" 
                          checked={formData.type === 'Alıcı'}
                          onChange={(e) => setFormData({...formData, type: e.target.value as 'Alıcı'|'Satıcı'})}
                          className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>Alıcı (Müşteri)</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="connectionType" 
                          value="Satıcı" 
                          checked={formData.type === 'Satıcı'}
                          onChange={(e) => setFormData({...formData, type: e.target.value as 'Alıcı'|'Satıcı'})}
                          className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>Satıcı (Tedarikçi)</span>
                     </label>
                   </div>
                </div>
              </div>

              {/* Temel Bilgiler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:p-6">
                <div className="md:col-span-2">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Temel Bilgiler</h4>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.customerType === 'Şahıs' ? 'Ad Soyad' : 'Yetkili Adı Soyadı'}
                  </label>
                  <input 
                    required={formData.customerType === 'Şahıs'}
                    type="text" 
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Örn: Ahmet Yılmaz"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.customerType === 'Şahıs' ? 'Firma Adı (İsteğe Bağlı)' : 'Firma Ünvanı'}
                  </label>
                  <input 
                    required={formData.customerType === 'Tüzel'}
                    type="text" 
                    value={formData.companyName || ''}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Örn: Yılmaz Ticaret"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="05XX XXX XX XX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Posta</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="ornek@firma.com"
                  />
                </div>
              </div>

              {/* Ticari Bilgiler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:p-6 pt-4 border-t">
                 <div className="md:col-span-2">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Ticari Bilgiler</h4>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Dairesi</label>
                    <input 
                      type="text" 
                      value={formData.taxOffice || ''}
                      onChange={(e) => setFormData({...formData, taxOffice: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Örn: Kadıköy V.D."
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.customerType === 'Şahıs' ? 'TC Kimlik Numarası' : 'Vergi Numarası'}
                    </label>
                    <input 
                      type="text" 
                      maxLength={formData.customerType === 'Şahıs' ? 11 : 10}
                      value={formData.taxNumber || ''}
                      onChange={(e) => {
                         const val = e.target.value.replace(/\D/g, ''); // Sadece sayılar
                         setFormData({...formData, taxNumber: val})
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder={formData.customerType === 'Şahıs' ? '11 Haneli TC Kimlik No' : '10 Haneli Vergi No'}
                    />
                 </div>

                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">IBAN Numarası</label>
                    <input 
                      type="text" 
                      value={formData.iban || ''}
                      onChange={(e) => setFormData({...formData, iban: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                    />
                 </div>
              </div>

              {/* Adres Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:p-6 pt-4 border-t">
                 <div className="md:col-span-2">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Adres Bilgileri</h4>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İl (Şehir)</label>
                    <select
                      value={formData.city || ''}
                      onChange={(e) => setFormData({...formData, city: e.target.value, district: ''})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      <option value="">İl Seçin</option>
                      {provinces.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                    <select
                      value={formData.district || ''}
                      onChange={(e) => setFormData({...formData, district: e.target.value})}
                      disabled={!formData.city || districts.length === 0}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white disabled:bg-gray-100"
                    >
                      <option value="">İlçe Seçin</option>
                      {districts.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                 </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açık Adres</label>
                  <textarea 
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Mahalle, Sokak, No, Daire vb."
                  />
                </div>
              </div>

              {/* Finansal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:p-6 pt-4 border-t">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cari Durumu</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'Aktif'|'Pasif'})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Pasif">Pasif</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açılış Bakiyesi (₺)</label>
                    <input 
                      type="number" 
                      value={formData.balance}
                      onChange={(e) => setFormData({...formData, balance: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                 </div>
              </div>
              </div>
              <div className="p-4 sm:p-6 bg-gray-50 border-t flex justify-end gap-3 rounded-b-xl shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium border border-gray-200"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
                >
                  <Save size={18} />
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History / Ekstre Modal */}
      {isHistoryModalOpen && selectedCustomerForHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b bg-gray-50 flex justify-between items-center rounded-t-xl shrink-0">
              <div>
                <h3 className="font-bold text-xl text-gray-800">Geçmiş İşlemler</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedCustomerForHistory.companyName || selectedCustomerForHistory.name}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => downloadHistoryExcel(selectedCustomerForHistory)} 
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download size={18} />
                  <span>Excel İndir</span>
                </button>
                <button 
                  onClick={() => printCustomerHistory(selectedCustomerForHistory)} 
                  className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <Printer size={18} />
                  <span>Yazdır / PDF (A4)</span>
                </button>
                <button 
                  onClick={() => sendHistoryEmail(selectedCustomerForHistory)} 
                  className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2"
                >
                  <Send size={18} />
                  <span>Gönder</span>
                </button>
                <button onClick={() => setIsHistoryModalOpen(false)} className="h-10 w-10 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-lg hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
                <span className="text-gray-600 font-medium">Güncel Bakiye:</span>
                <span className={`text-xl font-bold ${selectedCustomerForHistory.balance > 0 ? 'text-emerald-600' : selectedCustomerForHistory.balance < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {selectedCustomerForHistory.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </span>
              </div>
              
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-lg">Tarih</th>
                    <th className="px-6 py-4">Açıklama</th>
                    <th className="px-6 py-4">İşlem Türü</th>
                    <th className="px-6 py-4 text-right rounded-tr-lg">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.filter(t => t.customerId === selectedCustomerForHistory.id).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        Herhangi bir işlem bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    transactions.filter(t => t.customerId === selectedCustomerForHistory.id).map(t => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{t.description}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 ${t.type === 'Tahsilat' || t.type === 'Satış' ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                            {t.type}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right font-medium ${t.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment / Tahsilat Modal */}
      {isPaymentModalOpen && selectedCustomerForHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden">
             <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">
                {paymentForm.type === 'Tahsilat' ? 'Tahsilat Al' : 'Ödeme Yap'}
              </h3>
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSavePayment} className="p-4 sm:p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cari: <span className="font-bold text-gray-900">{selectedCustomerForHistory.companyName || selectedCustomerForHistory.name}</span></label>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Türü</label>
                 <select 
                   value={paymentForm.type}
                   onChange={e => setPaymentForm({...paymentForm, type: e.target.value as 'Tahsilat'|'Ödeme'})}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                 >
                    <option value="Tahsilat">Tahsilat (Alınan)</option>
                    <option value="Ödeme">Ödeme (Verilen)</option>
                 </select>
               </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺)</label>
                <input 
                  required
                  type="number" 
                  min="0.01" step="0.01"
                  value={paymentForm.amount || ''}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea 
                  rows={2}
                  required
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Nakit tahsilat, EFT/Havale vb."
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className={`px-6 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${paymentForm.type === 'Tahsilat' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  <Save size={18} />
                  {paymentForm.type === 'Tahsilat' ? 'Tahsilat Al' : 'Ödeme Yap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* A4 Ekstre Print Modal */}
      {printEkstreModalOpen && selectedCustomerForHistory && (
        <div className="fixed inset-0 bg-gray-500/75 z-50 flex items-start justify-center p-4 sm:p-6 shadow-2xl backdrop-blur-sm overflow-y-auto print:bg-white print:p-0 print:m-0 animate-fade-in print:block">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-4xl mb-8 print:shadow-none print:max-w-full print:m-0 print:rounded-none">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl no-print">
              <div className="flex items-center gap-3">
                <FileText className="text-gray-400" />
                <h3 className="text-lg font-bold text-gray-800">Cari Ekstre Yazdır (A4)</h3>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setTimeout(() => window.print(), 100);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <Printer size={18} />
                  Yazdır / PDF İndir
                </button>
                <button onClick={() => setPrintEkstreModalOpen(false)} className="text-gray-500 hover:text-gray-700 transition-colors p-2">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Print Content - A4 Document Format */}
            <div className="p-8 md:p-12 print:p-4 print:text-black font-sans bg-white">
              <div className="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-6 print:border-black">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 print:text-black mb-2">CARİ HESAP EKSTRESİ</h1>
                  <p className="text-gray-600 print:text-black mt-2 font-bold text-xl">
                    {selectedCustomerForHistory.companyName || selectedCustomerForHistory.name}
                  </p>
                  <p className="text-gray-500 print:text-black">
                    Vergi D., No: {selectedCustomerForHistory.taxOffice || '-'} / {selectedCustomerForHistory.taxNumber || '-'}
                  </p>
                  <p className="text-gray-500 print:text-black mt-2">
                    Çıktı Tarihi: {new Date().toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="text-right">
                  {store.settings.companyLogo ? (
                    <img src={store.settings.companyLogo} alt="Logo" className="max-h-20 object-contain ml-auto mb-2" />
                  ) : (
                    <h2 className="font-logo text-3xl font-bold text-blue-900 print:text-black mb-2">{store.settings.printer_header_text || 'esila'}</h2>
                  )}
                  <p className="text-sm text-gray-600 print:text-black font-medium">{store.settings.companyName}</p>
                </div>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 print:border-gray-400 print:bg-transparent">
                  <p className="text-sm text-gray-500 print:text-black font-medium mb-1">Müşteri/Firma Yetkilisi</p>
                  <p className="text-lg font-bold text-gray-800 print:text-black">
                    {selectedCustomerForHistory.name}
                  </p>
                  <p className="text-gray-600 print:text-black">{selectedCustomerForHistory.phone}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 print:border-gray-500 print:bg-transparent">
                  <p className="text-sm text-blue-600 print:text-black font-bold mb-1">Güncel Bakiye</p>
                  <p className={`text-2xl font-bold ${selectedCustomerForHistory.balance >= 0 ? 'text-emerald-700' : 'text-red-700'} print:text-black`}>
                    {selectedCustomerForHistory.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </p>
                  <p className="text-xs text-blue-700 print:text-black opacity-80 mt-1">
                    {selectedCustomerForHistory.balance >= 0 ? 'Müşteri Borçludur' : 'Firmamız Borçludur (Fazla Tahsilat)'}
                  </p>
                </div>
              </div>

              {/* Transactions List */}
              <div className="mb-4">
                <h3 className="font-bold text-gray-800 print:text-black mb-4 border-b pb-2">Hesap Hareketleri</h3>
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 print:bg-gray-200 text-gray-800 print:text-black font-semibold">
                      <th className="p-3 border border-gray-200 print:border-gray-400 w-32">Tarih</th>
                      <th className="p-3 border border-gray-200 print:border-gray-400 w-32">İşlem Tipi</th>
                      <th className="p-3 border border-gray-200 print:border-gray-400">Açıklama</th>
                      <th className="p-3 border border-gray-200 print:border-gray-400 text-right w-36">Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.filter(t => t.customerId === selectedCustomerForHistory.id).map(tx => (
                      <tr key={tx.id} className="border-b border-gray-200 print:border-gray-300">
                        <td className="p-3 border-x border-gray-200 print:border-gray-300 text-gray-600 print:text-black whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="p-3 border-x border-gray-200 print:border-gray-300">
                          <span className={`font-medium ${tx.type === 'Alacak' ? 'text-red-700 print:text-black' : 'text-emerald-700 print:text-black'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-3 border-x border-gray-200 print:border-gray-300 text-gray-800 print:text-black text-xs">
                          {tx.description}
                        </td>
                        <td className={`p-3 border-x border-gray-200 print:border-gray-300 text-right font-bold whitespace-nowrap ${tx.type === 'Alacak' ? 'text-red-700 print:text-black' : 'text-emerald-700 print:text-black'}`}>
                          {tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                      </tr>
                    ))}
                    {transactions.filter(t => t.customerId === selectedCustomerForHistory.id).length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-gray-500 border border-gray-200">
                          Kayıtlı hesap hareketi bulunmuyor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-12 flex justify-between px-8 no-print">
                <div className="text-center">
                  <div className="w-48 h-px bg-gray-300 mb-2"></div>
                  <p className="text-gray-500">Müşteri Kaşe/İmza</p>
                </div>
                <div className="text-center">
                  <div className="w-48 h-px bg-gray-300 mb-2"></div>
                  <p className="text-gray-500">Firma Yetkilisi İmza</p>
                </div>
              </div>
              <div className="mt-20 print:flex justify-between px-8 hidden text-black">
                <div className="text-center">
                  <div className="w-48 h-px bg-black mb-2"></div>
                  <p>Müşteri Kaşe/İmza</p>
                </div>
                <div className="text-center">
                  <div className="w-48 h-px bg-black mb-2"></div>
                  <p>Firma Yetkilisi İmza</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};