import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { Plus, Search, TrendingUp, TrendingDown, Wallet, X, Save, Printer, FileText, Filter, Calendar, Mic, MicOff } from 'lucide-react';
import { CashTransaction } from '../types';
import { Pagination } from '../components/Pagination';
import { useSpeechRecognition } from '../lib/useSpeechRecognition';

import { hasPermission } from '../lib/permissions';
import { CekSenet } from './CekSenet';

export const Kasa: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === sessionStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'kasa', 'view');
  const canCreate = hasPermission(currentUser, 'kasa', 'create');
  const canEdit = hasPermission(currentUser, 'kasa', 'edit');
  const canDelete = hasPermission(currentUser, 'kasa', 'delete');

  const { settings, cashTransactions, setCashTransactions, customers, setCustomers, transactions, setTransactions, personnel, setPersonnel, bankAccounts, setBankAccounts } = store;
  const [activeTab, setActiveTab] = useState<'kasa' | 'banka' | 'cek_senet' | 'masraf'>('kasa');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this_week' | 'this_month'>('all');
  
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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankFormData, setBankFormData] = useState<Partial<BankAccount>>({
    bankName: '',
    accountName: '',
    iban: '',
    balance: 0
  });
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [reportPrintModalOpen, setReportPrintModalOpen] = useState(false);
  const [selectedTxForPrint, setSelectedTxForPrint] = useState<CashTransaction | null>(null);
  const [formData, setFormData] = useState<{
    date: string;
    type: 'Gelir' | 'Gider';
    category: CashTransaction['category'];
    amount: number | '';
    description: string;
    customerId?: string;
    personnelId?: string;
    accountId?: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    type: 'Gelir',
    category: 'Diğer Gelir',
    amount: '',
    description: '',
    customerId: '',
    personnelId: '',
    accountId: 'KASA'
  });

  const totalIncome = cashTransactions.filter(t => t.type === 'Gelir' && (!t.accountId || t.accountId === 'KASA')).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = cashTransactions.filter(t => t.type === 'Gider' && (!t.accountId || t.accountId === 'KASA')).reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  const filteredData = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return cashTransactions.filter(t => {
      const searchMatch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
             t.category.toLowerCase().includes(searchTerm.toLowerCase());

      const tDate = new Date(t.date);
      tDate.setHours(0,0,0,0);
      let dateMatch = true;
      if (dateFilter === 'today') {
          dateMatch = tDate.getTime() === today.getTime();
      } else if (dateFilter === 'this_week') {
          dateMatch = tDate >= startOfWeek;
      } else if (dateFilter === 'this_month') {
          dateMatch = tDate >= startOfMonth;
      }
      return searchMatch && dateMatch;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cashTransactions, searchTerm, dateFilter]);

  // Breakdown metrics for the filtered report
  const reportIncomeTotal = filteredData.filter(t => t.type === 'Gelir').reduce((a,b)=>a+b.amount,0);
  const reportExpenseTotal = filteredData.filter(t => t.type === 'Gider').reduce((a,b)=>a+b.amount,0);
  const reportBalance = reportIncomeTotal - reportExpenseTotal;

  const salesIncome = filteredData.filter(t => t.category === 'Satış').reduce((a,b)=>a+b.amount,0);
  const customerIncome = filteredData.filter(t => t.category === 'Cari Tahsilat').reduce((a,b)=>a+b.amount,0);
  const otherIncome = reportIncomeTotal - salesIncome - customerIncome;

  const purchaseExpense = filteredData.filter(t => t.category === 'Alış').reduce((a,b)=>a+b.amount,0);
  const customerExpense = filteredData.filter(t => t.category === 'Cari Ödeme').reduce((a,b)=>a+b.amount,0);
  const personnelExpense = filteredData.filter(t => ['Personel Maaşı', 'Personel Avans'].includes(t.category)).reduce((a,b)=>a+b.amount,0);
  const otherExpense = reportExpenseTotal - purchaseExpense - customerExpense - personnelExpense;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = itemsPerPage === -1 ? filteredData : filteredData.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (bankFormData.id) {
       setBankAccounts(bankAccounts.map(b => b.id === bankFormData.id ? { ...b, ...bankFormData } as BankAccount : b));
    } else {
       const newBank: BankAccount = {
           id: 'BANK-' + Math.random().toString(36).substr(2, 9),
           bankName: bankFormData.bankName || '',
           accountName: bankFormData.accountName || '',
           iban: bankFormData.iban || '',
           balance: Number(bankFormData.balance || 0)
       };
       setBankAccounts([...(bankAccounts || []), newBank]);
    }
    setIsBankModalOpen(false);
    setBankFormData({ bankName: '', accountName: '', iban: '', balance: 0 });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: CashTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      amount: Number(formData.amount)
    };
    
    // Update Kasa
    setCashTransactions([...cashTransactions, newTx]);
    
    // Update Cari if selected
    if (formData.customerId && ['Cari Tahsilat', 'Cari Ödeme', 'Satış', 'Alış'].includes(formData.category)) {
        const cariTxType = formData.type === 'Gelir' ? 'Tahsilat' : 'Ödeme';
        const cariAmount = formData.type === 'Gelir' ? -Number(formData.amount) : Number(formData.amount);
        
        const newCariTx = {
            id: Math.random().toString(36).substr(2, 9),
            customerId: formData.customerId,
            date: formData.date,
            type: cariTxType,
            amount: cariAmount,
            description: formData.description + ' (Kasa İşlemi)'
        };
        setTransactions([...transactions, newCariTx as any]);
        
        setCustomers(customers.map(c => 
            c.id === formData.customerId ? { ...c, balance: c.balance + cariAmount } : c
        ));
    }

    // Update Personnel if selected
    if (formData.personnelId && ['Personel Maaşı', 'Personel Avans'].includes(formData.category)) {
       const pToUpdate = personnel.find(p => p.id === formData.personnelId);
       if (pToUpdate) {
           const newRecord = {
               id: Math.random().toString(36).substr(2, 9),
               targetId: pToUpdate.id,
               date: formData.date,
               type: 'Not' as any,
               title: formData.category,
               description: formData.description + ' Tutarı: ' + Number(formData.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
           };
           setPersonnel(personnel.map(p => p.id === pToUpdate.id ? { ...p, records: [newRecord, ...p.records] } : p));
       }
    }

    // Update Bank Account Balance if applicable
    if (formData.accountId && formData.accountId !== 'KASA') {
       const bankToUpdate = bankAccounts.find(b => b.id === formData.accountId);
       if (bankToUpdate) {
          const amountChange = formData.type === 'Gelir' ? Number(formData.amount) : -Number(formData.amount);
          setBankAccounts(bankAccounts.map(b => b.id === bankToUpdate.id ? { ...b, balance: b.balance + amountChange } : b));
       }
    }
    
    setIsModalOpen(false);
  };

  const handlePrintClick = (tx: CashTransaction) => {
    import('../lib/printUtils').then(({ generateThermalReceiptHtml, printHtml }) => {
      const html = generateThermalReceiptHtml({
        storeName: settings?.companyName || 'ESİLA TİCARİ',
        storeAddress: settings?.address || '',
        storePhone: settings?.phone || '',
        taxOffice: settings?.taxOffice || '',
        taxNumber: settings?.taxNumber || '',
        companyLogo: settings?.companyLogo,
        date: new Date(tx.date).toLocaleString('tr-TR'),
        receiptNumber: tx.id,
        items: [{
          name: tx.category + ' (' + tx.description + ')',
          quantity: 1,
          price: tx.amount,
          total: tx.amount
        }],
        total: tx.amount,
        paymentMethod: tx.type === 'Gelir' ? 'Tahsilat' : 'Ödeme',
        footerText: settings?.printer_footer_text,
        headerText: settings?.printer_header_text,
        settings: settings
      });
      printHtml(html);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToExcel = () => {
    import('../lib/utils').then(({ exportToCSV }) => {
      const data = filteredTransactions.map(tx => ({
        'Tarih': new Date(tx.date).toLocaleDateString('tr-TR'),
        'İşlem Tipi': tx.type,
        'Kategori': tx.category,
        'Açıklama': tx.description,
        'Tutar': tx.amount
      }));
      exportToCSV(data, 'kasa_hareketleri');
    });
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Wallet size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
        <p>Kasa modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Finans ve Muhasebe</h2>
          <p className="text-gray-500 text-sm mt-1">Kasa, banka, çek, senet ve masraflarınızı yönetin.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'kasa' && (
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors border border-gray-200"
            >
              Dışa Aktar
            </button>
          )}
          {canCreate && activeTab === 'kasa' && (
            <button 
              onClick={() => {
                setFormData({
                  date: new Date().toISOString().split('T')[0],
                  type: 'Gelir',
                  category: 'Diğer Gelir',
                  amount: 0,
                  description: ''
                });
                setIsModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Yeni İşlem</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex space-x-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('kasa')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'kasa' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Kasa Hareketleri
        </button>
        <button
          onClick={() => setActiveTab('banka')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'banka' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Banka Hesapları
        </button>
        <button
          onClick={() => setActiveTab('cek_senet')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'cek_senet' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Çek ve Senet
        </button>
        <button
          onClick={() => setActiveTab('masraf')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'masraf' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Gider/Masraf Takibi
        </button>
      </div>

      {activeTab === 'kasa' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Wallet size={120} />
          </div>
          <p className="text-gray-500 font-medium mb-2 relative z-10">Güncel Kasa Bakiyesi</p>
          <h3 className={`text-4xl font-bold relative z-10 ${totalBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {totalBalance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </h3>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
               <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-gray-500 font-medium text-xs">Genel Toplam Gelir</p>
              <h4 className="text-lg font-bold text-gray-800">{totalIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</h4>
            </div>
          </div>
          <div className="text-xs text-gray-500 space-y-1 pl-14">
            <div className="flex justify-between"><span>Satışlar:</span> <span className="font-medium text-gray-800">{salesIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
            <div className="flex justify-between"><span>Cari Tahsilat:</span> <span className="font-medium text-gray-800">{customerIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
            <div className="flex justify-between"><span>Diğer Gelirler:</span> <span className="font-medium text-gray-800">{otherIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
               <TrendingDown size={20} />
            </div>
            <div>
              <p className="text-gray-500 font-medium text-xs">Genel Toplam Gider</p>
              <h4 className="text-lg font-bold text-gray-800">{totalExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</h4>
            </div>
          </div>
          <div className="text-xs text-gray-500 space-y-1 pl-14">
            <div className="flex justify-between"><span>Ürün Alış:</span> <span className="font-medium text-gray-800">{purchaseExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
            <div className="flex justify-between"><span>Cari Ödeme:</span> <span className="font-medium text-gray-800">{customerExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
            <div className="flex justify-between"><span>Personel:</span> <span className="font-medium text-gray-800">{personnelExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
            <div className="flex justify-between"><span>Diğer Giderler:</span> <span className="font-medium text-gray-800">{otherExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="İşlem ara..." 
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <div className="relative flex-1 sm:w-48">
               <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
               <select
                 value={dateFilter}
                 onChange={e => setDateFilter(e.target.value as any)}
                 className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm appearance-none bg-white font-medium text-gray-700"
               >
                 <option value="all">Tüm Zamanlar</option>
                 <option value="today">Bugün</option>
                 <option value="this_week">Bu Hafta</option>
                 <option value="this_month">Bu Ay</option>
               </select>
             </div>
             <button
               onClick={() => setReportPrintModalOpen(true)}
               className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors shadow-sm font-medium shrink-0"
             >
               <FileText size={18} className="text-emerald-600" />
               <span className="hidden sm:inline">A4 Rapor</span>
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
              <tr>
                <th className="px-6 py-4">Tarih</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Açıklama</th>
                <th className="px-6 py-4">İşlem Türü</th>
                <th className="px-6 py-4 text-right">Tutar</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    İşlem bulunamadı.
                  </td>
                </tr>
              ) : (
                paginatedData.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(tx.date).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{tx.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{tx.description}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tx.type === 'Gelir' ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-semibold ${tx.type === 'Gelir' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'Gelir' ? '+' : '-'}{tx.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handlePrintClick(tx)}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Yazdır"
                      >
                        <Printer size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={filteredData.length}
        />
      </div>

      {isBankModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
               <h3 className="font-bold text-lg text-gray-800">{bankFormData.id ? 'Banka Hesabı Düzenle' : 'Yeni Banka Hesabı'}</h3>
               <button onClick={() => setIsBankModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                 <X size={24} />
               </button>
            </div>
            <form onSubmit={handleSaveBank} className="p-4 sm:p-6 space-y-4">
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Banka Adı</label>
                 <input 
                   required type="text"
                   value={bankFormData.bankName}
                   onChange={e => setBankFormData({...bankFormData, bankName: e.target.value})}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                   placeholder="Örn: Garanti BBVA"
                 />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Hesap Adı</label>
                 <input 
                   required type="text"
                   value={bankFormData.accountName}
                   onChange={e => setBankFormData({...bankFormData, accountName: e.target.value})}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                   placeholder="Örn: Ana Hesap (TL)"
                 />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                 <input 
                   type="text"
                   value={bankFormData.iban}
                   onChange={e => setBankFormData({...bankFormData, iban: e.target.value})}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                   placeholder="TR00 0000..."
                 />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Bakiyesi (₺)</label>
                 <input 
                   required type="number" step="0.01"
                   value={bankFormData.balance}
                   onChange={e => setBankFormData({...bankFormData, balance: Number(e.target.value)})}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                 />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsBankModalOpen(false)} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save size={18} /> Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
               <h3 className="font-bold text-lg text-gray-800">Yeni İşlem</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                 <X size={24} />
               </button>
            </div>
            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Türü</label>
                 <select 
                   value={formData.type}
                   onChange={e => setFormData({...formData, type: e.target.value as 'Gelir'|'Gider', category: e.target.value === 'Gelir' ? 'Diğer Gelir' : 'Diğer Gider'})}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                 >
                   <option value="Gelir">Gelir</option>
                   <option value="Gider">Gider</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Hesap Seçimi</label>
                 <select 
                   value={formData.accountId}
                   onChange={e => setFormData({...formData, accountId: e.target.value})}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                 >
                   <option value="KASA">Nakit Kasa</option>
                   {bankAccounts.map(b => (
                     <option key={b.id} value={b.id}>{b.bankName} - {b.accountName}</option>
                   ))}
                 </select>
              </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                 <select 
                   value={formData.category}
                   onChange={e => setFormData({...formData, category: e.target.value as CashTransaction['category']})}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                 >
                   {formData.type === 'Gelir' ? (
                     <>
                       <option value="Cari Tahsilat">Cari Tahsilat</option>
                       <option value="Diğer Gelir">Diğer Gelir</option>
                       <option value="Satış">Satış</option>
                     </>
                   ) : (
                     <>
                       <option value="Cari Ödeme">Cari Ödeme</option>
                       <option value="Diğer Gider">Diğer Gider</option>
                       <option value="Alış">Alış (Gider)</option>
                       <option value="Fatura Ödemesi">Fatura Ödemesi</option>
                       <option value="Personel Maaşı">Personel Maaşı</option>
                       <option value="Personel Avans">Personel Avans</option>
                     </>
                   )}
                 </select>
              </div>
              
              {['Cari Tahsilat', 'Cari Ödeme', 'Satış', 'Alış'].includes(formData.category) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cari Seç</label>
                    <select
                      value={formData.customerId}
                      onChange={e => setFormData({...formData, customerId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      <option value="">Cari Seçiniz...</option>
                      {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                      ))}
                    </select>
                  </div>
              )}

              {['Personel Maaşı', 'Personel Avans'].includes(formData.category) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Personel Seç</label>
                    <select
                      value={formData.personnelId}
                      onChange={e => setFormData({...formData, personnelId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      <option value="">Personel Seçiniz...</option>
                      {personnel.filter(p => p.employmentStatus === 'Aktif').map(p => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastName} - {p.department}</option>
                      ))}
                    </select>
                  </div>
              )}

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                 <input 
                   required type="date"
                   value={formData.date}
                   onChange={e => setFormData({...formData, date: e.target.value})}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                 />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺)</label>
                 <input 
                   required type="number" step="0.01" min="0.01"
                   value={formData.amount}
                   onChange={e => setFormData({...formData, amount: e.target.value as any})}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                   placeholder="0.00"
                 />
              </div>
              <div>
                 <div className="flex justify-between items-center mb-1">
                   <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                   {supported && (
                     <button
                       type="button"
                       onClick={() => startListening('kasaDescription', (text) => setFormData(prev => ({ ...prev, description: prev.description ? `${prev.description} ${text}` : text })))}
                       className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${
                         isListening && activeSpeechField === 'kasaDescription' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                       }`}
                       title={isListening && activeSpeechField === 'kasaDescription' ? 'Dinlemeyi Durdur' : 'Sesle Yazdır'}
                     >
                       {isListening && activeSpeechField === 'kasaDescription' ? <MicOff size={16} /> : <Mic size={16} />}
                     </button>
                   )}
                 </div>
                 <input 
                   required type="text"
                   value={formData.description}
                   onChange={e => setFormData({...formData, description: e.target.value})}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                   placeholder="İşlem detayı..."
                 />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Save size={18} />
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printModalOpen && selectedTxForPrint && (
        <div className="fixed inset-0 bg-gray-500/75 z-50 flex items-start justify-center p-4 sm:p-4 sm:p-6 shadow-2xl backdrop-blur-sm overflow-y-auto print:bg-white print:p-0 print:m-0 animate-fade-in print:block">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-lg mb-8 print:shadow-none print:max-w-full print:m-0 print:rounded-none">
            {/* Modal Header - Hidden on Print */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl no-print">
              <div className="flex items-center gap-3">
                <Printer className="text-gray-400" />
                <h3 className="text-lg font-bold text-gray-800">Tahsilat/Ödeme Makbuzu Yazdır</h3>
              </div>
              <button onClick={() => setPrintModalOpen(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                 <X size={24} />
              </button>
            </div>

            {/* Print Content - 80mm format layout */}
            <div className="p-4 md:p-8 print:p-0">
               <div className="print-only">
                 <div className="max-w-[300px] mx-auto text-sm">
                    <div className="text-center mb-6">
                      {settings.companyLogo ? (
                        <img src={settings.companyLogo} alt="Logo" className="max-h-16 object-contain mx-auto mb-2" />
                      ) : (
                        <h1 className="font-logo text-4xl mb-2 text-black">{settings.printer_header_text || 'esila'}</h1>
                      )}
                      <p className="text-xs font-medium">{settings.companyName}</p>
                      <p className="text-xs whitespace-pre-line">{settings.address}</p>
                      {settings.taxOffice && settings.taxNumber && (
                        <p className="text-xs mt-1">{settings.taxOffice} - VKN: {settings.taxNumber}</p>
                      )}
                    </div>
                    
                    <div className="border-b border-black my-4"></div>
                    
                    <div className="mb-4 text-sm">
                      <p><strong>Tarih:</strong> {new Date(selectedTxForPrint.date).toLocaleDateString('tr-TR')}</p>
                      <p><strong>İşlem No:</strong> {selectedTxForPrint.id}</p>
                      <p><strong>Tür:</strong> {selectedTxForPrint.category}</p>
                    </div>

                    <div className="border-b border-black my-4"></div>

                    <div className="mb-4 text-sm">
                       <p className="font-bold border-b border-dashed border-gray-300 pb-2 mb-2">Açıklama</p>
                       <p>{selectedTxForPrint.description}</p>
                    </div>
                    
                    <div className="border-b border-black my-4"></div>
                    
                    <div className="flex justify-between font-bold text-base mt-2">
                       <span>{selectedTxForPrint.type} Tutarı ({selectedTxForPrint.type === 'Gelir' ? 'Tahsilat' : 'Ödeme'}):</span>
                       <span>{selectedTxForPrint.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                    
                    <div className="text-center text-xs text-gray-500 mt-8">
                       <p className="whitespace-pre-line">{settings.printer_footer_text}</p>
                    </div>
                 </div>
               </div>

               {/* Preview Content (visible only on screen) */}
               <div className="no-print bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200">
                  <div className="max-w-[300px] mx-auto bg-white p-4 sm:p-6 shadow-sm border border-gray-100">
                    <div className="text-center mb-6">
                      {settings.companyLogo ? (
                        <img src={settings.companyLogo} alt="Logo" className="max-h-16 object-contain mx-auto mb-2" />
                      ) : (
                        <h1 className="font-logo text-4xl mb-2 text-emerald-900">{settings.printer_header_text || 'esila'}</h1>
                      )}
                      <p className="text-xs text-gray-500 font-medium">{settings.companyName}</p>
                      <p className="text-xs text-gray-500 whitespace-pre-line">{settings.address}</p>
                    </div>
                    
                    <div className="border-b-2 border-dashed border-gray-300 my-4"></div>
                    
                    <div className="mb-4 text-sm">
                      <p><strong>Tarih:</strong> {new Date(selectedTxForPrint.date).toLocaleDateString('tr-TR')}</p>
                      <p><strong>Tür:</strong> {selectedTxForPrint.category}</p>
                    </div>
                    
                    <div className="border-b-2 border-dashed border-gray-300 my-4"></div>
                    
                     <div className="mb-4 text-sm">
                       <p className="font-bold border-b border-dashed border-gray-300 pb-2 mb-2">Açıklama</p>
                       <p>{selectedTxForPrint.description}</p>
                    </div>
                    
                    <div className="border-b border-gray-300 my-4"></div>
                    
                    <div className="flex justify-between font-bold text-lg mt-2">
                       <span>{selectedTxForPrint.type} Tutarı:</span>
                       <span className={selectedTxForPrint.type === 'Gelir' ? 'text-emerald-600' : 'text-red-600'}>
                         {selectedTxForPrint.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                       </span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Modal Footer - Hidden on Print */}
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl no-print">
               <button 
                 onClick={() => setPrintModalOpen(false)}
                 className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
               >
                 İptal
               </button>
               <button 
                 onClick={handlePrint}
                 className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
               >
                 <Printer size={18} />
                 Yazdır (80mm)
               </button>
            </div>
          </div>
        </div>
      )}

      {/* A4 Report Print Modal */}
      {reportPrintModalOpen && (
        <div className="fixed inset-0 bg-gray-500/75 z-50 flex items-start justify-center p-4 sm:p-4 sm:p-6 shadow-2xl backdrop-blur-sm overflow-y-auto print:bg-white print:p-0 print:m-0 animate-fade-in print:block">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-4xl mb-8 print:shadow-none print:max-w-full print:m-0 print:rounded-none">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl no-print">
              <div className="flex items-center gap-3">
                <FileText className="text-gray-400" />
                <h3 className="text-lg font-bold text-gray-800">Kasa Raporu Yazdır (A4)</h3>
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
                <button onClick={() => setReportPrintModalOpen(false)} className="text-gray-500 hover:text-gray-700 transition-colors p-2">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Print Content - A4 Document Format */}
            <div className="p-8 md:p-12 print:p-4 print:text-black font-sans bg-white">
              <div className="flex justify-between items-start mb-8 border-b-2 pb-6" style={{ borderColor: settings?.invoiceTemplate_color || '#1f2937' }}>
                <div>
                  <h1 className="text-3xl font-bold mb-2" style={{ color: settings?.invoiceTemplate_color || '#111827' }}>KASA RAPORU</h1>
                  <p className="text-gray-600 print:text-black">
                    Tarih Aralığı: {
                      dateFilter === 'all' ? 'Tüm Zamanlar' : 
                      dateFilter === 'today' ? 'Bugün' : 
                      dateFilter === 'this_week' ? 'Bu Hafta' : 'Bu Ay'
                    }
                  </p>
                  <p className="text-gray-500 text-sm print:text-black mt-1">
                    Çıktı Tarihi: {new Date().toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="text-right">
                  {settings.companyLogo ? (
                    <img src={settings.companyLogo} alt="Logo" className="max-h-20 object-contain ml-auto mb-2" />
                  ) : (
                    <h2 className="font-logo text-3xl font-bold mb-2" style={{ color: settings?.invoiceTemplate_color || '#065f46' }}>{settings.printer_header_text || 'esila'}</h2>
                  )}
                  <p className="text-sm font-medium" style={{ color: settings?.invoiceTemplate_color || '#4b5563' }}>{settings.companyName}</p>
                </div>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="p-4 rounded-lg border print:bg-transparent" style={{ borderColor: settings?.invoiceTemplate_color || '#e5e7eb', backgroundColor: '#f9fafb' }}>
                  <p className="text-sm border-b pb-1 font-medium mb-1" style={{ borderColor: settings?.invoiceTemplate_color || '#e5e7eb', color: settings?.invoiceTemplate_color || '#6b7280' }}>Toplam Gelir</p>
                  <p className="text-2xl font-bold text-emerald-600 print:text-black">
                    {reportIncomeTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </p>
                </div>
                <div className="p-4 rounded-lg border print:bg-transparent" style={{ borderColor: settings?.invoiceTemplate_color || '#e5e7eb', backgroundColor: '#f9fafb' }}>
                  <p className="text-sm border-b pb-1 font-medium mb-1" style={{ borderColor: settings?.invoiceTemplate_color || '#e5e7eb', color: settings?.invoiceTemplate_color || '#6b7280' }}>Toplam Gider</p>
                  <p className="text-2xl font-bold text-red-600 print:text-black">
                    {reportExpenseTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </p>
                </div>
                <div className="p-4 rounded-lg border print:bg-transparent" style={{ borderColor: settings?.invoiceTemplate_color || '#d1d5db', backgroundColor: '#f3f4f6' }}>
                  <p className="text-sm border-b pb-1 font-bold mb-1" style={{ borderColor: settings?.invoiceTemplate_color || '#d1d5db', color: settings?.invoiceTemplate_color || '#4b5563' }}>Net Bakiye</p>
                  <p className={`text-2xl font-bold ${reportBalance >= 0 ? 'text-emerald-700' : 'text-red-700'} print:text-black`}>
                    {reportBalance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </p>
                </div>
              </div>

              {/* Detail Breakdown */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-bold print:text-black mb-3 border-b pb-2" style={{ borderBottomColor: settings?.invoiceTemplate_color || '#e5e7eb', color: settings?.invoiceTemplate_color || '#1f2937' }}>Gelir Kırılımı</h3>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                      <tr>
                        <td className="py-2 text-gray-600 print:text-black">Satış Gelirleri</td>
                        <td className="py-2 text-right font-medium">{salesIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600 print:text-black">Cari Tahsilatlar</td>
                        <td className="py-2 text-right font-medium">{customerIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600 print:text-black">Diğer Gelirler</td>
                        <td className="py-2 text-right font-medium">{otherIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 print:text-black mb-3 border-b pb-2">Gider Kırılımı</h3>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                      <tr>
                        <td className="py-2 text-gray-600 print:text-black">Ürün Alışları</td>
                        <td className="py-2 text-right font-medium">{purchaseExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600 print:text-black">Cari Ödemeler</td>
                        <td className="py-2 text-right font-medium">{customerExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600 print:text-black">Personel Giderleri</td>
                        <td className="py-2 text-right font-medium">{personnelExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600 print:text-black">Diğer Giderler</td>
                        <td className="py-2 text-right font-medium">{otherExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transactions List */}
              <div className="mb-4">
                <h3 className="font-bold text-gray-800 print:text-black mb-4">İşlem Detayları ({filteredData.length} İşlem)</h3>
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 print:bg-gray-200 text-gray-800 print:text-black font-semibold">
                      <th className="p-3 border border-gray-200 print:border-gray-400">Tarih</th>
                      <th className="p-3 border border-gray-200 print:border-gray-400">Tür</th>
                      <th className="p-3 border border-gray-200 print:border-gray-400">Kategori</th>
                      <th className="p-3 border border-gray-200 print:border-gray-400 w-1/3">Açıklama</th>
                      <th className="p-3 border border-gray-200 print:border-gray-400 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map(tx => (
                      <tr key={tx.id} className="border-b border-gray-200 print:border-gray-300">
                        <td className="p-3 border-x border-gray-200 print:border-gray-300 text-gray-600 print:text-black whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="p-3 border-x border-gray-200 print:border-gray-300">
                          <span className={`font-medium ${tx.type === 'Gelir' ? 'text-emerald-700 print:text-black' : 'text-red-700 print:text-black'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-3 border-x border-gray-200 print:border-gray-300 text-gray-800 print:text-black">
                          {tx.category}
                        </td>
                        <td className="p-3 border-x border-gray-200 print:border-gray-300 text-gray-800 print:text-black text-xs">
                          {tx.description}
                        </td>
                        <td className={`p-3 border-x border-gray-200 print:border-gray-300 text-right font-bold whitespace-nowrap ${tx.type === 'Gelir' ? 'text-emerald-700 print:text-black' : 'text-red-700 print:text-black'}`}>
                          {tx.type === 'Gelir' ? '+' : '-'}{tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                      </tr>
                    ))}
                    {filteredData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-500 border border-gray-200">
                          Seçilen kriterlere uygun işlem bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-12 text-center text-xs text-gray-400 print:text-gray-500 border-t pt-4">
                Bu rapor otomatik olarak oluşturulmuştur.
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {activeTab === 'banka' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Banka Hesapları</h3>
            <button onClick={() => { setBankFormData({ bankName: '', accountName: '', iban: '', balance: 0 }); setIsBankModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2">
              <Plus size={18} /> Yeni Banka Hesabı
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {bankAccounts && bankAccounts.map(account => (
                <div key={account.id} className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                     <Wallet size={80} />
                   </div>
                   <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="text-gray-400 hover:text-blue-600 bg-white shadow-sm rounded p-1" onClick={() => { setBankFormData(account); setIsBankModalOpen(true); }}>
                        Düzenle
                     </button>
                     <button className="text-gray-400 hover:text-red-600 bg-white shadow-sm rounded p-1" onClick={() => {
                        if (confirm('Banka hesabını silmek istediğinize emin misiniz?')) {
                            setBankAccounts(bankAccounts.filter(b => b.id !== account.id));
                        }
                     }}>
                        Sil
                     </button>
                   </div>
                   <h4 className="font-bold text-lg text-gray-800 pr-16">{account.bankName}</h4>
                   <p className="text-gray-500 text-sm mb-4">{account.accountName}</p>
                   <p className="font-mono text-sm text-gray-600 mb-4">{account.iban}</p>
                   <div className="flex justify-between items-end border-t pt-4">
                      <div>
                         <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Güncel Bakiye</p>
                         <p className={`text-2xl font-bold ${account.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {account.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                         </p>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'cek_senet' && (
        <CekSenet />
      )}

      {activeTab === 'masraf' && (
        <div className="space-y-6 animate-in fade-in">
           <div className="flex justify-between items-center">
             <h3 className="text-xl font-bold text-gray-800">Masraf ve Gider Takibi</h3>
             <button 
               onClick={() => {
                 setFormData({
                   date: new Date().toISOString().split('T')[0],
                   type: 'Gider',
                   category: 'Diğer Gider',
                   amount: '',
                   description: '',
                   customerId: '',
                   personnelId: ''
                 });
                 setIsModalOpen(true);
               }}
               className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
             >
               <Plus size={18} /> Yeni Masraf Fişi
             </button>
           </div>
           
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead>
                 <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                   <th className="p-4">Tarih</th>
                   <th className="p-4">Kategori</th>
                   <th className="p-4 w-1/2">Açıklama</th>
                   <th className="p-4 text-right">Tutar</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {cashTransactions.filter(tx => tx.type === 'Gider').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                   <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="p-4 text-gray-600 whitespace-nowrap">{new Date(tx.date).toLocaleDateString('tr-TR')}</td>
                     <td className="p-4">
                       <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                         {tx.category}
                       </span>
                     </td>
                     <td className="p-4 text-gray-800">{tx.description}</td>
                     <td className="p-4 text-right font-bold text-red-600 whitespace-nowrap">
                       -{tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                     </td>
                   </tr>
                 ))}
                 {cashTransactions.filter(tx => tx.type === 'Gider').length === 0 && (
                   <tr>
                     <td colSpan={4} className="p-8 text-center text-gray-500">
                       Kayıtlı masraf/gider bulunamadı.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

    </div>
  );
};
