import React, { useMemo, useState } from 'react';
import { useAppStore } from '../lib/store';
import { TrendingUp, TrendingDown, DollarSign, Download, Printer, AlertCircle, PackageX } from 'lucide-react';
import { OrderStatus } from '../types';
import * as XLSX from 'xlsx';

export const Raporlar: React.FC = () => {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<'karlilik' | 'cariler' | 'siparisler' | 'stoklar'>('karlilik');

  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;

    // Sadece tamamlanmış ve kargolanmış siparişlerin kârı hesaplanır
    const completedOrders = store.orders.filter(o => 
      o.status === OrderStatus.COMPLETED || o.status === OrderStatus.SHIPPED
    );

    completedOrders.forEach(order => {
      totalRevenue += order.total;

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

  // Derived Data
  const outOfStockProducts = useMemo(() => store.products.filter(p => p.stock <= 0), [store.products]);
  
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

    // 4. Stok Raporu
    const stockData = store.products.map(p => ({
      'Kodu': p.code,
      'Ürün Adı': p.name,
      'Stok': p.stock,
      'Kategori': p.category,
      'Durum': p.stock <= 0 ? 'Tükendi' : p.stock < 10 ? 'Kritik' : 'Stokta',
      'Hareket': inactiveProducts.some(ip => ip.id === p.id) ? 'Hareketsiz' : 'Hareketli'
    }));
    const stockSheet = XLSX.utils.json_to_sheet(stockData);
    XLSX.utils.book_append_sheet(wb, stockSheet, "Stok Durumu");

    XLSX.writeFile(wb, "Sistem_Raporlari.xlsx");
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
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
          <button onClick={printReport} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
            <Printer size={18} />
            <span>Yazdır / PDF</span>
          </button>
        </div>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-lg gap-1 border border-gray-200 overflow-x-auto print:hidden">
        <button onClick={() => setActiveTab('karlilik')} className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'karlilik' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Kârlılık Analizi</button>
        <button onClick={() => setActiveTab('cariler')} className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'cariler' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Cari Bakiyeleri</button>
        <button onClick={() => setActiveTab('siparisler')} className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'siparisler' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Sipariş Raporu</button>
        <button onClick={() => setActiveTab('stoklar')} className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'stoklar' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Stok Raporları</button>
      </div>

      <div className="print:block">
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
                <span>Toplam Maliyet (Alışlar)</span>
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
                          {purchasePrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-600">
                          {p.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${unitProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {unitProfit.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
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
                        {o.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
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
                        <td className="py-3 px-4 text-right text-red-600 font-bold">{p.stock}</td>
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
      </div>
    </div>
  );
};

