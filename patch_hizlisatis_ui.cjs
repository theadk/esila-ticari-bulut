const fs = require('fs');
let code = fs.readFileSync('pages/HizliSatis.tsx', 'utf8');

// Update grid layout
code = code.replace(
  '<div className="grid grid-cols-3 gap-2 lg:gap-3">',
  '<div className="grid grid-cols-2 md:grid-cols-4 gap-2 lg:gap-3">'
);

// Add Taksit button
const cariBtn = `<button 
               onClick={() => handleCheckout('Cari')}
               disabled={cart.length === 0 || !canCreate}
               className="flex flex-col items-center justify-center p-2 lg:p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-sm"
             >
                <User size={24} className="mb-1" />
                <span className="font-bold text-[10px] lg:text-sm text-center">Cari<br className="hidden lg:block"/><span className="hidden lg:inline">(F5)</span></span>
             </button>`;

const taksitBtn = `<button 
               onClick={() => handleCheckout('Cari')}
               disabled={cart.length === 0 || !canCreate}
               className="flex flex-col items-center justify-center p-2 lg:p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-sm"
             >
                <User size={24} className="mb-1" />
                <span className="font-bold text-[10px] lg:text-sm text-center">Cari<br className="hidden lg:block"/><span className="hidden lg:inline">(F5)</span></span>
             </button>
             <button 
               onClick={() => setShowTaksitModal(true)}
               disabled={cart.length === 0 || !canCreate}
               className="flex flex-col items-center justify-center p-2 lg:p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
             >
                <Clock size={24} className="mb-1" />
                <span className="font-bold text-[10px] lg:text-sm text-center">Taksitli<br className="hidden lg:block"/><span className="hidden lg:inline">Satış</span></span>
             </button>`;

code = code.replace(cariBtn, taksitBtn);

// Add modal logic
const modalHTML = `      {/* Taksit Modal */}
      {showTaksitModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                 <Clock className="text-indigo-600" size={24} />
                 Taksitli Satış
               </h3>
               <button 
                 onClick={() => setShowTaksitModal(false)} 
                 className="text-gray-500 hover:text-red-500 p-1 rounded-lg transition-colors"
               >
                  <X size={24} />
               </button>
            </div>
            
            <div className="p-6 bg-white space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taksit Sayısı</label>
                  <select 
                    value={taksitSayisi}
                    onChange={(e) => setTaksitSayisi(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                     {[2,3,4,5,6,9,12].map(n => <option key={n} value={n}>{n} Taksit</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Aralığı</label>
                  <select 
                    value={taksitAraligi}
                    onChange={(e) => setTaksitAraligi(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                     <option value={15}>15 Günde Bir</option>
                     <option value={30}>Ayda Bir</option>
                  </select>
               </div>
               
               <div className="p-3 bg-indigo-50 text-indigo-800 rounded-lg text-sm">
                  Toplam Tutar: <span className="font-bold">{calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span><br/>
                  Taksit Tutarı: <span className="font-bold">{(calculateTotal() / taksitSayisi).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
               </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-2">
               <button 
                 onClick={() => setShowTaksitModal(false)}
                 className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
               >
                 İptal
               </button>
               <button 
                 onClick={() => {
                   setShowTaksitModal(false);
                   handleCheckout('Taksit', { count: taksitSayisi, intervalDays: taksitAraligi });
                 }}
                 className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
               >
                 Onayla
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal */}`;

code = code.replace('{/* Scanner Modal */}', modalHTML);

fs.writeFileSync('pages/HizliSatis.tsx', code);
console.log("Patched HizliSatis UI.");
