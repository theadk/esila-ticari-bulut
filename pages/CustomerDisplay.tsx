import React, { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useAppStore } from '../lib/store';

export const CustomerDisplay: React.FC = () => {
  const store = useAppStore();
  const [cartState, setCartState] = useState<{
    cart: any[];
    total: number;
    customerId?: string;
  }>({
    cart: [],
    total: 0,
  });

  useEffect(() => {
    document.title = "Müşteri Ekranı";
    
    // Load initial state
    const initial = localStorage.getItem('esila_customer_display_state');
    if (initial) {
      try {
        setCartState(JSON.parse(initial));
      } catch(e) {}
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'esila_customer_display_state' && e.newValue) {
        try {
          const state = JSON.parse(e.newValue);
          setCartState(state);
        } catch(e) {}
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const companyName = store.settings?.companyName || 'Hoş Geldiniz';
  
  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white shadow-lg p-6 flex justify-between items-center z-10">
        <h1 className="text-4xl font-bold tracking-tight">{companyName}</h1>
        <div className="flex items-center gap-3">
          <ShoppingCart size={40} />
          <span className="text-3xl font-semibold">{cartState.cart.reduce((acc, item) => acc + item.quantity, 0)} Ürün</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Left Side: Video/Ads or static image */}
        <div className="flex-1 bg-gray-100 flex items-center justify-center border-r border-gray-200">
           <div className="text-center p-8">
              <div className="bg-white rounded-3xl p-12 shadow-2xl inline-block mb-8">
                 <ShoppingCart size={120} className="text-blue-500 mx-auto" />
              </div>
              <h2 className="text-5xl font-bold text-gray-800 mb-4">Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz</h2>
              <p className="text-2xl text-gray-500">Lütfen aldığınız ürünleri ekrandan kontrol ediniz.</p>
           </div>
        </div>

        {/* Right Side: Cart list and Total */}
        <div className="w-[500px] flex flex-col bg-white shadow-2xl z-10">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartState.cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <ShoppingCart size={64} className="mb-4 text-gray-300" />
                <p className="text-xl">Sepetiniz şu an boş.</p>
              </div>
            ) : (
              cartState.cart.map((item: any, idx: number) => {
                const itemTotal = item.price * item.quantity * (1 - (item.discount || 0) / 100);
                return (
                  <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 animate-fade-in">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 truncate">{item.name}</h3>
                      <div className="text-gray-500 font-medium">
                        {item.quantity} x {item.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                        {item.discount > 0 && (
                          <span className="text-red-500 ml-2 text-sm">(-%{item.discount})</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xl font-bold text-blue-600 ml-4">
                      {itemTotal.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="bg-blue-50 p-8 border-t-4 border-blue-600 flex flex-col justify-end">
            <div className="text-gray-500 text-lg uppercase font-bold mb-1 tracking-widest">Ödenecek Tutar</div>
            <div className="text-5xl font-black text-blue-700">
              {cartState.total.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
