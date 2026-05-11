import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Plus, Search, TrendingUp, TrendingDown, Wallet, X, Save } from 'lucide-react';
import { CashTransaction } from '../types';

export const Kasa: React.FC = () => {
  const { cashTransactions, setCashTransactions, customers, setCustomers, transactions, setTransactions, personnel, setPersonnel } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    date: string;
    type: 'Gelir' | 'Gider';
    category: CashTransaction['category'];
    amount: number | '';
    description: string;
    customerId?: string;
    personnelId?: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    type: 'Gelir',
    category: 'Diğer Gelir',
    amount: '',
    description: '',
    customerId: '',
    personnelId: ''
  });

  const totalIncome = cashTransactions.filter(t => t.type === 'Gelir').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = cashTransactions.filter(t => t.type === 'Gider').reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  const filteredData = cashTransactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
    
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Kasa Hareketleri</h2>
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
          <span>Yeni İşlem</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Wallet size={120} />
          </div>
          <p className="text-gray-500 font-medium mb-2 relative z-10">Güncel Kasa Bakiyesi</p>
          <h3 className={`text-4xl font-bold relative z-10 ${totalBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {totalBalance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </h3>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 flex items-center gap-4">
          <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
             <TrendingUp size={32} />
          </div>
          <div>
            <p className="text-gray-500 font-medium text-sm">Toplam Gelir</p>
            <h4 className="text-2xl font-bold text-gray-800">{totalIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</h4>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 flex items-center gap-4">
          <div className="h-14 w-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
             <TrendingDown size={32} />
          </div>
          <div>
            <p className="text-gray-500 font-medium text-sm">Toplam Gider</p>
            <h4 className="text-2xl font-bold text-gray-800">{totalExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</h4>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="İşlem ara..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    İşlem bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredData.map(tx => (
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
               <h3 className="font-bold text-lg text-gray-800">Yeni İşlem</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                 <X size={24} />
               </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
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
                      {personnel.map(p => (
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
                 <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
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
    </div>
  );
};
