import React, { useMemo, useState, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { TrendingUp, TrendingDown, DollarSign, Download, Printer, AlertCircle, PackageX, Calendar } from 'lucide-react';
import { OrderStatus, Product } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { hasPermission } from '../lib/permissions';

export const Raporlar: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === sessionStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'raporlar', 'view');

  const [activeTab, setActiveTab] = useState<'karlilik' | 'cariler' | 'siparisler' | 'stoklar' | 'finans' | 'uretim' | 'ik' | 'crm'>('finans');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { dailySales, dailyCollections } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTransactions = (store.transactions || []).filter(t => t.date === todayStr);
    
    const sales = todayTransactions
      .filter(t => t.type === 'Satış')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const collections = todayTransactions
      .filter(t => t.type === 'Tahsilat')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    return { dailySales: sales, dailyCollections: collections };
  }, [store.transactions]);

  const financialForecast = useMemo(() => {
     const today = new Date();
     today.setHours(0,0,0,0);
     const next30Days = new Date(today);
     next30Days.setDate(next30Days.getDate() + 30);
     
     let expectedCollections = 0;
     let expectedPayments = 0;

     (store.reminderNotes || []).forEach(note => {
        if (!note.isCompleted) {
           const noteDate = new Date(note.date);
           if (noteDate >= today && noteDate <= next30Days) {
              if (note.type === 'Tahsilat' && note.amount) {
                 expectedCollections += note.amount;
              } else if (note.type === 'Ödeme' && note.amount) {
                 expectedPayments += note.amount;
              }
           }
        }
     });

     return {
        collections: expectedCollections,
        payments: expectedPayments,
        net: expectedCollections - expectedPayments
     };
  }, [store.reminderNotes]);

  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;

    // Sadece tamamlanmış ve kargolanmış siparişlerin kârı hesaplanır
    const completedOrders = store.orders.filter(o => 
      o.status === OrderStatus.COMPLETED || o.status === OrderStatus.SHIPPED
    );

    completedOrders.forEach(order => {
      totalRevenue += (order.total || (order as any).totalAmount || 0);

      order.items.forEach(item => {
        // Find product to get purchase price
        const product = store.products.find(p => p.id === item.productId);
        let purchasePrice = 0;
        if (product && product.purchasePrice !== undefined) {
            purchasePrice = product.purchasePrice;
        } else {
            purchasePrice = 0; 
        }
        totalCost += (purchasePrice * item.quantity);
      });
    });

    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCost, netProfit, profitMargin };
  }, [store.orders, store.products]);

  const getProductTotalStockMemo = (p: Product) => {
    if (p.warehouseStocks && p.warehouseStocks.length > 0) {
      return p.warehouseStocks.reduce((sum, w) => sum + (Number(w.stock) || 0), 0);
    }
    return Number(p.stock) || 0;
  };

  // Derived Data
  const outOfStockProducts = useMemo(() => store.products.filter(p => getProductTotalStockMemo(p) <= 0), [store.products]);
  
  const inactiveProducts = useMemo(() => {
    const orderedProductIds = new Set(store.orders.flatMap(o => o.items.map(i => i.productId)));
    return store.products.filter(p => !orderedProductIds.has(p.id));
  }, [store.products, store.orders]);

  const customerBalances = useMemo(() => {
    return store.customers.map(c => ({
      name: c.companyName || c.name,
      type: c.type,
      balance: c.balance,
      balanceType: c.balance === 0 ? 'Yok' : (c.balance >= 0 ? 'Borç' : 'Alacak')
    }));
  }, [store.customers]);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // 1. Kârlılık Raporu
    const profitData = store.products.map(p => {
      const purchasePrice = p.purchasePrice || 0; 
      const unitProfit = p.price - purchasePrice;
      const margin = p.price > 0 ? (unitProfit / p.price) * 100 : 0;
      return {
        'Kodu': p.code,
        'Ürün Adı': p.name,
        'Alış Fiyatı': p.purchasePrice || 0,
        'Satış Fiyatı': p.price,
        'Birim Kâr': unitProfit,
        'Kâr Marjı (%)': margin.toFixed(2)
      };
    });
    const profitSheet = XLSX.utils.json_to_sheet(profitData);
    XLSX.utils.book_append_sheet(wb, profitSheet, "Karlilik_Raporu");

    // 2. Cari Raporu
    const customerSheet = XLSX.utils.json_to_sheet(customerBalances.map(c => ({
      'Cari Adı': c.name,
      'Tipi': c.type,
      'Bakiye Yönü': c.balanceType,
      'Bakiye Tutarı': Math.abs(c.balance)
    })));
    XLSX.utils.book_append_sheet(wb, customerSheet, "Cari_Bakiyeleri");

    // 3. Sipariş Raporu
    const orderData = store.orders.map(o => ({
      'Sipariş No': o.id,
      'Tarih': new Date(o.date).toLocaleDateString('tr-TR'),
      'Cari': o.customerName,
      'Tutar': o.total,
      'Durum': o.status
    }));
    const orderSheet = XLSX.utils.json_to_sheet(orderData);
    XLSX.utils.book_append_sheet(wb, orderSheet, "Siparisler");

    const getProductTotalStock = (p: Product) => {
      if (p.warehouseStocks && p.warehouseStocks.length > 0) {
        return p.warehouseStocks.reduce((sum, w) => sum + (Number(w.stock) || 0), 0);
      }
      return Number(p.stock) || 0;
    };

    // 4. Stok Raporu
    const stockData = store.products.map(p => {
      const ts = getProductTotalStock(p);
      return {
        'Kodu': p.code,
        'Ürün Adı': p.name,
        'Stok': ts,
        'Kategori': p.category,
        'Durum': ts <= 0 ? 'Tükendi' : ts < 10 ? 'Kritik' : 'Stokta',
        'Hareket': inactiveProducts.some(ip => ip.id === p.id) ? 'Hareketsiz' : 'Hareketli'
      };
    });
    const stockSheet = XLSX.utils.json_to_sheet(stockData);
    XLSX.utils.book_append_sheet(wb, stockSheet, "Stok Durumu");

    XLSX.writeFile(wb, "Sistem_Raporlari.xlsx");
  };

  const printReport = async () => {
    // Determine context. In iframes usually print behaves differently or gets blocked
    try {
      setIsGeneratingPdf(true);
      
      const element = printRef.current;
      if (!element) return;

      // Unhide the print-only header for rendering
      const headerElements = element.querySelectorAll('[class*="print:flex"]');
      headerElements.forEach(el => {
        (el as HTMLElement).style.display = 'flex';
      });

      // Hide the print:hidden elements
      const hiddenElements = element.querySelectorAll('[class*="print:hidden"]');
      hiddenElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      // Restore elements
      headerElements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });
      hiddenElements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Sistem_Raporu.pdf');
    } catch (error) {
      console.error('PDF oluşturulurken hata:', error);
      alert('PDF oluşturulurken bir hata oluştu. Açılır pencerelerin engellenmediğinden emin olun veya daha sonra tekrar deneyin.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
        <p>Raporlar modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div ref={printRef} className="space-y-6 print:m-0 print:p-0">
      <div className="hidden print:flex flex-col items-center justify-center mb-8 border-b-2 pb-4" style={{ borderColor: store.settings?.invoiceTemplate_color || '#10b981' }}>
        {store.settings?.companyLogo && (
          <img src={store.settings.companyLogo} alt="Logo" className="max-h-20 object-contain mb-2" />
        )}
        <h1 className="text-2xl font-bold" style={{ color: store.settings?.invoiceTemplate_color || '#10b981' }}>{store.settings?.companyName || 'Sistem Raporu'}</h1>
        <p className="text-sm text-gray-500">Rapor Tarihi: {new Date().toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sistem Raporları</h1>
          <p className="text-gray-500 text-sm mt-1">Detaylı işletme ve karar analizleri</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Download size={18} />
            <span>Excel'e Aktar</span>
          </button>
          <button disabled={isGeneratingPdf} onClick={printReport} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 disabled:cursor-wait text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
            <Printer size={18} />
            <span>{isGeneratingPdf ? 'Oluşturuluyor...' : 'Yazdır / PDF'}</span>
          </button>
        </div>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-lg gap-1 border border-gray-200 overflow-x-auto print:hidden">
        <button onClick={() => setActiveTab('finans')} className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'finans' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Nakit Akışı (Finans)</button>
        <button onClick={() => setActiveTab('karlilik')} className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'karlilik' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Kârlılık Analizi</button>
        <button onClick={() => setActiveTab('cariler')} className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'cariler' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Cari Bakiyeleri</button>
        <button onClick={() => setActiveTab('siparisler')} className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'siparisler' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Sipariş Raporu</button>
        <button onClick={() => setActiveTab('stoklar')} className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'stoklar' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Stok Raporları</button>
        <button onClick={() => setActiveTab('uretim')} className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'uretim' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Üretim Raporu</button>
        <button onClick={() => setActiveTab('ik')} className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'ik' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>İnsan Kaynakları</button>
        <button onClick={() => setActiveTab('crm')} className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'crm' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>CRM Performansı</button>
      </div>

      <div className="print:block">
        {/* Finans */}
        {(activeTab === 'finans') && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 hidden print:block mb-4">Nakit Akışı ve Finansal Beklentiler</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gün Sonu Özeti Paneli */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200 shadow-sm flex flex-col justify-center">
                  <h3 className="text-indigo-800 font-semibold mb-4 flex items-center gap-2">
                    <Calendar size={18} />
                    <span>Gün Sonu Özeti ({new Date().toLocaleDateString('tr-TR')})</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-50 flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                          <TrendingUp size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Günlük Ciro</p>
                          <p className="text-xl font-bold text-gray-900">{dailySales.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-50 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <DollarSign size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Tahsilat</p>
                          <p className="text-xl font-bold text-gray-900">{dailyCollections.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                        </div>
                    </div>
                  </div>
              </div>

              {/* 30 Günlük Finansal Beklenti */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-center">
                  <h3 className="text-emerald-800 font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp size={18} />
                    <span>Önümüzdeki 30 Günlük Finansal Beklentiler (Ajanda)</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-50 text-center">
                        <p className="text-xs font-medium text-gray-500 mb-1">Beklenen Tahsilat</p>
                        <p className="text-lg font-bold text-emerald-600">+{financialForecast.collections.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-50 text-center">
                        <p className="text-xs font-medium text-gray-500 mb-1">Beklenen Ödeme</p>
                        <p className="text-lg font-bold text-red-500">-{financialForecast.payments.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-50 text-center">
                        <p className="text-xs font-medium text-gray-500 mb-1">Net Nakit Akışı</p>
                        <p className={`text-lg font-bold ${financialForecast.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {financialForecast.net >= 0 ? '+' : ''}{financialForecast.net.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </p>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        )}

        {/* Kârlılık */}
        {(activeTab === 'karlilik') && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800 hidden print:block mb-4">Kârlılık Analizi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="text-gray-500 text-sm mb-2 flex items-center justify-between">
                <span>Toplam Ciro (Satışlar)</span>
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center print:hidden">
                  <DollarSign size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {metrics.totalRevenue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="text-gray-500 text-sm mb-2 flex items-center justify-between">
                <span>Satılan Ürün Maliyeti (SMM)</span>
                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center print:hidden">
                  <TrendingDown size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {metrics.totalCost.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="text-gray-500 text-sm mb-2 flex items-center justify-between">
                <span>Net Kâr</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center print:hidden ${metrics.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {metrics.netProfit.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="text-gray-500 text-sm mb-2 flex items-center justify-between">
                <span>Kâr Marjı</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center print:hidden ${metrics.profitMargin >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className={`text-2xl font-bold ${metrics.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                %{metrics.profitMargin.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Ürün Bazlı Kârlılık (Tahmini)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                  <tr>
                    <th className="py-3 px-4 rounded-tl-lg border-b">Kodu</th>
                    <th className="py-3 px-4 border-b">Ürün Adı</th>
                    <th className="py-3 px-4 text-right border-b">Alış Fiyatı</th>
                    <th className="py-3 px-4 text-right border-b">Satış Fiyatı</th>
                    <th className="py-3 px-4 text-right border-b">Birim Net Kâr</th>
                    <th className="py-3 px-4 text-right border-b">Birim Kâr Marjı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {store.products.map(p => {
                    const purchasePrice = p.purchasePrice || 0; 
                    const unitProfit = p.price - purchasePrice;
                    const margin = p.price > 0 ? (unitProfit / p.price) * 100 : 0;
                    
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-gray-500">{p.code}</td>
                        <td className="py-3 px-4 font-medium text-gray-800">{p.name}</td>
                        <td className="py-3 px-4 text-right text-orange-600">
                          {(purchasePrice || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-600">
                          {(p.price || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${unitProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {(unitProfit || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          %{margin.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                  {store.products.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">Kayıtlı ürün bulunamadı.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {/* Cari Bakiyeleri */}
        {(activeTab === 'cariler') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="text-xl font-bold text-gray-800 hidden print:block p-4 border-b">Cari Bakiyeleri Raporu</h2>
            <div className="p-4 border-b border-gray-100 print:hidden">
              <h2 className="text-lg font-bold text-gray-800">Güncel Cari Bakiye Durumları</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                  <tr>
                    <th className="py-3 px-4 rounded-tl-lg border-b">Cari Adı</th>
                    <th className="py-3 px-4 border-b">Tipi</th>
                    <th className="py-3 px-4 border-b">Bakiye Yönü</th>
                    <th className="py-3 px-4 text-right border-b">Bakiye Tutarı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customerBalances.map((c, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-800">{c.name}</td>
                      <td className="py-3 px-4">{c.type}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded inline-flex text-xs font-medium ${c.balanceType === 'Borç' ? 'bg-red-50 text-red-600' : c.balanceType === 'Alacak' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
                          {c.balanceType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-800">
                        {Math.abs(c.balance).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </td>
                    </tr>
                  ))}
                  {customerBalances.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">Kayıtlı cari bulunamadı.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Siparişler Raporu */}
        {(activeTab === 'siparisler') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="text-xl font-bold text-gray-800 hidden print:block p-4 border-b">Genel Sipariş Raporu</h2>
            <div className="p-4 border-b border-gray-100 print:hidden">
              <h2 className="text-lg font-bold text-gray-800">Tüm Siparişlerin Listesi</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                  <tr>
                    <th className="py-3 px-4 border-b">Sipariş No</th>
                    <th className="py-3 px-4 border-b">Tarih</th>
                    <th className="py-3 px-4 border-b">Cari Adı</th>
                    <th className="py-3 px-4 border-b text-right">Tutar</th>
                    <th className="py-3 px-4 border-b">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {store.orders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-gray-500">{o.id}</td>
                      <td className="py-3 px-4">{new Date(o.date).toLocaleDateString('tr-TR')}</td>
                      <td className="py-3 px-4 font-medium text-gray-800">{o.customerName}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-800">
                        {(o.total || (o as any).totalAmount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {store.orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">Kayıtlı sipariş bulunamadı.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stok Durumları */}
        {(activeTab === 'stoklar') && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <h2 className="text-xl font-bold text-red-600 hidden print:block p-4 border-b">Tükenen / Kritik Ürünler</h2>
              <div className="p-4 border-b border-gray-100 flex items-center gap-2 print:hidden">
                <AlertCircle className="text-red-500" size={20} />
                <h2 className="text-lg font-bold text-gray-800">Tükenen Ürünler (Stok = 0)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-medium">
                    <tr>
                      <th className="py-3 px-4 border-b">Kodu</th>
                      <th className="py-3 px-4 border-b">Ürün Adı</th>
                      <th className="py-3 px-4 border-b text-right">Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {outOfStockProducts.map(p => (
                      <tr key={p.id} className="hover:bg-red-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-gray-500">{p.code}</td>
                        <td className="py-3 px-4 font-medium text-gray-800">{p.name}</td>
                        <td className="py-3 px-4 text-right text-red-600 font-bold">{getProductTotalStockMemo(p)}</td>
                      </tr>
                    ))}
                    {outOfStockProducts.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-emerald-600">Tükenen ürün bulunmamaktadır.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <h2 className="text-xl font-bold text-amber-600 hidden print:block p-4 border-b">Hareketsiz Ürünler (Satışı Olmayanlar)</h2>
              <div className="p-4 border-b border-gray-100 flex items-center gap-2 print:hidden">
                <PackageX className="text-amber-500" size={20} />
                <h2 className="text-lg font-bold text-gray-800">Hareketsiz Ürünler (Hiç Sipariş Almamış)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-medium">
                    <tr>
                      <th className="py-3 px-4 border-b">Kodu</th>
                      <th className="py-3 px-4 border-b">Ürün Adı</th>
                      <th className="py-3 px-4 border-b">Kategori</th>
                      <th className="py-3 px-4 border-b text-right">Mevcut Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inactiveProducts.map(p => (
                      <tr key={p.id} className="hover:bg-amber-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-gray-500">{p.code}</td>
                        <td className="py-3 px-4 font-medium text-gray-800">{p.name}</td>
                        <td className="py-3 px-4">{p.category}</td>
                        <td className="py-3 px-4 text-right font-medium">{p.stock}</td>
                      </tr>
                    ))}
                    {inactiveProducts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">Tüm ürünleriniz hareket görmüş.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Üretim Raporu */}
        {(activeTab === 'uretim') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="text-xl font-bold text-gray-800 hidden print:block p-4 border-b">Üretim İş Emirleri Raporu</h2>
            <div className="p-4 border-b border-gray-100 print:hidden">
              <h2 className="text-lg font-bold text-gray-800">Üretim Performansı ve İş Emirleri</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                  <tr>
                    <th className="py-3 px-4 border-b">İş Emri No</th>
                    <th className="py-3 px-4 border-b">Reçete (BOM)</th>
                    <th className="py-3 px-4 border-b text-right">Planlanan</th>
                    <th className="py-3 px-4 border-b text-right">Üretilen</th>
                    <th className="py-3 px-4 border-b text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {store.workOrders.map(w => {
                    const bom = store.boms.find(b => b.id === w.bomId);
                    return (
                    <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-gray-500">{w.id}</td>
                      <td className="py-3 px-4">{bom?.name || 'Bilinmiyor'}</td>
                      <td className="py-3 px-4 text-right font-medium">{w.plannedQuantity}</td>
                      <td className="py-3 px-4 text-right font-medium">{w.producedQuantity}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${w.status === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                           {w.status}
                        </span>
                      </td>
                    </tr>
                  )})}
                  {store.workOrders.length === 0 && (
                     <tr><td colSpan={5} className="p-4 text-center text-gray-500">İş emri bulunamadı.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* İK Raporu */}
        {(activeTab === 'ik') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="text-xl font-bold text-gray-800 hidden print:block p-4 border-b">Personel ve İK Raporu</h2>
            <div className="p-4 border-b border-gray-100 print:hidden">
              <h2 className="text-lg font-bold text-gray-800">Personel Listesi ve Durumları</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                  <tr>
                    <th className="py-3 px-4 border-b">Ad Soyad</th>
                    <th className="py-3 px-4 border-b">Departman</th>
                    <th className="py-3 px-4 border-b">Rol</th>
                    <th className="py-3 px-4 border-b text-right">Maaş</th>
                    <th className="py-3 px-4 border-b text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {store.personnel.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{p.firstName} {p.lastName}</td>
                      <td className="py-3 px-4">{p.department}</td>
                      <td className="py-3 px-4">{p.position}</td>
                      <td className="py-3 px-4 text-right font-medium">{(p.salary || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.employmentStatus === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                           {p.employmentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {store.personnel.length === 0 && (
                     <tr><td colSpan={5} className="p-4 text-center text-gray-500">Personel kaydı bulunamadı.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CRM Raporu */}
        {(activeTab === 'crm') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="text-xl font-bold text-gray-800 hidden print:block p-4 border-b">Lead ve Görüşmeler Raporu</h2>
            <div className="p-4 border-b border-gray-100 print:hidden">
              <h2 className="text-lg font-bold text-gray-800">Mevcut Lead (Potansiyel Müşteri) Havuzu</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                  <tr>
                    <th className="py-3 px-4 border-b">İsim / Firma</th>
                    <th className="py-3 px-4 border-b">E-posta</th>
                    <th className="py-3 px-4 border-b">Telefon</th>
                    <th className="py-3 px-4 border-b text-center">Lead Durumu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {store.customers.filter(c => c.isLead).map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{c.name} {c.companyName ? `(${c.companyName})` : ''}</td>
                      <td className="py-3 px-4">{c.email}</td>
                      <td className="py-3 px-4">{c.phone}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.leadStatus === 'Kazanıldı' ? 'bg-emerald-100 text-emerald-700' : c.leadStatus === 'Kaybedildi' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                           {c.leadStatus || 'Yeni'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {store.customers.filter(c => c.isLead).length === 0 && (
                     <tr><td colSpan={4} className="p-4 text-center text-gray-500">Sistemde lead (potansiyel müşteri) bulunamadı.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

