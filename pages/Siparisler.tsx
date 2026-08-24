import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Plus, Search, ShoppingCart, User, Send, FileText, 
  X, Package, Filter, ArrowUpDown, ChevronDown, Printer, Trash2
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

  // History State
  const [historySearch, setHistorySearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  const clearForm = () => {
    setCustomerInfo({ id: '', name: '', phone: '', email: '', address: '', type: '' });
    setCartItems([]);
    setNotes('');
    setExpectedDeliveryDate('');
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    const cust = store.customers?.find((c: Customer) => c.id === custId);
    if (cust) {
      setCustomerInfo({
        id: cust.id, name: cust.name, phone: cust.phone || '', email: cust.email || '', address: cust.address || '', type: cust.type || ''
      });
    } else {
      setCustomerInfo({ id: '', name: '', phone: '', email: '', address: '', type: '' });
    }
  };

  const handleCreateOrder = async () => {
    if (!customerInfo.id || cartItems.length === 0) {
      toast.error('Lütfen bir müşteri seçin ve sepete ürün ekleyin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newOrder: Order = {
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        id: `ORD-${Date.now()}`,
        customerId: customerInfo.id,
        customerName: customerInfo.name,
        date: new Date().toISOString(),
        items: cartItems,
        subTotal: totals.subTotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        status: OrderStatus.PENDING,
        notes: notes,
      };

      store.setOrders((prev: Order[]) => [newOrder, ...(prev || [])]);

      // Update customer balance and add transaction
      if (customerInfo.id) {
        const customer = store.customers?.find((c: any) => c.id === customerInfo.id);
        if (customer) {
           const newTx = {
             id: `CTX-ORD-${Date.now()}`,
             customerId: customer.id,
             date: new Date().toISOString().split('T')[0],
             type: 'Borç' as const,
             amount: totals.total,
             description: `Sipariş #${newOrder.id.substring(0,8).toUpperCase()}`
           };
           
           const currentBalance = Number(customer.balance) || 0;
           store.setCustomers((prev: any) => prev.map((c: any) => 
              c.id === customer.id ? { ...c, balance: currentBalance + totals.total } : c
           ));
           store.setTransactions((prev: any) => [newTx, ...(prev || [])]);
        }
      }

      toast.success('Sipariş başarıyla oluşturuldu!');
      clearForm();
      setActiveTab('history');
    } catch (error: any) {
      toast.error(error.message || 'Hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const orders = store.orders || [];
    if (!historySearch) return orders;
    return orders.filter(o => o.id.includes(historySearch) || o.customerName?.toLowerCase().includes(historySearch.toLowerCase()));
  }, [store.orders, historySearch]);

  const handleCancelOrder = (order: Order) => {
    if (!window.confirm('Bu siparişi iptal etmek istediğinize emin misiniz? Cari işlem iade edilecektir.')) return;
    
    // Reverse balance
    const customer = store.customers?.find((c: any) => c.id === order.customerId);
    if (customer) {
        const refundTx = {
            id: `CTX-REF-${Date.now()}`,
            customerId: customer.id,
            date: new Date().toISOString().split('T')[0],
            type: 'Alacak' as const,
            amount: order.total,
            description: `İptal Edilen Sipariş #${order.id.substring(0,8).toUpperCase()}`
        };
        const currentBalance = Number(customer.balance) || 0;
        store.setCustomers((prev: any) => prev.map((c: any) => 
            c.id === customer.id ? { ...c, balance: currentBalance - order.total } : c
        ));
        store.setTransactions((prev: any) => [refundTx, ...(prev || [])]);
    }
    
    store.setOrders((prev: Order[]) => prev.map(o => o.id === order.id ? { ...o, status: OrderStatus.CANCELLED } : o));
    setSelectedOrder(null);
    toast.success('Sipariş iptal edildi');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      <div className="bg-white border-b border-gray-200 p-4 shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sipariş Yönetimi</h1>
              <p className="text-sm text-gray-500">Müşteri siparişlerini oluşturun ve yönetin</p>
            </div>
          </div>
          
          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => { setActiveTab('create'); setSelectedOrder(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
            >
              Yeni Sipariş
            </button>
            <button
              onClick={() => { setActiveTab('history'); setSelectedOrder(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
            >
              Geçmiş Siparişler
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'create' ? (
          <div className="h-full flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
            {/* Left Column */}
            <div className="flex-1 flex flex-col lg:h-full lg:overflow-y-auto p-4 lg:p-6 space-y-6 shrink-0">
              {/* Customer */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <User className="w-5 h-5 text-blue-500 mr-2" />
                    Müşteri Seçimi
                  </h2>
                </div>
                <select 
                  className="w-full border border-gray-200 rounded-lg p-2"
                  value={customerInfo.id}
                  onChange={handleCustomerSelect}
                >
                  <option value="">-- Müşteri Seç --</option>
                  {store.customers?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </section>

              {/* Products */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1 flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <Package className="w-5 h-5 text-blue-500 mr-2" />
                    Ürün Seçimi
                  </h2>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Ürün ara..." 
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm w-full outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4">
                  {filteredProducts.map((p: any) => (
                    <div key={p.id} onClick={() => addToCart(p)} className="cursor-pointer border border-gray-100 rounded-xl p-4 hover:border-blue-500 flex flex-col items-center text-center">
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
                  className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={18} /> Siparişi Tamamla
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col p-6 overflow-y-auto">
            <div className="mb-6 flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Sipariş ara (Müşteri, No)..." 
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 outline-none"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sipariş No</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Müşteri</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Tutar</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Durum</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Kayıt bulunamadı</td></tr>
                    ) : (
                      filteredOrders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.date).toLocaleDateString('tr-TR')}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{order.customerName}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">{order.total?.toLocaleString('tr-TR')} ₺</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              order.status === OrderStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                              order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {order.status !== OrderStatus.CANCELLED && (
                              <button onClick={() => handleCancelOrder(order)} className="text-red-500 hover:text-red-700 p-1">
                                <Trash2 size={16} />
                              </button>
                            )}
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
    </div>
  );
};
