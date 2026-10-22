import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Plus, Search, ShoppingCart, User, Send, FileText, 
  X, Package, Filter, ArrowUpDown, ChevronDown, Printer, Trash2,
  Eye, Edit2, CheckCircle2, Ban, Calendar, Tag
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Order, OrderStatus, OrderItem, Product, Customer } from '../types';

export const Siparisler: React.FC = () => {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Create Order State
  const [customerInfo, setCustomerInfo] = useState({ id: '', name: '', phone: '', email: '', address: '', type: '' });
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History & Filter State
  const [historySearch, setHistorySearch] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Modals State
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editExpectedDate, setEditExpectedDate] = useState('');

  const filteredProducts = useMemo(() => {
    const prods = store.products || [];
    if (!productSearch) return prods.slice(0, 12);
    const lower = productSearch.toLowerCase();
    return prods.filter((p: any) => p.name?.toLowerCase().includes(lower) || p.code?.toLowerCase().includes(lower)).slice(0, 12);
  }, [store.products, productSearch]);

  const totals = useMemo(() => {
    const subTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity * (item.taxRate || 20) / 100), 0);
    return { subTotal, taxTotal, total: subTotal + taxTotal };
  }, [cartItems]);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        taxRate: product.taxRate || 20,
        unit: product.unit || 'Adet'
      }];
    });
    toast.success(`${product.name} sepete eklendi`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleCreateOrder = async () => {
    if (!customerInfo.name) {
      toast.error('Lütfen bir müşteri seçin');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Sepet boş');
      return;
    }

    setIsSubmitting(true);
    try {
      const newOrder: Order = {
        id: `SIP-${Date.now().toString().slice(-6)}`,
        customerId: customerInfo.id || 'c-1',
        customerName: customerInfo.name,
        date: new Date().toISOString(),
        subTotal: totals.subTotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        status: OrderStatus.PENDING,
        items: cartItems,
        notes: notes,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        currency: 'TRY',
        exchangeRate: 1
      };

      const tenantId = localStorage.getItem('esila_tenant_id') || '1111111111';
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify(newOrder)
      });

      if (res.ok) {
        const created = await res.json();
        store.setOrders([created, ...(store.orders || [])]);
        toast.success('Sipariş başarıyla oluşturuldu');
        setCartItems([]);
        setNotes('');
        setExpectedDeliveryDate('');
        setCustomerInfo({ id: '', name: '', phone: '', email: '', address: '', type: '' });
        setActiveTab('history');
      } else {
        toast.error('Sipariş oluşturulamadı');
      }
    } catch (err) {
      console.error(err);
      toast.error('Bağlantı hatası');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async (order: Order) => {
    if (!confirm(`Sipariş #${order.id} iptal edilsin mi?`)) return;
    try {
      const tenantId = localStorage.getItem('esila_tenant_id') || '1111111111';
      const updated = { ...order, status: OrderStatus.CANCELLED };
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        store.setOrders(store.orders.map(o => o.id === order.id ? updated : o));
        toast.success('Sipariş iptal edildi');
      } else {
        toast.error('İşlem başarısız');
      }
    } catch (err) {
      toast.error('Hata oluştu');
    }
  };

  const handleInvoiceOrder = async (order: Order) => {
    try {
      const newInvoice = {
        id: `FAT-${Date.now().toString().slice(-6)}`,
        type: 'e-Arşiv Fatura',
        invoiceType: 'SATIS',
        scenario: 'TEMELFATURA',
        date: new Date().toISOString(),
        customerName: order.customerName,
        amount: order.total,
        currency: order.currency || 'TRY',
        exchangeRate: order.exchangeRate || 1,
        status: 'Taslak',
        items: order.items,
        notes: `Sipariş #${order.id} faturaya dönüştürüldü. ${order.notes || ''}`
      };

      const tenantId = localStorage.getItem('esila_tenant_id') || '1111111111';
      const res = await fetch('/api/e-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify(newInvoice)
      });

      if (res.ok) {
        // Also update order status to completed
        const updated = { ...order, status: OrderStatus.COMPLETED };
        await fetch(`/api/orders/${order.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
          body: JSON.stringify(updated)
        });
        store.setOrders(store.orders.map(o => o.id === order.id ? updated : o));
        store.setEInvoices([newInvoice, ...(store.eInvoices || [])]);
        toast.success(`Sipariş #${order.id} faturalandırıldı ve e-fatura taslaklarına eklendi!`);
      } else {
        toast.error('Faturalandırma başarısız');
      }
    } catch (err) {
      toast.error('Hata oluştu');
    }
  };

  const handleSaveEditOrder = async () => {
    if (!editOrder) return;
    try {
      const tenantId = localStorage.getItem('esila_tenant_id') || '1111111111';
      const updated = { 
        ...editOrder, 
        notes: editNotes, 
        expectedDeliveryDate: editExpectedDate 
      };
      const res = await fetch(`/api/orders/${editOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        store.setOrders(store.orders.map(o => o.id === editOrder.id ? updated : o));
        toast.success('Sipariş güncellendi');
        setEditOrder(null);
      } else {
        toast.error('Güncelleme başarısız');
      }
    } catch (err) {
      toast.error('Hata oluştu');
    }
  };

  // Categories list for filtering
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    (store.products || []).forEach((p: any) => { if (p.category) set.add(p.category); });
    return Array.from(set);
  }, [store.products]);

  const filteredOrders = useMemo(() => {
    let list = store.orders || [];

    // Search term
    if (historySearch) {
      const lower = historySearch.toLowerCase();
      list = list.filter((o: any) => o.id.toLowerCase().includes(lower) || o.customerName.toLowerCase().includes(lower));
    }

    // Date filters
    if (filterStartDate) {
      list = list.filter((o: any) => new Date(o.date) >= new Date(filterStartDate));
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter((o: any) => new Date(o.date) <= end);
    }

    // Customer filter
    if (filterCustomerId) {
      list = list.filter((o: any) => o.customerId === filterCustomerId);
    }

    // Category filter
    if (filterCategory) {
      list = list.filter((o: any) => {
        return (o.items || []).some((item: any) => {
          const prod = (store.products || []).find((p: any) => p.id === item.productId || p.name === item.productName);
          return prod?.category === filterCategory;
        });
      });
    }

    return list.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [store.orders, historySearch, filterStartDate, filterEndDate, filterCustomerId, filterCategory, store.products]);

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sipariş Yönetimi</h1>
          <p className="text-sm text-gray-500">Müşteri siparişleri oluşturun ve geçmiş siparişleri yönetin</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Yeni Sipariş Oluştur
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Geçmiş Siparişler ({store.orders?.length || 0})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'create' ? (
          <div className="h-full flex flex-col lg:flex-row overflow-hidden">
            {/* Left Column: Customer & Products */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              {/* Customer selection */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User size={16} className="text-blue-600" /> Müşteri Bilgileri
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Müşteri Seçin</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white"
                      value={customerInfo.id}
                      onChange={(e) => {
                        const cust = (store.customers || []).find((c: any) => c.id === e.target.value);
                        if (cust) {
                          setCustomerInfo({
                            id: cust.id,
                            name: cust.companyName || cust.name,
                            phone: cust.phone || '',
                            email: cust.email || '',
                            address: cust.address || '',
                            type: cust.type || ''
                          });
                        }
                      }}
                    >
                      <option value="">Müşteri Cari Seçiniz...</option>
                      {(store.customers || []).map((c: any) => (
                        <option key={c.id} value={c.id}>{c.companyName || c.name} ({c.type || 'Alıcı'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Teslimat Tarihi</label>
                    <input
                      type="date"
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm"
                      value={expectedDeliveryDate}
                      onChange={e => setExpectedDeliveryDate(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Sipariş Notu</label>
                    <input
                      type="text"
                      placeholder="Sipariş ile ilgili notlar..."
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Product catalog */}
              <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Package size={16} className="text-blue-600" /> Ürün Katalogu
                  </h3>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Ürün Ara..."
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4">
                  {filteredProducts.map((p: any) => (
                    <div key={p.id} onClick={() => addToCart(p)} className="cursor-pointer border border-gray-100 rounded-xl p-4 hover:border-blue-500 flex flex-col items-center text-center transition-all hover:shadow-md">
                      <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                         {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <Package className="text-gray-400" />}
                      </div>
                      <span className="text-sm font-medium line-clamp-2">{p.name}</span>
                      <span className="text-xs text-blue-600 font-bold mt-1">{p.price} ₺</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Cart */}
            <div className="w-full lg:w-96 bg-white lg:border-l border-t lg:border-t-0 border-gray-200 flex flex-col lg:h-full shadow-sm z-20 shrink-0">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-medium text-gray-900">Sipariş Özeti ({cartItems.length})</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {cartItems.length === 0 ? (
                  <div className="text-center text-gray-400 mt-10">Sepetiniz boş</div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map(item => (
                      <div key={item.productId} className="flex flex-col bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                          <button onClick={() => removeFromCart(item.productId)} className="text-red-500"><X size={16}/></button>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-blue-600">{item.price} ₺</span>
                          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg">
                            <button onClick={() => updateQuantity(item.productId, -1)} className="px-2 py-1 text-gray-500 hover:bg-gray-50">-</button>
                            <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, 1)} className="px-2 py-1 text-gray-500 hover:bg-gray-50">+</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                <div className="flex justify-between text-lg font-bold text-gray-900 mb-4">
                  <span>Toplam</span>
                  <span>{totals.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                </div>
                <button 
                  onClick={handleCreateOrder} 
                  disabled={isSubmitting || cartItems.length === 0}
                  className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                >
                  <Send size={18} /> Siparişi Tamamla
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col p-6 overflow-y-auto">
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Sipariş No / Müşteri ara..." 
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                />
              </div>
              <div>
                <select
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white"
                  value={filterCustomerId}
                  onChange={e => setFilterCustomerId(e.target.value)}
                >
                  <option value="">Tüm Cariler</option>
                  {(store.customers || []).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white"
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                >
                  <option value="">Tüm Kategoriler</option>
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <input 
                  type="date"
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                  title="Başlangıç Tarihi"
                />
              </div>
              <div className="flex gap-2">
                <input 
                  type="date"
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                  title="Bitiş Tarihi"
                />
                {(historySearch || filterStartDate || filterEndDate || filterCustomerId || filterCategory) && (
                  <button 
                    onClick={() => {
                      setHistorySearch('');
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setFilterCustomerId('');
                      setFilterCategory('');
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200"
                    title="Filtreleri Temizle"
                  >
                    Temizle
                  </button>
                )}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sipariş No</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Müşteri</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Teslimat Tarihi</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Tutar</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Durum</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.length === 0 ? (
                      <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Kayıt bulunamadı</td></tr>
                    ) : (
                      filteredOrders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.date).toLocaleDateString('tr-TR')}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">{order.customerName}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString('tr-TR') : '-'}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">{order.total?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              order.status === OrderStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                              order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => setDetailOrder(order)} 
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Sipariş Detayı"
                              >
                                <Eye size={16} />
                              </button>
                              {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.COMPLETED && (
                                <>
                                  <button 
                                    onClick={() => {
                                      setEditOrder(order);
                                      setEditNotes(order.notes || '');
                                      setEditExpectedDate(order.expectedDeliveryDate || '');
                                    }} 
                                    className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="Düzenle"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleInvoiceOrder(order)} 
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Siparişi Faturalandır"
                                  >
                                    <FileText size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleCancelOrder(order)} 
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="İptal Et"
                                  >
                                    <Ban size={16} />
                                  </button>
                                </>
                              )}
                            </div>
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
      </div>

      {/* Order Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Sipariş Detayı (#{detailOrder.id})</h3>
              <button onClick={() => setDetailOrder(null)} className="text-gray-500 hover:text-red-500"><X size={22} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="text-xs text-gray-500 block">Müşteri</span>
                  <span className="font-semibold text-gray-800">{detailOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Sipariş Tarihi</span>
                  <span className="font-semibold text-gray-800">{new Date(detailOrder.date).toLocaleDateString('tr-TR')}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Teslimat Tarihi</span>
                  <span className="font-semibold text-gray-800">{detailOrder.expectedDeliveryDate ? new Date(detailOrder.expectedDeliveryDate).toLocaleDateString('tr-TR') : '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Durum</span>
                  <span className="font-semibold text-blue-600">{detailOrder.status}</span>
                </div>
              </div>
              {detailOrder.notes && (
                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-sm text-blue-900">
                  <strong>Not:</strong> {detailOrder.notes}
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Sipariş Kalemleri</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Ürün</th>
                        <th className="px-4 py-2.5 text-center">Miktar</th>
                        <th className="px-4 py-2.5 text-right">Birim Fiyat</th>
                        <th className="px-4 py-2.5 text-right">Toplam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(detailOrder.items || []).map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-medium text-gray-800">{item.productName}</td>
                          <td className="px-4 py-3 text-center">{item.quantity} {item.unit || 'Adet'}</td>
                          <td className="px-4 py-3 text-right">{item.price?.toLocaleString('tr-TR')} ₺</td>
                          <td className="px-4 py-3 text-right font-semibold">{(item.price * item.quantity).toLocaleString('tr-TR')} ₺</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t">
                <div className="text-right">
                  <span className="text-sm text-gray-500 block">Genel Toplam</span>
                  <span className="text-2xl font-bold text-gray-900">{detailOrder.total?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Sipariş Düzenle (#{editOrder.id})</h3>
              <button onClick={() => setEditOrder(null)} className="text-gray-500 hover:text-red-500"><X size={22} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Teslimat Tarihi</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm"
                  value={editExpectedDate}
                  onChange={e => setEditExpectedDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Sipariş Notu</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm"
                  rows={3}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setEditOrder(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">Vazgeç</button>
                <button onClick={handleSaveEditOrder} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
