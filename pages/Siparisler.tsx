import React, { useState, useEffect } from 'react';
import { Plus, Printer, FileText, CheckCircle, XCircle, Trash2, Search, Save, X, ShoppingCart, User } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Order, OrderStatus, Customer, Product, OrderItem, CustomerTransaction, CashTransaction } from '../types';
import { useAppStore } from '../lib/store';
import { api } from '../lib/api';

export const Siparisler: React.FC = () => {
  const store = useAppStore();
  const orders = store.orders;
  const setOrders = store.setOrders;
  const customers = store.customers;
  const setCustomers = store.setCustomers;
  const transactions = store.transactions;
  const setTransactions = store.setTransactions;
  const cashTransactions = store.cashTransactions;
  const setCashTransactions = store.setCashTransactions;

  const products = store.products;
  const setProducts = store.setProducts;
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printType, setPrintType] = useState<'80mm' | 'A4'>('80mm');

  // New Order Form State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);
  const [taxToAdd, setTaxToAdd] = useState<number>(20);
  const [isPaid, setIsPaid] = useState<boolean>(true); // Peşin Tahsil Et

  // Derived state for new order total
  const cartSubTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartTaxTotal = cartItems.reduce((acc, item) => acc + ((item.price * item.quantity) * ((item.taxRate || 20) / 100)), 0);
  const cartTotal = cartSubTotal + cartTaxTotal;

  const handleOpenCreateModal = () => {
    setSelectedCustomer(null);
    setCartItems([]);
    setSelectedProductToAdd('');
    setQuantityToAdd(1);
    setIsPaid(true);
    setIsCreateModalOpen(true);
  };

  const addItemToCart = () => {
    if (!selectedProductToAdd) return;
    
    const product = products.find(p => String(p.id) === String(selectedProductToAdd));
    if (!product) return;

    const existingItemIndex = cartItems.findIndex(item => item.productId === product.id);

    if (existingItemIndex > -1) {
      const newItems = [...cartItems];
      newItems[existingItemIndex].quantity += quantityToAdd;
      newItems[existingItemIndex].taxRate = taxToAdd;
      setCartItems(newItems);
    } else {
      setCartItems([
        ...cartItems, 
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: quantityToAdd,
          taxRate: taxToAdd
        }
      ]);
    }
    setQuantityToAdd(1);
    setTaxToAdd(20);
    setSelectedProductToAdd('');
  };

  const removeItemFromCart = (index: number) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
  };

  const handleCreateOrder = () => {
    if (!selectedCustomer || cartItems.length === 0) return;

    const orderDate = new Date();
    const nextOrderId = `${store.settings.prefix_order || 'SIP'}-${store.settings.next_order_id || 1001}`;
    
    const newOrder: Order = {
      id: nextOrderId,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      date: orderDate.toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      subTotal: cartSubTotal,
      taxTotal: cartTaxTotal,
      total: cartTotal,
      status: OrderStatus.COMPLETED, // Mark as completed if we are integrating with cari directly, or pending. Let's say completed since it's an active sale.
      items: cartItems
    };

    setOrders([newOrder, ...orders]);
    store.setSettings({
      ...store.settings,
      next_order_id: (store.settings.next_order_id || 1001) + 1
    });

    // Reduce Stock
    let newProducts = [...products];
    cartItems.forEach(item => {
      const idx = newProducts.findIndex(p => String(p.id) === String(item.productId));
      if (idx !== -1) {
        let p = newProducts[idx];
        let remainingQuantity = item.quantity;
        let newWarehouseStocks = [...(p.warehouseStocks || [])];
        
        for (let i = 0; i < newWarehouseStocks.length; i++) {
            if (remainingQuantity <= 0) break;
            if (newWarehouseStocks[i].stock > 0) {
                const deduct = Math.min(newWarehouseStocks[i].stock, remainingQuantity);
                newWarehouseStocks[i] = { ...newWarehouseStocks[i], stock: newWarehouseStocks[i].stock - deduct };
                remainingQuantity -= deduct;
            }
        }

        newProducts[idx] = { 
            ...p, 
            stock: Math.max(0, p.stock - item.quantity),
            warehouseStocks: newWarehouseStocks
        };
      }
    });
    setProducts(newProducts);

    
    // 1. Cariye Satış İşle
    const newTransaction: CustomerTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      customerId: selectedCustomer.id,
      date: orderDate.toISOString().split('T')[0],
      type: 'Satış',
      amount: cartTotal,
      description: `Sipariş: ${newOrder.id}`
    };
    
    setTransactions([...transactions, newTransaction]);
    
    // Update Customer Balance (Satış means customer debt increases -> positive balance)
    let finalBalanceDelta = cartTotal;

    // 2. Eğer peşin ödendiyse, tahsilat işle
    if (isPaid) {
      const paymentTransaction: CustomerTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        customerId: selectedCustomer.id,
        date: orderDate.toISOString().split('T')[0],
        type: 'Tahsilat',
        amount: -cartTotal,
        description: `Sipariş Tahsilatı: ${newOrder.id}`
      };
      setTransactions(prev => [...prev, paymentTransaction]);
      
      const newCashTx: CashTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        date: orderDate.toISOString().split('T')[0],
        type: 'Gelir',
        category: 'Satış',
        amount: cartTotal,
        description: `Sipariş Tahsilatı (${selectedCustomer.companyName || selectedCustomer.name}): ${newOrder.id}`,
        customerId: selectedCustomer.id
      };
      setCashTransactions([...cashTransactions, newCashTx]);
      
      // Balance cancels out
      finalBalanceDelta = 0;
    }

    if (finalBalanceDelta !== 0) {
      const updatedCustomers = customers.map(c => {
        if (c.id === selectedCustomer.id) {
          return { ...c, balance: c.balance + finalBalanceDelta };
        }
        return c;
      });
      setCustomers(updatedCustomers);
    }

    setIsCreateModalOpen(false);
    
    // Auto open print modal for receipt
    setSelectedOrder(newOrder);
    setPrintType('80mm');
    setPrintModalOpen(true);
  };

  const handleStatusChange = (status: OrderStatus, targetOrder: Order) => {
    // Check if we're cancelling
    if (status === OrderStatus.CANCELLED && targetOrder.status !== OrderStatus.CANCELLED) {
      if (!window.confirm('Bu siparişi iptal etmek istediğinize emin misiniz? (Sipariş tutarı cariden düşülecektir)')) {
         return;
      }

      // Add cancellation transaction
      const cancellationTx: CustomerTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        customerId: targetOrder.customerId,
        date: new Date().toISOString().split('T')[0],
        type: 'Tahsilat',
        amount: -(targetOrder.total || (targetOrder as any).totalAmount || 0),
        description: `Sipariş İptali: ${targetOrder.id}`
      };
      setTransactions([...transactions, cancellationTx]);

      // Deduct from customer balance
      const updatedCustomers = customers.map(c => {
        if (c.id === targetOrder.customerId) {
          return { ...c, balance: c.balance - (targetOrder.total || (targetOrder as any).totalAmount || 0) };
        }
        return c;
      });
      setCustomers(updatedCustomers);
      
      // Restore stock
      let newProducts = [...products];
      (targetOrder.items || []).forEach(item => {
        const idx = newProducts.findIndex(p => String(p.id) === String(item.productId));
        if (idx !== -1) {
          let p = newProducts[idx];
          // Since we cannot perfectly know which warehouse it was deducted from in multi-warehouse scenarios without transaction logs,
          // we'll just add it to the first warehouse or the main stock.
          let newWarehouseStocks = [...(p.warehouseStocks || [])];
          if (newWarehouseStocks.length > 0) {
             newWarehouseStocks[0] = { ...newWarehouseStocks[0], stock: newWarehouseStocks[0].stock + item.quantity };
          }
          newProducts[idx] = { 
              ...p, 
              stock: p.stock + item.quantity,
              warehouseStocks: newWarehouseStocks
          };
        }
      });
      setProducts(newProducts);
    }

    const updatedOrders = orders.map(o => 
      o.id === targetOrder.id ? { ...o, status } : o
    );
    setOrders(updatedOrders);
    
    // Optimistic UI update for modal
    if (selectedOrder && selectedOrder.id === targetOrder.id) {
      setSelectedOrder({ ...selectedOrder, status });
    }
  };

  const handlePrintClick = (order: Order) => {
    setSelectedOrder(order);
    setPrintType('80mm'); // Default to receipt for quick print
    setPrintModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.COMPLETED: return 'text-emerald-600 bg-emerald-50';
      case OrderStatus.PENDING: return 'text-orange-600 bg-orange-50';
      case OrderStatus.CANCELLED: return 'text-red-600 bg-red-50';
      case OrderStatus.SHIPPED: return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <>
      <div className="space-y-6 no-print">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Siparişler</h2>
          <button 
            onClick={handleOpenCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Yeni Sipariş</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Sipariş No</th>
                <th className="px-6 py-4">Müşteri</th>
                <th className="px-6 py-4">Tarih</th>
                <th className="px-6 py-4">Tutar</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm">
                    <button 
                      onClick={() => { setSelectedOrder(order); setIsDetailsModalOpen(true); }}
                      className="text-emerald-600 hover:text-emerald-800 hover:underline font-semibold"
                    >
                      {order.id}
                    </button>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">{order.customerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.date}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {(order.total || (order as any).totalAmount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                    {order.status === OrderStatus.PENDING && (
                      <button
                        onClick={() => handleStatusChange(OrderStatus.COMPLETED, order)}
                        className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors"
                        title="Siparişi Onayla"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    {(order.status === OrderStatus.PENDING || order.status === OrderStatus.COMPLETED) && (
                      <button
                        onClick={() => handleStatusChange(OrderStatus.CANCELLED, order)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Siparişi İptal Et"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => handlePrintClick(order)}
                      className="text-gray-500 hover:text-emerald-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                      title="Fiş Yazdır"
                    >
                      <Printer size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {isDetailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in no-print" onClick={() => setIsDetailsModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <FileText className="text-emerald-600" />
                Sipariş Detayı
              </h3>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:p-6 mb-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Müşteri Bilgileri</h4>
                  <p className="font-medium text-gray-800">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Sipariş Bilgileri</h4>
                  <p><span className="text-gray-500">No:</span> <span className="font-medium text-gray-800">{selectedOrder.id}</span></p>
                  <p><span className="text-gray-500">Tarih:</span> <span className="font-medium text-gray-800">{selectedOrder.date}</span></p>
                  <p className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </p>
                </div>
              </div>
              
              <h4 className="text-sm font-semibold text-gray-500 mb-3 border-b pb-2">Sipariş Kalemleri</h4>
              <table className="w-full text-left mb-4">
                <thead className="bg-gray-50 text-gray-600 text-sm">
                  <tr>
                    <th className="py-2 px-3">Ürün</th>
                    <th className="py-2 px-3 text-right">Adet</th>
                    <th className="py-2 px-3 text-right">Birim Fiyat</th>
                    <th className="py-2 px-3 text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/50">
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx} className="text-sm text-gray-800">
                      <td className="py-2 px-3">{item.productName}</td>
                      <td className="py-2 px-3 text-right">{item.quantity}</td>
                      <td className="py-2 px-3 text-right">
                        {(item.price).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {(item.price * item.quantity).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <div className="w-64">
                   <div className="flex justify-between items-center text-lg font-bold">
                     <span className="text-gray-600">Genel Toplam:</span>
                     <span className="text-emerald-600">
                       {(selectedOrder.total || (selectedOrder as any).totalAmount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                     </span>
                   </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center rounded-b-xl">
               <div className="flex flex-wrap gap-2">
                 {selectedOrder.status === OrderStatus.PENDING && (
                   <button 
                     onClick={() => handleStatusChange(OrderStatus.COMPLETED, selectedOrder)}
                     className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors font-medium flex items-center gap-2"
                   >
                     <CheckCircle size={16} /> Onayla
                   </button>
                 )}
                 {(selectedOrder.status === OrderStatus.PENDING || selectedOrder.status === OrderStatus.COMPLETED) && (
                   <button 
                     onClick={() => handleStatusChange(OrderStatus.CANCELLED, selectedOrder)}
                     className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium flex items-center gap-2"
                   >
                     <XCircle size={16} /> İptal Et
                   </button>
                 )}
               </div>
               <div className="flex gap-3">
                 <button 
                   onClick={() => {
                     setPrintType('80mm');
                     setTimeout(() => {
                       window.print();
                     }, 100);
                   }}
                   className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors font-medium flex items-center gap-2"
                 >
                   <Printer size={18} />
                   Hızlı Fiş Yazdır
                 </button>
                 <button 
                   onClick={() => setIsDetailsModalOpen(false)} 
                   className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                 >
                   Kapat
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-emerald-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-emerald-900 flex items-center gap-2">
                <ShoppingCart className="text-emerald-600" />
                Yeni Sipariş Oluştur
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:p-6">
                
                {/* Left Column: Selection */}
                <div className="md:col-span-1 space-y-6">
                  {/* Customer Select */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <User size={16} /> Müşteri Seçimi
                    </label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      onChange={(e) => {
                        const cust = customers.find(c => c.id === e.target.value);
                        setSelectedCustomer(cust || null);
                      }}
                      value={selectedCustomer?.id || ''}
                    >
                      <option value="">Seçiniz...</option>
                      {customers.filter(c => c.type === 'Alıcı').map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>
                      ))}
                    </select>
                    {selectedCustomer && (
                       <div className="mt-3 text-xs text-gray-500 bg-white p-2 rounded border">
                          <p>Bakiye: {selectedCustomer.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                          <p>{selectedCustomer.address}</p>
                       </div>
                    )}
                  </div>

                  {/* Product Add */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Plus size={16} /> Ürün Ekle
                    </label>
                    <div className="space-y-3">
                      <div className="space-y-2 mb-3">
                        <input 
                          type="text"
                          placeholder="Ürün Ara (Ad veya Barkod/Kod)..."
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                        />
                        <div className="w-full border border-gray-300 rounded-lg overflow-y-auto max-h-32 bg-white flex flex-col text-sm">
                          {products.filter(p => !productSearch || (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.code || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.barcode || '').includes(productSearch)).map(p => (
                            <div 
                              key={p.id} 
                              onClick={() => setSelectedProductToAdd(String(p.id))}
                              className={`px-3 py-2 cursor-pointer border-b last:border-b-0 hover:bg-emerald-50 ${selectedProductToAdd === String(p.id) ? 'bg-emerald-100 text-emerald-800 font-medium' : 'text-gray-700'}`}
                            >
                              {p.code} - {p.name} - {(p.price || 0).toLocaleString('tr-TR')}₺
                            </div>
                          ))}
                          {products.filter(p => !productSearch || (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.code || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.barcode || '').includes(productSearch)).length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-center">Sonuç bulunamadı</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <input 
                          type="number" 
                          min="1"
                          title="Miktar"
                          className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 text-sm"
                          value={quantityToAdd}
                          onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 1)}
                        />
                        <select 
                          title="KDV Oranı"
                          className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 text-sm"
                          value={taxToAdd}
                          onChange={(e) => setTaxToAdd(parseInt(e.target.value))}
                        >
                          <option value="0">%0</option>
                          <option value="1">%1</option>
                          <option value="10">%10</option>
                          <option value="20">%20</option>
                        </select>
                        <button 
                          onClick={addItemToCart}
                          disabled={!selectedProductToAdd}
                          className="flex-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium transition-colors"
                        >
                          Listeye Ekle
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Basket */}
                <div className="md:col-span-2 flex flex-col h-full">
                  <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden flex flex-col">
                    <div className="bg-gray-100 px-4 py-2 border-b font-medium text-sm text-gray-600 flex">
                      <div className="flex-1">Ürün</div>
                      <div className="w-16 text-center">Adet</div>
                      <div className="w-16 text-center">KDV</div>
                      <div className="w-24 text-right">Tutar</div>
                      <div className="w-10"></div>
                    </div>
                    
                    <div className="flex-1 overflow-auto bg-white p-2 space-y-1">
                      {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <ShoppingCart size={48} className="mb-2 opacity-20" />
                          <p>Sepetiniz boş</p>
                        </div>
                      ) : (
                        cartItems.map((item, idx) => (
                          <div key={idx} className="flex items-center p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 transition-colors text-sm">
                             <div className="flex-1 font-medium text-gray-800">{item.productName}</div>
                             <div className="w-16 text-center text-gray-600">{item.quantity}</div>
                             <div className="w-16 text-center text-gray-500 text-xs">%{item.taxRate || 0}</div>
                             <div className="w-24 text-right font-semibold text-gray-800">
                               {((item.price * item.quantity) + (item.price * item.quantity * ((item.taxRate||20)/100))).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                             </div>
                             <div className="w-10 flex justify-end">
                               <button 
                                 onClick={() => removeItemFromCart(idx)}
                                 className="text-red-400 hover:text-red-600 p-1"
                               >
                                 <Trash2 size={16} />
                               </button>
                             </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="bg-gray-50 p-4 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-1 text-sm text-gray-600">
                        <span>Ara Toplam</span>
                        <span>{cartSubTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3 text-sm text-gray-600">
                        <span>KDV Tutarı</span>
                        <span>{cartTaxTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3 pt-2 border-t border-gray-200">
                        <span className="text-gray-800 font-bold">Genel Toplam</span>
                        <span className="text-2xl font-bold text-emerald-600">
                          {cartTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </span>
                      </div>
                      
                      {cartTotal > 0 && selectedCustomer && (
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                          <input 
                            type="checkbox" 
                            id="isPaid"
                            checked={isPaid}
                            onChange={(e) => setIsPaid(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <label htmlFor="isPaid" className="text-sm text-gray-700 select-none">
                            Tutar peşin olarak tahsil edildi (Kasa ve Cari'ye işlenecek)
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-white flex justify-end gap-3">
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Vazgeç
              </button>
              <button 
                onClick={handleCreateOrder}
                disabled={!selectedCustomer || cartItems.length === 0}
                className="px-8 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle size={20} />
                Siparişi Tamamla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {printModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="font-bold text-lg">Makbuz Yazdır</h3>
              <button onClick={() => setPrintModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-4 flex gap-4 border-b bg-gray-50">
               <button 
                 onClick={() => setPrintType('80mm')}
                 className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${printType === '80mm' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:border-gray-300'}`}
               >
                 <div className="flex flex-col items-center gap-1">
                   <FileText size={24} />
                   <span className="font-medium">80mm Termal (Fiş)</span>
                 </div>
               </button>
               <button 
                 onClick={() => setPrintType('A4')}
                 className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${printType === 'A4' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:border-gray-300'}`}
               >
                 <div className="flex flex-col items-center gap-1">
                   <FileText size={24} className="scale-125" />
                    <span className="font-medium">A4 Normal</span>
                  </div>
                </button>
             </div>

             <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-200 flex justify-center">
              {/* Preview Area */}
              <div className={`bg-white text-black transition-all duration-300 ${printType === '80mm' ? 'w-[300px] shadow-lg p-4' : 'w-[800px] shadow-xl'}`}>
                 {printType === 'A4' ? (
                   // A4 LAYOUT
                   <>
                     <style>
                        {`
                          @media print {
                            .print-only body { color: #000; font-family: 'Times New Roman', Times, serif; }
                            table { border-collapse: collapse; }
                            td, th { padding: 8px; border: 1px solid #000; text-align: left; }
                          }
                          .contract-style-header {
                            font-family: Arial, sans-serif;
                          }
                          .contract-table th, .contract-table td {
                            border: 1px solid #000;
                            padding: 10px;
                            font-size: 14px;
                          }
                        `}
                     </style>
                     <div className="contract-style-header bg-white text-black p-8 mx-auto" style={{ maxWidth: '800px' }}>
                        <h2 className="text-center text-2xl font-bold mb-10 tracking-wider">SİPARİŞ FORMU</h2>
                        
                        <div className="flex justify-between mb-8">
                           <div className="flex items-center gap-2">
                              <span className="font-semibold w-24">Sipariş No</span>
                              <span>: {selectedOrder.id}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="font-semibold w-28">Tarih</span>
                              <span>: {selectedOrder.date}</span>
                           </div>
                        </div>

                        <div className="mb-8">
                           <h3 className="font-bold mb-4">Müşteri Bilgileri :</h3>
                           <div className="grid grid-cols-[120px_1fr] gap-2 mb-2 items-center">
                              <span className="font-semibold">Firma Adı</span>
                              <span className="border-b border-black pb-1">: {selectedOrder.customerName || '______________________________________'}</span>
                           </div>
                           <div className="grid grid-cols-[120px_1fr] gap-2 mb-2 items-center">
                              <span className="font-semibold">Satıcı</span>
                              <span className="border-b border-black pb-1">: {store.settings.companyName || '______________________________________'}</span>
                           </div>
                        </div>

                        <div className="mb-4">
                           <h3 className="font-bold mb-4">Sipariş Detayları :</h3>
                           <table className="w-full contract-table border-collapse border border-black mb-6">
                             <thead>
                               <tr className="bg-gray-50">
                                 <th className="font-bold border border-black w-1/2 text-left">Ürün/Hizmet</th>
                                 <th className="font-bold border border-black text-center">Miktar</th>
                                 <th className="font-bold border border-black text-right">Birim Fiyat (TL)</th>
                                 <th className="font-bold border border-black text-right">Toplam (TL)</th>
                               </tr>
                             </thead>
                             <tbody>
                               {selectedOrder.items.map((item, idx) => {
                                 const netAmount = (item.price * item.quantity) + (item.price * item.quantity * ((item.taxRate || 0) / 100));
                                 return (
                                   <tr key={idx}>
                                     <td className="border border-black text-left">{item.productName}</td>
                                     <td className="border border-black text-center">{item.quantity}</td>
                                     <td className="border border-black text-right">
                                       {(item.price || (item as any).unitPrice || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                     </td>
                                     <td className="border border-black text-right">
                                       {netAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                     </td>
                                   </tr>
                                 );
                               })}
                             </tbody>
                           </table>

                           <div className="flex justify-end mb-12">
                              <div className="w-64">
                                 <div className="grid grid-cols-2 gap-2 mb-2 text-right">
                                    <span className="font-bold">Ara Toplam :</span>
                                    <span>{(selectedOrder.subTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2 mb-2 text-right">
                                    <span className="font-bold">KDV Tutarı :</span>
                                    <span>{(selectedOrder.taxTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2 mt-4 text-right">
                                    <span className="font-bold">Genel Toplam :</span>
                                    <span className="font-bold">{(selectedOrder.total || (selectedOrder as any).totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="mt-8 flex justify-between items-start">
                           <div>
                             <h3 className="font-bold mb-2">Notlar :</h3>
                             <p className="text-sm whitespace-pre-line">{store.settings.printer_footer_text || 'Bizi tercih ettiğiniz için teşekkür ederiz.'}</p>
                           </div>
                           <div className="text-center">
                             <QRCodeSVG value={`${window.location.origin}/siparisler?id=${selectedOrder.id}`} size={80} level="M" />
                             <p className="text-[10px] mt-1 text-gray-500">Siparişi Doğrula</p>
                           </div>
                        </div>

                        <div className="flex justify-between px-10 text-center mt-16">
                           <div>
                             <p className="font-bold mb-8">Teslim Eden</p>
                             <div className="flex items-end gap-2">
                                <span>İmza :</span>
                                <span className="inline-block w-48 border-b border-black"></span>
                             </div>
                           </div>
                           <div>
                             <p className="font-bold mb-8">Teslim Alan</p>
                             <div className="flex items-end gap-2">
                                <span>İmza :</span>
                                <span className="inline-block w-48 border-b border-black"></span>
                             </div>
                           </div>
                        </div>
                     </div>
                   </>
                 ) : (
                   // 80MM LAYOUT
                   <div style={{ fontSize: '12px' }}>
                     <div className="text-center mb-6">
                        {store.settings.companyLogo ? (
                          <img src={store.settings.companyLogo} alt="Logo" className="max-h-16 object-contain mx-auto mb-2" />
                        ) : (
                          <h1 className="font-logo text-4xl mb-2 text-black">{store.settings.printer_header_text || 'esila'}</h1>
                        )}
                        <p className="text-xs font-medium">{store.settings.companyName}</p>
                        <p className="text-xs whitespace-pre-line">{store.settings.address}</p>
                        {store.settings.taxOffice && store.settings.taxNumber && (
                          <p className="text-xs mt-1">{store.settings.taxOffice} - VKN: {store.settings.taxNumber}</p>
                        )}
                        <p className="text-xs uppercase mt-2 font-bold tracking-widest border-y border-black py-1">Sipariş Fişi</p>
                     </div>
                     
                     <div className="border-b-2 border-dashed border-gray-300 my-4"></div>
                     
                     <div className="mb-4">
                        <p><strong>Tarih:</strong> {selectedOrder.date}</p>
                        <p><strong>Sipariş No:</strong> {selectedOrder.id}</p>
                        <p><strong>Müşteri:</strong> {selectedOrder.customerName}</p>
                     </div>

                     <table className="w-full mb-4">
                       <thead>
                         <tr className="border-b border-gray-300 text-left">
                           <th className="py-1">Ürün</th>
                           <th className="py-1 text-right">Mik.</th>
                           <th className="py-1 text-right">Tutar</th>
                         </tr>
                       </thead>
                       <tbody>
                         {selectedOrder.items.map((item, idx) => (
                           <tr key={idx} className="border-b border-gray-100">
                             <td className="py-1">{item.productName}</td>
                             <td className="py-1 text-right">{item.quantity}</td>
                             <td className="py-1 text-right">
                               {((item.price * item.quantity) + (item.price * item.quantity * ((item.taxRate || 0) / 100))).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>

                     <div className="flex justify-end mb-6">
                       <div className="text-right w-full border-t border-gray-300 pt-2 border-dashed mt-2">
                         <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                           <span>Ara Toplam:</span>
                           <span>{(selectedOrder.subTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                           <span>KDV:</span>
                           <span>{(selectedOrder.taxTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                         </div>
                         <div className="flex justify-between items-center text-lg font-bold border-t border-gray-300 pt-1 mt-1">
                           <span>Genel Toplam:</span>
                           <span>{(selectedOrder.total || (selectedOrder as any).totalAmount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                         </div>
                       </div>
                     </div>

                     <div className="text-center text-xs text-gray-500 mt-8 flex flex-col items-center">
                       <QRCodeSVG value={`${window.location.origin}/siparisler?id=${selectedOrder.id}`} size={64} level="M" className="mb-2" />
                       <p className="mb-2">Siparişi Doğrula</p>
                       <p className="whitespace-pre-line">{store.settings.printer_footer_text}</p>
                     </div>
                   </div>
                 )}
              </div>
            </div>

            <div className="p-4 border-t bg-white rounded-b-xl flex justify-end gap-3">
              <button 
                onClick={() => setPrintModalOpen(false)} 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Kapat
              </button>
              <button 
                onClick={handlePrint} 
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Printer size={18} />
                Yazdır
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actual Print Content (Hidden normally, shown on print) */}
      {selectedOrder && (
        <div className="print-only">
          <div className="mx-auto">
             {printType === 'A4' ? (
               // A4 LAYOUT
               <>
                 <style>
                    {`
                      @media print {
                        .print-only body { color: #000; font-family: 'Times New Roman', Times, serif; }
                        table { border-collapse: collapse; }
                        td, th { padding: 8px; border: 1px solid #000; text-align: left; }
                      }
                      .contract-style-header {
                        font-family: Arial, sans-serif;
                      }
                      .contract-table th, .contract-table td {
                        border: 1px solid #000;
                        padding: 10px;
                        font-size: 14px;
                      }
                    `}
                 </style>
                 <div className="contract-style-header bg-white text-black p-8 mx-auto" style={{ maxWidth: '800px' }}>
                    <h2 className="text-center text-2xl font-bold mb-10 tracking-wider">SİPARİŞ FORMU</h2>
                    
                    <div className="flex justify-between mb-8">
                       <div className="flex items-center gap-2">
                          <span className="font-semibold w-24">Sipariş No</span>
                          <span>: {selectedOrder.id}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="font-semibold w-28">Tarih</span>
                          <span>: {selectedOrder.date}</span>
                       </div>
                    </div>

                    <div className="mb-8">
                       <h3 className="font-bold mb-4">Müşteri Bilgileri :</h3>
                       <div className="grid grid-cols-[120px_1fr] gap-2 mb-2 items-center">
                          <span className="font-semibold">Firma Adı</span>
                          <span className="border-b border-black pb-1">: {selectedOrder.customerName || '______________________________________'}</span>
                       </div>
                       <div className="grid grid-cols-[120px_1fr] gap-2 mb-2 items-center">
                          <span className="font-semibold">Satıcı</span>
                          <span className="border-b border-black pb-1">: {store.settings.companyName || '______________________________________'}</span>
                       </div>
                    </div>

                    <div className="mb-4">
                       <h3 className="font-bold mb-4">Sipariş Detayları :</h3>
                       <table className="w-full contract-table border-collapse border border-black mb-6">
                         <thead>
                           <tr className="bg-gray-50">
                             <th className="font-bold border border-black w-1/2 text-left">Ürün/Hizmet</th>
                             <th className="font-bold border border-black text-center">Miktar</th>
                             <th className="font-bold border border-black text-right">Birim Fiyat (TL)</th>
                             <th className="font-bold border border-black text-right">Toplam (TL)</th>
                           </tr>
                         </thead>
                         <tbody>
                           {selectedOrder.items.map((item, idx) => {
                             const netAmount = (item.price * item.quantity) + (item.price * item.quantity * ((item.taxRate || 0) / 100));
                             return (
                               <tr key={idx}>
                                 <td className="border border-black text-left">{item.productName}</td>
                                 <td className="border border-black text-center">{item.quantity}</td>
                                 <td className="border border-black text-right">
                                   {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                 </td>
                                 <td className="border border-black text-right">
                                   {netAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                 </td>
                               </tr>
                             );
                           })}
                         </tbody>
                       </table>

                       <div className="flex justify-end mb-12">
                          <div className="w-64">
                             <div className="grid grid-cols-2 gap-2 mb-2 text-right">
                                <span className="font-bold">Ara Toplam :</span>
                                <span>{(selectedOrder.subTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="grid grid-cols-2 gap-2 mb-2 text-right">
                                <span className="font-bold">KDV Tutarı :</span>
                                <span>{(selectedOrder.taxTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="grid grid-cols-2 gap-2 mt-4 text-right">
                                <span className="font-bold">Genel Toplam :</span>
                                <span className="font-bold">{(selectedOrder.total || (selectedOrder as any).totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="mt-8 flex justify-between items-start">
                       <div>
                         <h3 className="font-bold mb-2">Notlar :</h3>
                         <p className="text-sm whitespace-pre-line">{store.settings.printer_footer_text || 'Bizi tercih ettiğiniz için teşekkür ederiz.'}</p>
                       </div>
                       <div className="text-center">
                         <QRCodeSVG value={`${window.location.origin}/siparisler?id=${selectedOrder.id}`} size={80} level="M" />
                         <p className="text-[10px] mt-1 text-gray-500">Siparişi Doğrula</p>
                       </div>
                    </div>

                    <div className="flex justify-between px-10 text-center mt-16">
                       <div>
                         <p className="font-bold mb-8">Teslim Eden</p>
                         <div className="flex items-end gap-2">
                            <span>İmza :</span>
                            <span className="inline-block w-48 border-b border-black"></span>
                         </div>
                       </div>
                       <div>
                         <p className="font-bold mb-8">Teslim Alan</p>
                         <div className="flex items-end gap-2">
                            <span>İmza :</span>
                            <span className="inline-block w-48 border-b border-black"></span>
                         </div>
                       </div>
                    </div>
                 </div>
               </>
             ) : (
               // 80MM LAYOUT
               <div className="w-[300px] mx-auto text-black" style={{ fontSize: '12px' }}>
                 <div className="text-center mb-6">
                    {store.settings.companyLogo ? (
                      <img src={store.settings.companyLogo} alt="Logo" className="max-h-16 object-contain mx-auto mb-2" />
                    ) : (
                      <h1 className="font-logo text-4xl mb-2 text-black">{store.settings.printer_header_text || 'esila'}</h1>
                    )}
                    <p className="text-xs font-medium">{store.settings.companyName}</p>
                    <p className="text-xs whitespace-pre-line">{store.settings.address}</p>
                    {store.settings.taxOffice && store.settings.taxNumber && (
                       <p className="text-xs mt-1">{store.settings.taxOffice} - VKN: {store.settings.taxNumber}</p>
                    )}
                    <p className="text-xs uppercase mt-2 font-bold tracking-widest border-y border-black py-1">Sipariş Fişi</p>
                 </div>
                 
                 <div className="mb-4 text-sm">
                    <p><strong>Tarih:</strong> {selectedOrder.date}</p>
                    <p><strong>Fiş No:</strong> {selectedOrder.id}</p>
                    <p><strong>Müşteri:</strong> {selectedOrder.customerName}</p>
                 </div>

                 <table className="w-full mb-4 text-sm">
                   <thead>
                     <tr className="border-b border-black text-left">
                       <th className="py-1">Ürün</th>
                       <th className="py-1 text-right">Adet</th>
                       <th className="py-1 text-right">Tutar</th>
                     </tr>
                   </thead>
                   <tbody>
                     {selectedOrder.items.map((item, idx) => (
                       <tr key={idx} className="border-b border-gray-300">
                         <td className="py-1">{item.productName}</td>
                         <td className="py-1 text-right">{item.quantity}</td>
                         <td className="py-1 text-right">
                           {(item.price * item.quantity).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>

                 <div className="flex justify-end mb-6">
                   <div className="text-right w-full border-t border-black pt-2 border-dashed mt-2">
                     <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                       <span>Ara Toplam:</span>
                       <span>{(selectedOrder.subTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                       <span>KDV:</span>
                       <span>{(selectedOrder.taxTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                     </div>
                     <div className="flex justify-between items-center text-lg font-bold border-t border-black pt-1 mt-1">
                       <span>Genel Toplam:</span>
                       <span>{(selectedOrder.total || (selectedOrder as any).totalAmount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="text-center text-xs mt-8 flex flex-col items-center">
                   <QRCodeSVG value={`${window.location.origin}/siparisler?id=${selectedOrder.id}`} size={64} level="M" className="mb-2" />
                   <p className="mb-2">Siparişi Doğrula</p>
                   <p className="whitespace-pre-line">{store.settings.printer_footer_text || 'Teşekkür Ederiz'}</p>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}
    </>
  );
};