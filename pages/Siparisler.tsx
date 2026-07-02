import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { 
  Plus, Search, ShoppingCart, User, Send, 
  FileText, X, Package, Filter, ArrowUpDown, ChevronDown
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Order, OrderStatus, OrderItem, Product, Customer } from '../types';

// Modular State Hook for Order Form
function useOrderForm() {
  const [customerInfo, setCustomerInfo] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');

  const updateCustomerInfo = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity,
        price: product.price,
        taxRate: product.taxRate || 20,
        unit: product.unit || 'Adet'
      }];
    });
  };

  const updateCartItem = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  };

  const clearForm = () => {
    setCustomerInfo({ id: '', name: '', phone: '', email: '', address: '' });
    setCartItems([]);
    setNotes('');
  };

  const totals = useMemo(() => {
    const subTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity * ((item.taxRate || 20) / 100)), 0);
    const total = subTotal + taxTotal;
    return { subTotal, taxTotal, total };
  }, [cartItems]);

  return {
    customerInfo,
    setCustomerInfo,
    updateCustomerInfo,
    cartItems,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearForm,
    notes,
    setNotes,
    totals
  };
}

export const Siparisler: React.FC = () => {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  
  // Custom Hook for modular state management
  const { 
    customerInfo, setCustomerInfo, updateCustomerInfo, 
    cartItems, addToCart, updateCartItem, removeFromCart, 
    clearForm, notes, setNotes, totals 
  } = useOrderForm();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Table State
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'total'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filtered Products
  const products = store.products || [];
  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 12);
    const lowerSearch = productSearch.toLowerCase();
    return products.filter(p => 
      p.name?.toLowerCase().includes(lowerSearch) || 
      p.code?.toLowerCase().includes(lowerSearch)
    ).slice(0, 12);
  }, [products, productSearch]);

  const addOrderToDB = async (order: Order) => {
    try {
      const tenantId = sessionStorage.getItem('esila_tenant_id') || '1111111111';
      const userId = sessionStorage.getItem('esila_user_id') || '';
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
          'x-user-id': userId
        },
        body: JSON.stringify(order)
      });

      let data;
      const text = await response.text();
      try { data = JSON.parse(text); } catch(e) { data = { error: text }; }

      if (!response.ok) {
        throw new Error(data?.error || text || 'Veritabanı kayıt hatası');
      }
      return data;
    } catch (error: any) {
      console.error("addOrder veritabanı kayıt hatası:", error);
      throw error;
    }
  };

  const handleCreateOrder = async () => {
    if (!customerInfo.name || cartItems.length === 0) {
      toast.error('Lütfen müşteri bilgilerini girin ve sepete ürün ekleyin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newOrder: Order = {
        id: crypto.randomUUID(),
        customerId: customerInfo.id || crypto.randomUUID(),
        customerName: customerInfo.name,
        date: new Date().toISOString(),
        items: cartItems,
        subTotal: totals.subTotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        status: OrderStatus.PENDING,
        notes: notes,
      };

      await addOrderToDB(newOrder);

      // Optimistic update
      store.setOrders((prev: Order[]) => [newOrder, ...(prev || [])]);
      
      toast.success('Sipariş başarıyla oluşturuldu!');
      clearForm();
      setActiveTab('history');
    } catch (error: any) {
      toast.error(error.message || 'Sipariş oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Select customer from existing
  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    if (!custId) {
      clearForm();
      return;
    }
    const cust = store.customers?.find((c: Customer) => c.id === custId);
    if (cust) {
      setCustomerInfo({
        id: cust.id,
        name: cust.name,
        phone: cust.phone || '',
        email: cust.email || '',
        address: cust.address || ''
      });
    }
  };

  // Filtered and Sorted Orders
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...(store.orders || [])];

    // Filter by search term
    if (orderSearch) {
      const term = orderSearch.toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(term) || 
        order.customerName.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'total') {
        comparison = a.total - b.total;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [store.orders, orderSearch, statusFilter, sortField, sortDirection]);

  const handleSort = (field: 'date' | 'total') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED: return 'bg-green-50 text-green-700 border-green-200';
      case OrderStatus.PENDING: return 'bg-amber-50 text-amber-700 border-amber-200';
      case OrderStatus.CANCELLED: return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50/50">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-gray-200 bg-white shadow-sm flex items-center justify-between z-10">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Sipariş Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-1">Sipariş oluşturun ve takip edin.</p>
        </div>
        <div className="flex items-center space-x-2 bg-gray-100/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'create' 
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yeni Sipariş
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history' 
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sipariş Geçmişi
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'create' ? (
          <div className="h-full flex flex-col lg:flex-row overflow-hidden">
            {/* Left Column: Form & Products */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
              
              {/* Customer Details Section */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <User className="w-5 h-5 text-blue-500 mr-2" />
                    Müşteri Bilgileri
                  </h2>
                  {store.customers && store.customers.length > 0 && (
                    <select 
                      className="text-sm border border-gray-200 rounded-lg text-gray-600 focus:ring-blue-500 focus:border-blue-500 py-1.5 px-3 bg-gray-50"
                      onChange={handleCustomerSelect}
                      value={customerInfo.id}
                    >
                      <option value="">-- Kayıtlı Müşteri Seç --</option>
                      {store.customers.map((c: Customer) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad / Ünvan *</label>
                    <input 
                      type="text" 
                      value={customerInfo.name}
                      onChange={e => updateCustomerInfo('name', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors outline-none"
                      placeholder="Müşteri Adı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input 
                      type="tel" 
                      value={customerInfo.phone}
                      onChange={e => updateCustomerInfo('phone', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors outline-none"
                      placeholder="05XX XXX XX XX"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                    <input 
                      type="text" 
                      value={customerInfo.address}
                      onChange={e => updateCustomerInfo('address', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors outline-none"
                      placeholder="Teslimat adresi"
                    />
                  </div>
                </div>
              </section>

              {/* Product Selection Section */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1 flex flex-col min-h-[400px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
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
                      className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64 transition-colors outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="group cursor-pointer border border-gray-100 rounded-xl p-4 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between bg-white relative overflow-hidden h-32"
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-blue-500 text-white rounded-full p-1.5 shadow-sm">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">{product.code}</div>
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{product.name}</h3>
                      </div>
                      <div className="mt-2 flex items-end justify-between">
                        <span className="text-sm font-semibold text-blue-600">
                          {(product.price || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </span>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                          Stok: {product.stock}
                        </span>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      Ürün bulunamadı.
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Right Column: Order Summary (Cart) */}
            <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-sm z-20">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <ShoppingCart className="w-5 h-5 text-blue-500 mr-2" />
                  Sipariş Özeti
                  <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {cartItems.length}
                  </span>
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-gray-200">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                      <ShoppingCart className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Sepetiniz boş</p>
                    <p className="text-xs text-gray-400 text-center">Sol taraftan ürün ekleyin</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map(item => (
                      <div key={item.productId} className="flex gap-3 items-start bg-gray-50/80 p-3 rounded-xl border border-gray-100/50 hover:border-gray-200 transition-colors">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate pr-4" title={item.productName}>
                            {item.productName}
                          </h4>
                          <div className="text-xs font-semibold text-blue-600 mt-1">
                            {(item.price || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button 
                            onClick={() => removeFromCart(item.productId)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1 -mr-1 -mt-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="flex items-center border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                            <button 
                              onClick={() => updateCartItem(item.productId, item.quantity - 1)}
                              className="px-2.5 py-1 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
                            >-</button>
                            <input 
                              type="number" 
                              value={item.quantity}
                              onChange={(e) => updateCartItem(item.productId, parseInt(e.target.value) || 0)}
                              className="w-10 text-center text-sm font-medium text-gray-900 bg-transparent border-x border-gray-200 py-1 outline-none appearance-none"
                              min="1"
                            />
                            <button 
                              onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                              className="px-2.5 py-1 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
                            >+</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Notes Field */}
                    <div className="pt-4 border-t border-gray-100">
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Sipariş Notu</label>
                      <textarea 
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none outline-none"
                        rows={2}
                        placeholder="Örn: Hediye paketi yapılacak..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Totals & Submit */}
              <div className="p-5 bg-gray-50 border-t border-gray-200 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Ara Toplam</span>
                  <span className="font-medium text-gray-900">{(totals.subTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>KDV</span>
                  <span className="font-medium text-gray-900">{(totals.taxTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">Genel Toplam</span>
                  <span className="text-xl font-bold text-blue-600">
                    {(totals.total || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </span>
                </div>
                
                <button
                  onClick={handleCreateOrder}
                  disabled={cartItems.length === 0 || !customerInfo.name || isSubmitting}
                  className={`w-full py-3.5 mt-4 rounded-xl flex items-center justify-center font-medium text-sm transition-all shadow-sm ${
                    cartItems.length > 0 && customerInfo.name && !isSubmitting
                      ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      İşleniyor...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Send className="w-4 h-4 mr-2" />
                      Siparişi Oluştur
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full p-6 overflow-y-auto bg-gray-50/50">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              
              {/* History Header & Controls */}
              <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-medium text-gray-900">Sipariş Geçmişi</h2>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Sipariş no veya müşteri..." 
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64 transition-colors outline-none"
                    />
                  </div>
                  
                  <div className="relative flex items-center">
                    <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none outline-none transition-colors"
                    >
                      <option value="all">Tüm Durumlar</option>
                      {Object.values(OrderStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center">
                          Sipariş No / Tarih
                          {sortField === 'date' && (
                            <ArrowUpDown className="w-3.5 h-3.5 ml-1.5 text-blue-500" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Müşteri</th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('total')}
                      >
                        <div className="flex items-center">
                          Tutar
                          {sortField === 'total' && (
                            <ArrowUpDown className="w-3.5 h-3.5 ml-1.5 text-blue-500" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredAndSortedOrders.map((order: Order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mr-3 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                              <FileText className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 font-mono group-hover:text-blue-600 transition-colors">
                                #{order.id.substring(0, 8).toUpperCase()}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {new Date(order.date).toLocaleString('tr-TR', { 
                                  day: '2-digit', month: 'short', year: 'numeric', 
                                  hour: '2-digit', minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                          {order.items?.length > 0 && (
                            <div className="text-xs text-gray-500 mt-0.5">{order.items.length} çeşit ürün</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {(order.total || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredAndSortedOrders.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                              <Search className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-base font-medium text-gray-900">Sipariş Bulunamadı</p>
                            <p className="text-sm text-gray-500">Arama kriterlerinize uygun sipariş eşleşmedi.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Placeholder (if needed later) */}
              {filteredAndSortedOrders.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 flex justify-between items-center">
                  <span>Toplam <strong>{filteredAndSortedOrders.length}</strong> sipariş gösteriliyor</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
