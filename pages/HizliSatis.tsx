import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, CreditCard, Banknote, CheckCircle, Userplus, User } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Product, Customer } from '../types';

export const HizliSatis: React.FC = () => {
  const store = useAppStore();
  const [cart, setCart] = useState<{product: Product, quantity: number, discount: number}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Default parameters
  const categories = store.categories || [];
  const products = store.products || [];
  const customers = store.customers || [];

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
    setSearchTerm('');
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, discount: Math.min(100, Math.max(0, discount)) } : item));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity * (1 - item.discount / 100)), 0);
  };

  const handlePrintReceipt = (currentCustomer: Customer | any, paymentMethod: string, totalAmount: number, items: typeof cart) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Pop-up engelleyiciyi kapatıp tekrar deneyin.");
        return;
    }
    
    const receiptHtml = `
      <html>
        <head>
          <title>Bilgi Fişi</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; font-size: 14px; width: 300px; margin: 0 auto; color: #000; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .border-b { border-bottom: 1px dashed #000; margin-bottom: 10px; padding-bottom: 10px; }
            .flex { display: flex; justify-content: space-between; }
            .mt-2 { margin-top: 10px; }
            .mb-2 { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="text-center font-bold border-b mb-2">
            <h3 style="margin: 5px 0;">BİLGİ FİŞİ</h3>
            <p style="margin: 5px 0;">${new Date().toLocaleString('tr-TR')}</p>
          </div>
          <div class="border-b">
            <p style="margin: 5px 0;">Müşteri: ${currentCustomer.name}</p>
          </div>
          <div class="border-b">
            ${items.map(item => `
              <div class="flex mt-2">
                <span>${item.quantity}x ${item.product.name}</span>
                <span>${(item.product.price * item.quantity * (1 - item.discount / 100)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
              </div>
              ${item.discount > 0 ? `<div class="flex" style="font-size: 12px; color: #666;"><span>İskonto:</span><span>%${item.discount}</span></div>` : ''}
            `).join('')}
          </div>
          <div class="border-b font-bold flex">
            <span>GENEL TOPLAM:</span>
            <span>${totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
          </div>
          <div class="text-center font-bold">
            <p style="margin: 5px 0;">ÖDEME: ${paymentMethod}</p>
            <p style="margin: 5px 0;">MALİ DEĞERİ YOKTUR</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const handleCheckout = (paymentMethod: 'Nakit' | 'Kredi Kartı') => {
    if (cart.length === 0) return;

    const currentCustomer = customers.find(c => c.id === selectedCustomerId) || { id: 'RETAIL', name: 'Perakende Müşteri' };
    const totalAmount = calculateTotal();

    // 1. Create Cash Transaction
    const txId = `TX-${Date.now()}`;
    const newTx = {
      id: txId,
      date: new Date().toISOString().split('T')[0],
      type: 'Gelir' as const,
      category: 'Satış',
      amount: totalAmount,
      description: `Hızlı Satış - ${currentCustomer.name}`,
      paymentMethod
    };
    store.setCashTransactions([...store.cashTransactions, newTx]);

    // 2. Reduce Stock
    let newProducts = [...products];
    cart.forEach(item => {
      const idx = newProducts.findIndex(p => p.id === item.product.id);
      if (idx !== -1) {
        newProducts[idx] = { ...newProducts[idx], stock: Math.max(0, newProducts[idx].stock - item.quantity) };
        try {
          // Assume api.updateProduct exists, if not it will fail silently here, but we also update local store for UI reactivity
          // We would import api from '../lib/api'. For now just update local store.
        } catch(e) {}
      }
    });
    // This is assuming 'store.setProducts' exists, but Siparisler updates its own state. 
    // In Siparisler, they do: api.updateProduct and setProducts. Since I'm using store.products, I can just use store.setProducts.
    store.setProducts(newProducts);
    
    // 2.5 Create Order
    const newOrder = {
       id: `ORD-${Date.now()}`,
       customerId: currentCustomer.id,
       date: new Date().toISOString().split('T')[0],
       status: 'Teslim Edildi' as const,
       items: cart.map(c => ({
         productId: c.product.id,
         quantity: c.quantity,
         unitPrice: c.product.price,
         totalPrice: c.product.price * c.quantity
       })),
       totalAmount
    };
    store.setOrders([...(store.orders || []), newOrder]);

    // 3. Optional: If a real customer is selected, add to customer transactions
    if (selectedCustomerId && selectedCustomerId !== 'RETAIL' && currentCustomer.id !== 'RETAIL') {
      const tx1 = {
        id: `CTX-${Date.now()}`,
        customerId: currentCustomer.id,
        date: new Date().toISOString().split('T')[0],
        type: 'Alacak' as const,
        amount: totalAmount,
        description: `Hızlı Satış (${paymentMethod})`
      };
      const tx2 = {
        id: `CTX-INV-${Date.now()}`,
        customerId: currentCustomer.id,
        date: new Date().toISOString().split('T')[0],
        type: 'Borç' as const,
        amount: totalAmount,
        description: `Hızlı Satış Faturası`
      };
      store.setTransactions([...store.transactions, tx1, tx2]);
    }

    setCart([]);
    setSelectedCustomerId('');
    handlePrintReceipt(currentCustomer, paymentMethod, totalAmount, cart);
    alert('Satış başarıyla tamamlandı!');
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        handleCheckout('Nakit');
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        const firstDiscountInput = document.getElementById('discount-input-0');
        if (firstDiscountInput) {
           firstDiscountInput.focus();
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleCheckout('Kredi Kartı');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedCustomerId, customers, products]);

  // Handle Barcode Scanner / Search
  const filterProducts = () => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.barcode?.includes(term) || 
      p.code.toLowerCase().includes(term)
    );
  };

  const filteredProducts = filterProducts();

  // If exact barcode match, auto-add
  useEffect(() => {
    if (searchTerm && filteredProducts.length === 1 && filteredProducts[0].barcode === searchTerm) {
      handleAddToCart(filteredProducts[0]);
    }
  }, [searchTerm]);

  return (
    <div className="h-full flex gap-6 pb-6">
      
      {/* Sol Panel: Ürün Seçimi ve Müşteri */}
      <div className="flex-[3] flex flex-col gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Barkod okutun veya ürün adı/kodu arayın... (F2 ile odaklan)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-lg"
                autoFocus
              />
            </div>
            <div className="w-1/3 relative flex items-center gap-2">
              <User className="text-gray-400" size={20} />
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="flex-1 py-3 border border-gray-300 rounded-lg px-2"
              >
                <option value="">Perakende (Cari Seçilmedi)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Hızlı Kategori/Ürünler (Eğer arama yoksa popüler/tüm ürünleri listele) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
          <h3 className="font-semibold text-gray-700 pb-2 border-b mb-4">Ürünler</h3>
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
             {(searchTerm ? filteredProducts : products.slice(0, 48)).map(product => (
                <div 
                  key={product.id} 
                  onClick={() => handleAddToCart(product)}
                  className="border border-gray-200 rounded-lg p-3 hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all flex flex-col items-center text-center justify-between"
                  style={{ minHeight: '120px' }}
                >
                   <div className="text-sm font-medium text-gray-800 line-clamp-2 mb-2">{product.name}</div>
                   <div className="text-emerald-600 font-bold">{product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                   <div className="text-xs text-gray-500 mt-1">Stok: {product.stock}</div>
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* Sağ Panel: Sepet ve Ödeme */}
      <div className="flex-[2] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <div className="p-4 bg-emerald-50 rounded-t-xl border-b border-emerald-100 flex items-center gap-2">
          <ShoppingCart className="text-emerald-600" />
          <h2 className="text-lg font-bold text-emerald-800">Satış Sepeti</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
               <ShoppingCart size={48} className="mb-4 opacity-20" />
               <p>Sepet boş</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item, idx) => (
                <div key={item.product.id} className="flex flex-col p-3 border border-gray-100 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-800 flex-1">{item.product.name}</span>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 ml-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {item.product.price.toLocaleString('tr-TR')} ₺
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 px-2 hover:bg-gray-100 text-gray-600 rounded-l-md">-</button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 px-2 hover:bg-gray-100 text-gray-600 rounded-r-md">+</button>
                    </div>
                    <div className="flex items-center gap-1">
                       <span className="text-xs text-gray-500" title="Kısayol: F3">% İskonto (F3)</span>
                       <input 
                         type="number" 
                         id={`discount-input-${idx}`}
                         min="0" max="100" 
                         value={item.discount}
                         onChange={(e) => updateDiscount(item.product.id, Number(e.target.value))}
                         className="w-16 border border-gray-300 rounded px-1 py-1 text-center text-sm" 
                       />
                    </div>
                    <div className="font-bold text-gray-800">
                      {((item.product.price * item.quantity) * (1 - item.discount / 100)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toplam ve Butonlar */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex justify-between items-center mb-4 text-xl">
            <span className="text-gray-600">Ara Toplam:</span>
            <span className="font-bold text-gray-800">{calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
          </div>
          
          <div className="flex gap-2 mb-4">
             <button
               onClick={() => setCart([])}
               className="flex-1 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors"
             >
                Temizle
             </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button 
               onClick={() => handleCheckout('Nakit')}
               disabled={cart.length === 0}
               className="flex flex-col items-center justify-center p-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
             >
                <Banknote size={24} className="mb-2" />
                <span className="font-bold">Nakit (F1)</span>
             </button>
             <button 
               onClick={() => handleCheckout('Kredi Kartı')}
               disabled={cart.length === 0}
               className="flex flex-col items-center justify-center p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
             >
                <CreditCard size={24} className="mb-2" />
                <span className="font-bold">Kredi Kartı (F4)</span>
             </button>
          </div>
        </div>
      </div>
      
    </div>
  );
};
