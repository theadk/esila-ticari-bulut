import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { ShoppingCart, Search, Plus, Minus, Trash2, CreditCard, Banknote, CheckCircle, UserPlus, User, Camera, X, PauseCircle, Clock } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAppStore } from '../lib/store';
import { hasPermission } from '../lib/permissions';
import { Product, Customer, OrderStatus, Warehouse } from '../types';
import { api } from '../lib/api';

export const HizliSatis: React.FC = () => {
  const store = useAppStore();
  const currentUser = store.users.find(u => u.id === localStorage.getItem('esila_user_id')) || store.users[0];
  const canView = hasPermission(currentUser, 'hizlisatis', 'view');
  const canCreate = hasPermission(currentUser, 'hizlisatis', 'create');

  const [cart, setCart] = useState<{product: Product, quantity: number, discount: number}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    api.getWarehouses().then(setWarehouses).catch(console.error);
  }, []);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Default parameters
  const rawProducts = store.products || [];
  const assigned = warehouses.find(w => w.id === currentUser?.assignedWarehouse)?.name || currentUser?.assignedWarehouse;
  const products = currentUser?.assignedWarehouse 
    ? rawProducts.filter(p => p.warehouseStocks?.some(ws => ws.warehouseId === assigned) || p.warehouse === assigned)
    : rawProducts;
    
  const customers = store.customers || [];
  const suspendedCarts = store.suspendedCarts || [];

  const handleSuspendCart = () => {
    if (cart.length === 0) return;
    const currentCustomer = customers.find(c => String(c.id) === String(selectedCustomerId));
    const customerName = currentCustomer ? currentCustomer.name : 'Perakende Müşteri';
    const newSuspended = {
      id: `ASKI-${Date.now()}`,
      name: `${customerName} - ${cart.length} Ürün (${calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺)`,
      date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      items: [...cart],
      customerId: selectedCustomerId
    };
    store.setSuspendedCarts([...suspendedCarts, newSuspended]);
    setCart([]);
    setSelectedCustomerId('');
  };

  const handleResumeCart = (cartToResume: any) => {
    setCart(cartToResume.items);
    setSelectedCustomerId(cartToResume.customerId);
    handleRemoveSuspended(cartToResume.id);
    setShowSuspendedModal(false);
  };

  const handleRemoveSuspended = (id: string) => {
    store.setSuspendedCarts(suspendedCarts.filter((c: any) => c.id !== id));
  };

  const getAvailableStock = (product: Product) => {
    if (assigned) {
      const wStock = product.warehouseStocks?.find(w => w.warehouseId === assigned);
      if (wStock) return wStock.stock;
      if (product.warehouse === assigned) return product.stock;
      return 0; // If assigned to another warehouse, no stock available here unless explicitly in warehouseStocks
    }
    return product.stock || 0; // Global fallback
  };

  const handleAddToCart = (product: Product) => {
    const availableStock = getAvailableStock(product);
    
    if (availableStock <= 0) {
      toast.error(`${product.name} stokta yok!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= availableStock) {
          toast.error(`Stok yetersiz! Mevcut stok: ${availableStock}`);
          return prev;
        }
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
        const availableStock = getAvailableStock(item.product);
        const newQ = item.quantity + delta;
        if (newQ > availableStock) {
          toast.error(`Stok yetersiz! Mevcut stok: ${availableStock}`);
          return item;
        }
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
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const storeName = store.settings?.companyName || 'ESİLA TİCARİ';
    const storeAddress = store.settings?.address || 'Merkez Şube';
    const storePhone = store.settings?.phone || '';
    const footerText = store.settings?.printer_footer_text || 'Bizi tercih ettiğiniz için teşekkür ederiz.';
    
    // 80mm pos printer receipt HTML
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Bilgi Fişi</title>
          <style>
             @page { margin: 0; size: 80mm auto; }
             body { 
               font-family: 'Courier New', Courier, monospace; 
               font-size: 14px; /* Scaled for 80mm clarity */
               width: 300px; /* ~80mm */
               margin: 0 auto;
               padding: 5px;
               color: #000; 
               box-sizing: border-box;
               line-height: 1.2;
             }
             .text-center { text-align: center; }
             .font-bold { font-weight: bold; }
             .border-b { border-bottom: 1px dashed #000; margin-bottom: 5px; padding-bottom: 5px; }
             .border-t { border-top: 1px dashed #000; margin-top: 5px; padding-top: 5px; }
             .flex { display: flex; justify-content: space-between; }
             .mt-2 { margin-top: 5px; }
             .mb-2 { margin-bottom: 5px; }
             * { margin: 0; padding: 0; }
             .item-row { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 5px; }
             .item-name { width: 60%; word-break: break-word; }
             .item-qty-price { width: 40%; text-align: right; }
          </style>
        </head>
        <body>
          <div class="text-center font-bold mb-2">
            <h2 style="margin: 0 0 5px 0; font-size: 18px;">${storeName}</h2>
            <p style="margin: 0; font-weight: normal; font-size: 12px;">${storeAddress}</p>
            ${storePhone ? `<p style="margin: 0; font-weight: normal; font-size: 12px;">Tel: ${storePhone}</p>` : ''}
          </div>
          
          <div class="text-center font-bold border-b border-t mb-2 mt-2">
            <h3 style="margin: 5px 0 0 0; font-size: 16px;">BİLGİ FİŞİ</h3>
            <p style="margin: 5px 0; font-weight: normal; font-size: 12px;">Yazdırılma: ${new Date().toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          
          <div class="border-b" style="font-size: 13px;">
            <p style="margin: 5px 0;">Müşteri: ${currentCustomer.name}</p>
          </div>
          
          <div class="border-b font-bold flex" style="font-size: 13px;">
            <span style="width: 60%">Ürün</span>
            <span style="width: 40%; text-align:right;">Fiyat</span>
          </div>
          
          <div class="border-b" style="font-size: 13px;">
            ${items.map(item => {
              const itemTotal = item.product.price * item.quantity;
              const discountedTotal = itemTotal * (1 - item.discount / 100);
              return `
              <div class="item-row">
                <span class="item-name">${item.product.name}</span>
                <span class="item-qty-price">${item.quantity} ${item.product.unit || 'Adet'} x ${item.product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style="text-align: right;">
                = ${discountedTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
              ${item.discount > 0 ? `<div style="font-size: 11px; color: #333; text-align: right;">(İskonto: %${item.discount})</div>` : ''}
            `}).join('')}
          </div>
          
          <div class="border-b font-bold flex" style="font-size: 16px;">
            <span>TOPLAM:</span>
            <span>${totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
          </div>
          
          <div class="text-center font-bold mt-2" style="font-size: 13px;">
            <p style="margin: 2px 0;">ÖDEME: ${paymentMethod}</p>
            <p style="margin: 5px 0 2px 0;">MALİ DEĞERİ YOKTUR.</p>
          </div>
          
          <div class="text-center text-sm border-t mt-2" style="font-size: 12px; font-weight: normal;">
            <p style="margin: 5px 0;">${footerText}</p>
          </div>
          
          <script>
            window.onload = function() { 
              setTimeout(function() {
                window.print(); 
              }, 500); 
            }
          </script>
        </body>
      </html>
    `;
    
    if (iframe.contentWindow) {
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(receiptHtml);
        iframe.contentWindow.document.close();
        
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 5000); // give enough time for printing before removing iframe
    }
  };

  const handleCheckout = (paymentMethod: 'Nakit' | 'Kredi Kartı' | 'Cari') => {
    if (cart.length === 0) return;

    let currentCustomer = customers.find(c => String(c.id) === String(selectedCustomerId));
    
    if (!currentCustomer) {
      currentCustomer = customers.find(c => c.name.toLowerCase().includes('perakende'));
      if (!currentCustomer) {
        currentCustomer = {
          id: `CAR-PRK-${Date.now()}`,
          name: 'Perakende Müşteri',
          type: 'Alıcı',
          balance: 0,
          status: 'Aktif'
        } as any;
        store.setCustomers([...customers, currentCustomer]);
      }
    }

    const totalAmount = calculateTotal();

    // 1. Create Cash Transaction only if not Cari
    if (paymentMethod !== 'Cari') {
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
    }

    // 2. Reduce Stock
    let newProducts = [...rawProducts];
    cart.forEach(item => {
      const idx = newProducts.findIndex(p => p.id === item.product.id);
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
    store.setProducts(newProducts);
    
    // 2.5 Create Order
    const newOrder = {
       id: `SIP-HS-${Date.now()}`,
       customerId: currentCustomer!.id,
       customerName: currentCustomer.name,
       date: new Date().toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
       status: OrderStatus.COMPLETED,
       items: cart.map(c => ({
         productId: c.product.id,
         productName: c.product.name,
         quantity: c.quantity,
         price: c.product.price,
         taxRate: c.product.taxRate || 0,
         discount: c.discount
       })),
       total: totalAmount
    };
    store.setOrders([...(store.orders || []), newOrder as any]);

    // 3. Optional: If a real customer is selected, add to customer transactions
    if (currentCustomer && currentCustomer.id) {
      const isPerakende = currentCustomer.name.toLowerCase().includes('perakende');
      
      if (!(isPerakende && paymentMethod !== 'Cari')) {
        const tx2 = {
          id: `CTX-INV-${Date.now()}`,
          customerId: currentCustomer.id,
          date: new Date().toISOString().split('T')[0],
          type: 'Borç' as const,
          amount: totalAmount,
          description: `Hızlı Satış Faturası`
        };
        if (paymentMethod !== 'Cari') {
          const tx1 = {
            id: `CTX-${Date.now()}`,
            customerId: currentCustomer.id,
            date: new Date().toISOString().split('T')[0],
            type: 'Alacak' as const,
            amount: totalAmount,
            description: `Hızlı Satış (${paymentMethod})`
          };
          store.setTransactions([...store.transactions, tx1, tx2]);
        } else {
          store.setTransactions([...store.transactions, tx2]);
        }
      }
    }

    setCart([]);
    setSelectedCustomerId('');
    handlePrintReceipt(currentCustomer, paymentMethod, totalAmount, cart);
    toast.success('Satış başarıyla tamamlandı!');
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
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleCheckout('Cari');
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
      (p.name || '').toLowerCase().includes(term) || 
      (p.barcode || '').toLowerCase().includes(term) || 
      (p.code || '').toLowerCase().includes(term)
    );
  };

  const filteredProducts = filterProducts();

  // If exact barcode match, auto-add
  useEffect(() => {
    if (searchTerm && filteredProducts.length === 1 && filteredProducts[0].barcode === searchTerm) {
      handleAddToCart(filteredProducts[0]);
    }
  }, [searchTerm]);

  // Handle Barcode Scanner from Camera
  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "barcode-reader",
        { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          setIsScanning(false);
          const foundProduct = products.find(p => String(p.barcode) === decodedText || String(p.code) === decodedText);
          if (foundProduct) {
             handleAddToCart(foundProduct);
             // Play success sound
             try {
                const audio = new Audio('/success.mp3');
                audio.play().catch(e => console.log('Audio error:', e));
             } catch (e) {}
          } else {
             alert('Ürün bulunamadı: ' + decodedText);
          }
        },
        (error) => {
          // ignore error which happens continuously
        }
      );

      return () => {
        scanner.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      };
    }
  }, [isScanning, products]);

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <ShoppingCart size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
        <p>Hızlı Satış modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

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
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-lg"
                autoFocus
              />
              <button 
                onClick={() => setIsScanning(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-md transition-colors"
                title="Kamerayla Barkod Okut"
              >
                 <Camera size={20} />
              </button>
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

        {/* Hızlı Kategori/Ürünler (Eğer arama yoksa hızlı satışta gösterilenleri listele) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
          <h3 className="font-semibold text-gray-700 pb-2 border-b mb-4">Hızlı Satış Ürünleri</h3>
          <div className="flex-1 overflow-y-auto pr-2 flex flex-wrap gap-2 content-start">
             {(searchTerm ? filteredProducts : products.filter(p => p.showInQuickSale)).map(product => (
                <div 
                  key={product.id} 
                  onClick={() => handleAddToCart(product)}
                  className="border border-gray-200 rounded-xl p-2 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-sm cursor-pointer transition-colors flex flex-col items-center text-center justify-between w-[100px] h-[100px] shrink-0"
                >
                   <div className="text-[11px] font-semibold text-emerald-900 line-clamp-3 leading-tight pt-1">{product.name}</div>
                   <div className="text-emerald-700 font-bold text-xs pb-1">{(product.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* Sağ Panel: Sepet ve Ödeme */}
      <div className="flex-[2] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <div className="p-4 bg-emerald-50 rounded-t-xl border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-emerald-600" />
            <h2 className="text-lg font-bold text-emerald-800">Satış Sepeti</h2>
          </div>
          <button 
            onClick={() => setShowSuspendedModal(true)}
            className="flex items-center gap-1 px-3 py-1 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
          >
             <Clock size={16} />
             Bekleyenler
             {suspendedCarts.length > 0 && (
               <span className="ml-1 bg-emerald-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full leading-none">
                 {suspendedCarts.length}
               </span>
             )}
          </button>
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
                      <button onClick={() => updateQuantity(item.product.id, Math.floor(item.quantity) === item.quantity ? -1 : -item.quantity + Math.floor(item.quantity))} className="p-1 px-2 hover:bg-gray-100 text-gray-600 rounded-l-md">-</button>
                      <input 
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            setCart(prev => prev.map(cartItem => 
                              cartItem.product.id === item.product.id 
                                ? { ...cartItem, quantity: val }
                                : cartItem
                            ));
                          }
                        }}
                        className="w-16 text-center font-medium border-none focus:ring-0 text-sm p-1"
                      />
                      <span className="text-xs text-gray-400 pr-2 select-none border-l pl-2 border-gray-100">{item.product.unit || 'Adet'}</span>
                      <button onClick={() => updateQuantity(item.product.id, Math.floor(item.quantity) === item.quantity ? 1 : Math.ceil(item.quantity) - item.quantity)} className="p-1 px-2 hover:bg-gray-100 text-gray-600 rounded-r-md block">+</button>
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
               onClick={handleSuspendCart}
               disabled={cart.length === 0}
               className="flex-1 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
             >
                <PauseCircle size={18} /> Askıya Al
             </button>
             <button
               onClick={() => setCart([])}
               disabled={cart.length === 0}
               className="flex-1 py-2 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 rounded-lg font-medium transition-colors"
             >
                Temizle
             </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
             <button 
               onClick={() => handleCheckout('Nakit')}
               disabled={cart.length === 0 || !canCreate}
               className="flex flex-col items-center justify-center p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
             >
                <Banknote size={24} className="mb-1" />
                <span className="font-bold text-sm text-center">Nakit<br/>(F1)</span>
             </button>
             <button 
               onClick={() => handleCheckout('Kredi Kartı')}
               disabled={cart.length === 0 || !canCreate}
               className="flex flex-col items-center justify-center p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
             >
                <CreditCard size={24} className="mb-1" />
                <span className="font-bold text-sm text-center">Kredi Kartı<br/>(F4)</span>
             </button>
             <button 
               onClick={() => handleCheckout('Cari')}
               disabled={cart.length === 0 || !canCreate}
               className="flex flex-col items-center justify-center p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-sm"
             >
                <User size={24} className="mb-1" />
                <span className="font-bold text-sm text-center">Cari<br/>(F5)</span>
             </button>
          </div>
        </div>
      </div>
      
      {/* Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                 <Camera className="text-emerald-600" size={24} />
                 Kamera ile Barkod Okut
               </h3>
               <button 
                 onClick={() => setIsScanning(false)} 
                 className="text-gray-500 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors"
               >
                  <X size={24} />
               </button>
            </div>
            <div className="p-0 bg-black relative">
               <div id="barcode-reader" className="w-full border-none"></div>
            </div>
            <div className="p-4 text-center text-sm text-gray-600 bg-gray-50 font-medium">
               Kameranızı ürün barkoduna doğru tutun.<br/>
               Ürün bulunduğunda otomatik olarak sepete eklenecektir.
            </div>
          </div>
        </div>
      )}

      {/* Suspended Carts Modal */}
      {showSuspendedModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowSuspendedModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                 <Clock className="text-emerald-600" size={24} />
                 Bekleyen / Askıdaki Sepetler
               </h3>
               <button 
                 onClick={() => setShowSuspendedModal(false)} 
                 className="text-gray-500 hover:text-red-500 p-1 rounded-lg transition-colors"
               >
                  <X size={24} />
               </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
               {suspendedCarts.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                     <Clock size={48} className="mx-auto mb-4 opacity-30" />
                     <p className="text-lg">Bekleyen sepet bulunamadı.</p>
                  </div>
               ) : (
                  <div className="space-y-3">
                     {suspendedCarts.map((c: any) => (
                        <div key={c.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                           <div>
                              <h4 className="font-bold text-gray-800 text-lg">{c.name}</h4>
                              <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                 <Clock size={14} /> {c.date} 
                                 <span className="text-gray-300">|</span> 
                                 {c.items.reduce((acc: number, item: any) => acc + item.quantity, 0)} ürün
                              </p>
                           </div>
                           <div className="flex gap-2">
                              <button 
                                 onClick={() => handleRemoveSuspended(c.id)}
                                 className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                 title="Sil"
                              >
                                 <Trash2 size={20} />
                              </button>
                              <button 
                                 onClick={() => handleResumeCart(c)}
                                 className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-2 rounded-lg font-medium transition-colors"
                              >
                                 Geri Çağır
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
            <div className="p-4 border-t bg-white">
               <button 
                 onClick={() => setShowSuspendedModal(false)}
                 className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
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
