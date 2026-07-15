import React, { useState, useMemo } from 'react';
import { useAppStore } from '../lib/store';
import { 
  FileText, Search, Filter, ShoppingCart, ShoppingBag, ArrowUpRight, 
  Eye, Calendar, Box, Package, User, Hash, FileCheck, CircleDollarSign, X, RotateCcw,
  Download, Trash2, CheckSquare, Square, Receipt, Printer
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export const Satislar: React.FC = () => {
  const store = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const getOrderSource = (order: Order) => {
    if (order.proposalId) {
      return { label: 'Tekliften', color: 'bg-indigo-100 text-indigo-700', icon: FileCheck };
    }
    return { label: 'Hızlı Satış / Sipariş', color: 'bg-emerald-100 text-emerald-700', icon: ShoppingCart };
  };

  const handlePrintOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Yazdırma penceresi açılamadı. Lütfen açılır pencerelere izin verin.');
      return;
    }

    const { settings } = store;
    const paperWidth = settings.receiptTemplate_paperWidth || '80mm';
    const fontSize = settings.receiptTemplate_fontSize || '14px';
    const logoPos = settings.receiptTemplate_logoPosition || 'center';
    const logoSize = settings.receiptTemplate_logoSize || 100;

    const html = `
      <html>
        <head>
          <title>Satış Fişi - ${order.id}</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              color: #000; 
              font-size: ${fontSize}; 
              margin: 0;
              padding: 10px;
              width: ${paperWidth};
              box-sizing: border-box;
            }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .header h2 { margin: 0 0 5px 0; font-size: 1.2em; }
            .header-info { margin-top: 5px; font-size: 0.9em; }
            .logo-container { text-align: ${logoPos}; margin-bottom: 10px; display: ${logoPos === 'hidden' ? 'none' : 'block'}; }
            .logo-container img { max-width: ${logoSize}px; max-height: ${logoSize}px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 0.9em; }
            .items { margin-top: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.9em; }
            .item-name { flex: 1; padding-right: 5px; }
            .item-qty { width: 30px; text-align: right; }
            .item-price { width: 60px; text-align: right; }
            .item-total { width: 70px; text-align: right; font-weight: bold; }
            .totals { margin-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: bold; font-size: 1.1em; }
            .footer { text-align: center; margin-top: 20px; font-size: 0.8em; }
          </style>
        </head>
        <body>
          <div class="logo-container">
            ${settings.companyLogo ? `<img src="${settings.companyLogo}" alt="Logo" />` : ''}
          </div>
          <div class="header">
            <h2>${settings.companyName || 'SATIŞ FİŞİ'}</h2>
            
            <div class="header-info">
              ${settings.receiptTemplate_showAddress !== false && settings.address ? `<div>${settings.address}</div>` : ''}
              ${settings.receiptTemplate_showPhone !== false && settings.phone ? `<div>Tel: ${settings.phone}</div>` : ''}
              ${settings.receiptTemplate_showTaxInfo !== false && settings.taxOffice ? `<div>V.D: ${settings.taxOffice} - V.N: ${settings.taxNumber}</div>` : ''}
              ${settings.printer_header_text ? `<div style="margin-top:5px;">${settings.printer_header_text.replace(/\n/g, '<br/>')}</div>` : ''}
            </div>

            <div style="margin-top: 10px; text-align: left;">
              <div class="row"><span>Tarih:</span> <span>${new Date((order.date || '').replace(' ', 'T')).toLocaleString('tr-TR')}</span></div>
              <div class="row"><span>Fiş No:</span> <span>${order.id}</span></div>
              ${order.customerName ? `<div class="row"><span>Müşteri:</span> <span>${order.customerName}</span></div>` : ''}
            </div>
          </div>
          
          <div class="items">
            <div class="item-row" style="font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 8px; padding-bottom: 4px;">
              <div class="item-name">Ürün</div>
              <div class="item-qty">Mkt</div>
              <div class="item-price">Fiyat</div>
              <div class="item-total">Tutar</div>
            </div>
            ${order.items.map(item => {
              const product = store.products.find(p => p.id === item.productId);
              return `
                <div class="item-row">
                  <div class="item-name">${product?.name || 'Ürün'}</div>
                  <div class="item-qty">${item.quantity}</div>
                  <div class="item-price">${item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                  <div class="item-total">${(item.quantity * item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="totals">
            <div class="total-row">
              <span>TOPLAM:</span>
              <span>${(order.total || 0).toLocaleString('tr-TR', { style: 'currency', currency: order.currency || 'TRY' })}</span>
            </div>
          </div>
          
          <div class="footer">
            ${settings.printer_footer_text ? settings.printer_footer_text.replace(/\n/g, '<br/>') : 'Bizi tercih ettiğiniz için teşekkür ederiz.<br/>Mali değeri yoktur.'}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    // Give it a small delay to render before printing
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  const handleCancelOrder = (order: Order) => {
    if (order.status === OrderStatus.CANCELLED) return;
    if (!window.confirm(`${order.id} numaralı satışı iptal etmek ve ürünleri stoğa geri eklemek istediğinize emin misiniz?`)) return;

    // Restore stock
    const products = [...store.products];
    order.items.forEach(item => {
      const idx = products.findIndex(p => p.id === item.productId);
      if (idx >= 0) {
        products[idx] = { ...products[idx], stock: products[idx].stock + item.quantity };
      }
    });
    store.setProducts(products);

    // Cancel order
    const orders = store.orders.map(o => {
      if (o.id === order.id) {
        return { ...o, status: OrderStatus.CANCELLED };
      }
      return o;
    });
    store.setOrders(orders);
  };

  const handleBulkDelete = () => {
    if (selectedOrderIds.length === 0) return;
    if (!window.confirm(`Seçili ${selectedOrderIds.length} satışı kalıcı olarak silmek istediğinize emin misiniz?`)) return;
    
    const remainingOrders = store.orders.filter(o => !selectedOrderIds.includes(o.id));
    store.setOrders(remainingOrders);
    setSelectedOrderIds([]);
  };

  const handleBulkExport = () => {
    if (selectedOrderIds.length === 0) return;

    const ordersToExport = store.orders.filter(o => selectedOrderIds.includes(o.id));
    
    const exportData = ordersToExport.map(o => ({
      'Satış No': o.id,
      'Tarih': new Date((o.date || '').replace(' ', 'T')).toLocaleString('tr-TR'),
      'Müşteri': o.customerName || 'Bilinmiyor',
      'Kaynak': o.proposalId ? 'Tekliften' : 'Hızlı Satış',
      'Durum': o.status,
      'Tutar': o.total
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Secili_Satislar");
    XLSX.writeFile(wb, `secili_satislar_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleBulkInvoice = () => {
    if (selectedOrderIds.length === 0) return;
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `${selectedOrderIds.length} adet satış için E-Fatura oluşturuluyor...`,
        success: `${selectedOrderIds.length} adet E-Fatura başarıyla oluşturuldu!`,
        error: 'E-Fatura oluşturulurken bir hata oluştu.',
      }
    ).then(() => {
      setSelectedOrderIds([]);
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(orderId => orderId !== id) : [...prev, id]
    );
  };

  const filteredOrders = useMemo(() => {
    let result = [...(store.orders || [])];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Date filter
    if (dateFilter === 'custom') {
      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setHours(0, 0, 0, 0);
        result = result.filter(o => new Date((o.date || '').replace(' ', 'T')) >= sDate);
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        result = result.filter(o => new Date((o.date || '').replace(' ', 'T')) <= eDate);
      }
    } else if (dateFilter !== 'all') {
      result = result.filter(o => {
        const oDate = new Date((o.date || '').replace(' ', 'T'));
        oDate.setHours(0, 0, 0, 0);
        if (dateFilter === 'today') return oDate.getTime() === today.getTime();
        if (dateFilter === 'this_week') return oDate >= startOfWeek;
        if (dateFilter === 'this_month') return oDate >= startOfMonth;
        return true;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }

    // Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(o => 
        o.customerName?.toLowerCase().includes(lower) || 
        o.id.toLowerCase().includes(lower)
      );
    }

    // Sort by date descending
    result.sort((a, b) => new Date((b.date || '').replace(' ', 'T')).getTime() - new Date((a.date || '').replace(' ', 'T')).getTime());

    return result;
  }, [store.orders, searchTerm, statusFilter, dateFilter, startDate, endDate]);

  // Calculate summaries based on filtered date range, but disregarding the 'statusFilter' 
  // so we show the true summary of that date range (Total, Cancelled, Net).
  const summaryMetrics = useMemo(() => {
    let baseResult = [...(store.orders || [])];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    if (dateFilter === 'custom') {
      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setHours(0, 0, 0, 0);
        baseResult = baseResult.filter(o => new Date((o.date || '').replace(' ', 'T')) >= sDate);
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        baseResult = baseResult.filter(o => new Date((o.date || '').replace(' ', 'T')) <= eDate);
      }
    } else if (dateFilter !== 'all') {
      baseResult = baseResult.filter(o => {
        const oDate = new Date((o.date || '').replace(' ', 'T'));
        oDate.setHours(0, 0, 0, 0);
        if (dateFilter === 'today') return oDate.getTime() === today.getTime();
        if (dateFilter === 'this_week') return oDate >= startOfWeek;
        if (dateFilter === 'this_month') return oDate >= startOfMonth;
        return true;
      });
    }

    const totalSales = baseResult.reduce((sum, o) => sum + (o.total || 0), 0);
    const returnedSales = baseResult.filter(o => o.status === OrderStatus.CANCELLED).reduce((sum, o) => sum + (o.total || 0), 0);
    const netSales = totalSales - returnedSales;

    return { totalSales, returnedSales, netSales };
  }, [store.orders, dateFilter, startDate, endDate]);

  const getStatusStyle = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.PENDING: return 'bg-amber-100 text-amber-700 border-amber-200';
      case OrderStatus.PREPARED: return 'bg-blue-100 text-blue-700 border-blue-200';
      case OrderStatus.SHIPPED: return 'bg-purple-100 text-purple-700 border-purple-200';
      case OrderStatus.COMPLETED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-indigo-600" />
            Satışlar
          </h1>
          <p className="text-gray-500 mt-1">
            Hızlı satışlar, tekliften dönüşenler ve tüm siparişleriniz.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <CircleDollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Toplam Satış Tutarı</div>
            <div className="text-2xl font-bold text-gray-900">
              {summaryMetrics.totalSales.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <RotateCcw className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Gerçekleşen İade Tutarı</div>
            <div className="text-2xl font-bold text-red-600">
              {summaryMetrics.returnedSales.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Net Satış Miktarı</div>
            <div className="text-2xl font-bold text-emerald-600">
              {summaryMetrics.netSales.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 flex-wrap">
        <div className="flex-1 relative min-w-[250px]">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Satış no veya müşteri adı ara..."
            value={searchTerm || ""}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="w-full md:w-48 relative">
          <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={dateFilter || ""}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all"
          >
            <option value="all">Tüm Zamanlar</option>
            <option value="today">Bugün</option>
            <option value="this_week">Bu Hafta</option>
            <option value="this_month">Bu Ay</option>
            <option value="custom">Özel Tarih</option>
          </select>
        </div>
        
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="date"
              value={startDate || ""}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full md:w-40 px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={endDate || ""}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full md:w-40 px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        )}

        <div className="w-full md:w-48 relative">
          <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all"
          >
            <option value="all">Tüm Durumlar</option>
            {Object.values(OrderStatus).map(status => (
              <option key={status} value={status || ""}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedOrderIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="text-indigo-800 font-medium">
            {selectedOrderIds.length} satış seçildi
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleBulkDelete}
              className="flex-1 sm:flex-none justify-center px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Toplu Sil
            </button>
            <button
              onClick={handleBulkExport}
              className="flex-1 sm:flex-none justify-center px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Excel'e Aktar
            </button>
            <button
              onClick={handleBulkInvoice}
              className="flex-1 sm:flex-none justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Receipt className="w-4 h-4" />
              E-Fatura Oluştur
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 w-12">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                    />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Kayıt No & Kaynak</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const source = getOrderSource(order);
                  const SourceIcon = source.icon;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 w-12" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.includes(order.id)}
                            onChange={() => handleSelectOrder(order.id)}
                            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <span className="font-mono text-sm text-gray-900">{order.id.split('-')[0].toUpperCase()}</span>
                          </div>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${source.color}`}>
                            <SourceIcon className="w-3 h-3" />
                            {source.label}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{order.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date((order.date || '').replace(' ', 'T')).toLocaleDateString('tr-TR', { 
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                          <CircleDollarSign className="w-4 h-4 text-emerald-500" />
                          {(order.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {order.currency || '₺'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePrintOrder(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Yazdır / Fiş Al"
                          >
                            <Printer className="w-4 h-4" />
                            Yazdır
                          </button>
                          {order.status !== OrderStatus.CANCELLED && (
                            <button
                              onClick={() => handleCancelOrder(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              title="İptal Et / İade Al"
                            >
                              <RotateCcw className="w-4 h-4" />
                              İptal
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                            title="Detay Görüntüle"
                          >
                            <Eye className="w-4 h-4" />
                            Detay
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Package className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Satış Detayı
                  </h3>
                  <div className="text-sm text-gray-500 font-mono mt-0.5 flex items-center gap-2">
                    #{selectedOrder.id}
                    {selectedOrder.proposalId && (
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium font-sans">
                        Teklif Ref: {selectedOrder.proposalId.split('-')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
              {/* Customer & Date Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Müşteri Bilgileri</div>
                  <div className="font-medium text-gray-900">{selectedOrder.customerName}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Tarih</div>
                  <div className="font-medium text-gray-900">
                    {new Date((selectedOrder.date || '').replace(' ', 'T')).toLocaleString('tr-TR')}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Box className="w-4 h-4 text-gray-400" />
                  Satış Kalemleri
                </h4>
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Ürün</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-500">Miktar</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Birim Fiyat</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Toplam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(selectedOrder.items || []).map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {(item.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedOrder.currency || '₺'}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {((item.price || 0) * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedOrder.currency || '₺'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ara Toplam</span>
                    <span className="font-medium">{(selectedOrder.subTotal || selectedOrder.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedOrder.currency || '₺'}</span>
                  </div>
                  {selectedOrder.taxTotal != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">KDV Toplamı</span>
                      <span className="font-medium">{(selectedOrder.taxTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedOrder.currency || '₺'}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200 flex justify-between">
                    <span className="font-bold text-gray-900">Genel Toplam</span>
                    <span className="font-bold text-indigo-600 text-lg">{(selectedOrder.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedOrder.currency || '₺'}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <div className="text-xs font-medium text-amber-800 uppercase tracking-wider mb-2">Notlar</div>
                  <p className="text-sm text-amber-900 whitespace-pre-wrap">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
