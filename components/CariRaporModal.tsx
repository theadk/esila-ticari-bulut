import React, { useState, useEffect } from 'react';
import { X, Printer, FileText, ShoppingCart, CreditCard, Activity, CheckCircle, TrendingUp, Calendar } from 'lucide-react';
import { Customer, Order, Proposal, CustomerTransaction, ServiceTicket, Reconciliation } from '../types';
import { useAppStore } from '../lib/store';
import { apiFetch } from '../lib/api';

interface CariRaporModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export const CariRaporModal: React.FC<CariRaporModalProps> = ({ isOpen, onClose, customer }) => {
  const store = useAppStore();
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      setLoading(true);
      apiFetch('/api/reconciliations')
        .then(res => res.json())
        .then(data => {
          setReconciliations(data.filter((r: Reconciliation) => r.customerId === customer.id));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const orders = store.orders.filter(o => o.customerId === customer.id);
  const proposals = store.proposals.filter(p => p.customerId === customer.id);
  const transactions = store.transactions.filter(t => t.customerId === customer.id);
  const tickets = store.serviceTickets.filter(t => t.customerId === customer.id);

  // Summaries
  const totalOrderAmount = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalProposalAmount = proposals.reduce((sum, p) => sum + (p.total || 0), 0);
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 sm:p-6 animate-fade-in print:bg-white print:p-0 print:block">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col print:shadow-none print:max-w-full print:rounded-none print:h-auto overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Cari Raporu</h2>
            <p className="text-gray-500 mt-1">{customer.companyName || customer.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors font-medium"
            >
              <Printer size={18} />
              <span className="hidden sm:inline">Yazdır</span>
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block p-8 border-b-2 border-gray-800 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">{store.settings.companyName || 'ESİLA TİCARİ'}</h1>
              <h2 className="text-xl text-gray-700">Kapsamlı Cari Raporu</h2>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{customer.companyName || customer.name}</p>
              <p className="text-sm mt-1">Telefon: {customer.phone || '-'}</p>
              <p className="text-sm">Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-gray-50/30 print:bg-white print:p-0">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm print:border-gray-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg print:bg-transparent print:p-0"><FileText size={20} /></div>
                <h3 className="font-semibold text-gray-700">Teklifler</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{proposals.length}</p>
              <p className="text-sm text-gray-500 mt-1">Toplam: {totalProposalAmount.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm print:border-gray-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg print:bg-transparent print:p-0"><ShoppingCart size={20} /></div>
                <h3 className="font-semibold text-gray-700">Siparişler</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-sm text-gray-500 mt-1">Toplam: {totalOrderAmount.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm print:border-gray-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg print:bg-transparent print:p-0"><Activity size={20} /></div>
                <h3 className="font-semibold text-gray-700">Arıza & Servis</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
              <p className="text-sm text-gray-500 mt-1">Kayıtlı işlem</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm print:border-gray-300">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg print:bg-transparent print:p-0 ${customer.balance >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  <TrendingUp size={20} />
                </div>
                <h3 className="font-semibold text-gray-700">Güncel Bakiye</h3>
              </div>
              <p className={`text-2xl font-bold ${customer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {customer.balance.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}
              </p>
              <p className="text-sm text-gray-500 mt-1">{customer.balance >= 0 ? 'Alacaklısınız' : 'Borçlusunuz'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:space-y-8">
            
            {/* Teklifler Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:mb-8">
              <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center gap-2 print:bg-white print:border-b-2">
                <FileText className="text-gray-500" size={18} />
                <h3 className="font-semibold text-gray-800">Son Teklifler</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50/50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-5 py-3">Tarih</th>
                      <th className="px-5 py-3">Durum</th>
                      <th className="px-5 py-3 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {proposals.length > 0 ? proposals.slice(0, 5).map(p => (
                      <tr key={p.id}>
                        <td className="px-5 py-3 text-gray-600">{new Date(p.date).toLocaleDateString('tr-TR')}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{p.status}</span>
                        </td>
                        <td className="px-5 py-3 text-right font-medium">{p.total?.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Siparişler Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:mb-8">
              <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center gap-2 print:bg-white print:border-b-2">
                <ShoppingCart className="text-gray-500" size={18} />
                <h3 className="font-semibold text-gray-800">Son Siparişler</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50/50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-5 py-3">Tarih</th>
                      <th className="px-5 py-3">Durum</th>
                      <th className="px-5 py-3 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.length > 0 ? orders.slice(0, 5).map(o => (
                      <tr key={o.id}>
                        <td className="px-5 py-3 text-gray-600">{new Date(o.date).toLocaleDateString('tr-TR')}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{o.status}</span>
                        </td>
                        <td className="px-5 py-3 text-right font-medium">{o.total?.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Arıza & Servis Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:mb-8">
              <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center gap-2 print:bg-white print:border-b-2">
                <Activity className="text-gray-500" size={18} />
                <h3 className="font-semibold text-gray-800">Son Arıza/Servis Kayıtları</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50/50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-5 py-3">Tarih</th>
                      <th className="px-5 py-3">Konu / Cihaz</th>
                      <th className="px-5 py-3">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tickets.length > 0 ? tickets.slice(0, 5).map(t => (
                      <tr key={t.id}>
                        <td className="px-5 py-3 text-gray-600">{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                        <td className="px-5 py-3 text-gray-800 max-w-[150px] truncate">{t.deviceInfo || 'Belirtilmedi'}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{t.status}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mutabakatlar Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:mb-8">
              <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center gap-2 print:bg-white print:border-b-2">
                <CheckCircle className="text-gray-500" size={18} />
                <h3 className="font-semibold text-gray-800">Mutabakat Kayıtları</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50/50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-5 py-3">Tarih</th>
                      <th className="px-5 py-3 text-right">Bakiye</th>
                      <th className="px-5 py-3">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-500">Yükleniyor...</td></tr>
                    ) : reconciliations.length > 0 ? reconciliations.slice(0, 5).map(r => (
                      <tr key={r.id}>
                        <td className="px-5 py-3 text-gray-600">{new Date(r.date).toLocaleDateString('tr-TR')}</td>
                        <td className="px-5 py-3 text-right font-medium">
                          {r.balance.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})} 
                          <span className="text-xs text-gray-500 ml-1">({r.balanceType})</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{r.status}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Ödemeler / Hesap Hareketleri Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:mb-8">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center gap-2 print:bg-white print:border-b-2">
              <CreditCard className="text-gray-500" size={18} />
              <h3 className="font-semibold text-gray-800">Son 10 Hesap Hareketi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-5 py-3">Tarih</th>
                    <th className="px-5 py-3">İşlem Türü</th>
                    <th className="px-5 py-3">Açıklama</th>
                    <th className="px-5 py-3 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.length > 0 ? [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map(tx => (
                    <tr key={tx.id}>
                      <td className="px-5 py-3 text-gray-600">{new Date(tx.date).toLocaleDateString('tr-TR')}</td>
                      <td className="px-5 py-3">
                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.type === 'Satış' || tx.type === 'Alış' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                           {tx.type}
                         </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{tx.description || '-'}</td>
                      <td className={`px-5 py-3 text-right font-medium ${tx.type === 'Satış' || tx.type === 'Alış' ? 'text-red-700' : 'text-emerald-700'}`}>
                        {tx.amount.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-500">Hesap hareketi bulunamadı.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
