import React, { useState, useEffect } from 'react';
import { Plus, Printer, FileText, CheckCircle, XCircle, Trash2, Search, Save, X, ShoppingCart, User } from 'lucide-react';
import { Order, OrderStatus, Customer, Product, OrderItem } from '../types';

// Mock Data for Dropdowns (In a real app, these would come from the API/Context)
const SELECTABLE_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@mail.com', phone: '0555 123 45 67', address: 'İstanbul, Kadıköy', balance: 1500 },
  { id: '2', name: 'Ayşe Demir', email: 'ayse@mail.com', phone: '0532 987 65 43', address: 'Ankara, Çankaya', balance: -500 },
  { id: '3', name: 'Mehmet Kaya', email: 'mehmet@mail.com', phone: '0544 333 22 11', address: 'İzmir, Karşıyaka', balance: 0 },
  { id: '4', name: 'Esila Teknoloji', email: 'info@esila.com', phone: '0850 888 99 00', address: 'Bursa, Nilüfer', balance: 12000 },
];

const SELECTABLE_PRODUCTS: Product[] = [
  { id: '1', code: 'PRD-001', name: 'Kablosuz Kulaklık', price: 1250.00, stock: 45, category: 'Elektronik' },
  { id: '2', code: 'PRD-002', name: 'Akıllı Saat', price: 3400.00, stock: 12, category: 'Elektronik' },
  { id: '3', code: 'PRD-003', name: 'Laptop Çantası', price: 450.00, stock: 120, category: 'Aksesuar' },
  { id: '4', code: 'PRD-004', name: 'USB-C Kablo', price: 150.00, stock: 200, category: 'Aksesuar' },
  { id: '5', code: 'PRD-005', name: 'Mekanik Klavye', price: 2100.00, stock: 8, category: 'Elektronik' },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'SIP-2023-001',
    customerId: '1',
    customerName: 'Ahmet Yılmaz',
    date: '2023-10-25 14:30',
    total: 2500.00,
    status: OrderStatus.COMPLETED,
    items: [
      { productId: '1', productName: 'Kablosuz Kulaklık', quantity: 2, price: 1250.00 }
    ]
  }
];

export const Siparisler: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printType, setPrintType] = useState<'80mm' | 'A4'>('80mm');

  // New Order Form State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);

  // Derived state for new order total
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleOpenCreateModal = () => {
    setSelectedCustomer(null);
    setCartItems([]);
    setSelectedProductToAdd('');
    setQuantityToAdd(1);
    setIsCreateModalOpen(true);
  };

  const addItemToCart = () => {
    if (!selectedProductToAdd) return;
    
    const product = SELECTABLE_PRODUCTS.find(p => p.id === selectedProductToAdd);
    if (!product) return;

    const existingItemIndex = cartItems.findIndex(item => item.productId === product.id);

    if (existingItemIndex > -1) {
      const newItems = [...cartItems];
      newItems[existingItemIndex].quantity += quantityToAdd;
      setCartItems(newItems);
    } else {
      setCartItems([
        ...cartItems, 
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: quantityToAdd
        }
      ]);
    }
    setQuantityToAdd(1);
    setSelectedProductToAdd('');
  };

  const removeItemFromCart = (index: number) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
  };

  const handleCreateOrder = () => {
    if (!selectedCustomer || cartItems.length === 0) return;

    const newOrder: Order = {
      id: `SIP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      date: new Date().toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      total: cartTotal,
      status: OrderStatus.PENDING,
      items: cartItems
    };

    setOrders([newOrder, ...orders]);
    setIsCreateModalOpen(false);
    
    // Auto open print modal for receipt
    setSelectedOrder(newOrder);
    setPrintType('80mm');
    setPrintModalOpen(true);
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">{order.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{order.customerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.date}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {order.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
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

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-emerald-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-emerald-900 flex items-center gap-2">
                <ShoppingCart className="text-emerald-600" />
                Yeni Sipariş Oluştur
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
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
                        const cust = SELECTABLE_CUSTOMERS.find(c => c.id === e.target.value);
                        setSelectedCustomer(cust || null);
                      }}
                      value={selectedCustomer?.id || ''}
                    >
                      <option value="">Seçiniz...</option>
                      {SELECTABLE_CUSTOMERS.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {selectedCustomer && (
                       <div className="mt-3 text-xs text-gray-500 bg-white p-2 rounded border">
                          <p>Bakiye: {selectedCustomer.balance} ₺</p>
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
                      <select 
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        value={selectedProductToAdd}
                        onChange={(e) => setSelectedProductToAdd(e.target.value)}
                      >
                        <option value="">Ürün Seçiniz...</option>
                        {SELECTABLE_PRODUCTS.map(p => (
                          <option key={p.id} value={p.id}>{p.code} - {p.name} ({p.price}₺)</option>
                        ))}
                      </select>
                      
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          min="1"
                          className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 text-sm"
                          value={quantityToAdd}
                          onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 1)}
                        />
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
                      <div className="w-20 text-center">Adet</div>
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
                             <div className="w-20 text-center text-gray-600">{item.quantity}</div>
                             <div className="w-24 text-right font-semibold text-gray-800">
                               {(item.price * item.quantity).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
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
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Toplam Tutar</span>
                        <span className="text-2xl font-bold text-emerald-600">
                          {cartTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </span>
                      </div>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
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

            <div className="flex-1 overflow-auto p-8 bg-gray-200 flex justify-center">
              {/* Preview Area */}
              <div 
                className={`bg-white shadow-lg text-black p-4 transition-all duration-300 ${printType === '80mm' ? 'w-[300px]' : 'w-[595px]'}`}
                style={{ fontSize: printType === '80mm' ? '12px' : '14px' }}
              >
                 <div className="text-center mb-6">
                    <h1 className="font-logo text-4xl mb-2 text-emerald-900">esila</h1>
                    <p className="text-xs text-gray-500">Esila Ticari Yazılımları A.Ş.</p>
                    <p className="text-xs text-gray-500">Atatürk Cad. No:1, İstanbul</p>
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
                           {(item.price * item.quantity).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>

                 <div className="flex justify-end mb-6">
                   <div className="text-right">
                     <p className="font-bold text-lg">Toplam: {selectedOrder.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                     <p className="text-xs text-gray-500">KDV Dahildir</p>
                   </div>
                 </div>

                 <div className="text-center text-xs text-gray-500 mt-8">
                   <p>Bizi tercih ettiğiniz için teşekkürler!</p>
                   <p>www.esilaticari.com</p>
                 </div>
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
          <div className={`${printType === '80mm' ? 'max-w-[300px]' : 'max-w-[100%]'} mx-auto`}>
             <div className="text-center mb-6">
                <h1 className="font-logo text-4xl mb-2 text-black">esila</h1>
                <p className="text-xs">Esila Ticari Yazılımları A.Ş.</p>
             </div>
             
             <div className="border-b border-black my-4"></div>
             
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
               <div className="text-right">
                 <p className="font-bold text-lg">Toplam: {selectedOrder.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
               </div>
             </div>
             
             <div className="text-center text-xs mt-8">
               <p>Teşekkür Ederiz</p>
             </div>
          </div>
        </div>
      )}
    </>
  );
};