const fs = require('fs');
let code = fs.readFileSync('pages/Urunler.tsx', 'utf8');

const targetStr = `            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
               <button 
                 onClick={(e) => { setIsDetailsOpen(false); handleEdit(selectedProduct); }}
                 className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors font-medium flex items-center gap-2"
               >
                 <Edit2 size={18} />
                 Düzenle
               </button>
               <button 
                 onClick={() => setIsDetailsOpen(false)}
                 className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
               >
                 Kapat
               </button>
            </div>`;

const newStr = `              <div className="mt-6 pt-4 border-t border-gray-100 print:hidden flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="bg-white p-2 rounded-lg border border-gray-200">
                     <QRCodeSVG 
                       value={JSON.stringify({ id: selectedProduct.id, code: selectedProduct.code })} 
                       size={64}
                       level="M"
                     />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-gray-800">QR Kod</p>
                     <p className="text-xs text-gray-500">Hızlı erişim ve envanter takibi için</p>
                   </div>
                 </div>
              </div>
              
              <div className="hidden print:flex flex-col items-center justify-center pt-20 pb-10 w-full h-full bg-white absolute inset-0 z-50">
                 <h2 className="text-4xl font-bold mb-4 text-center">{selectedProduct.name}</h2>
                 <p className="text-2xl text-gray-600 mb-12">{selectedProduct.code} {selectedProduct.barcode ? \`| Barkod: \${selectedProduct.barcode}\` : ''}</p>
                 <QRCodeSVG 
                   value={JSON.stringify({ id: selectedProduct.id, code: selectedProduct.code })} 
                   size={400}
                   level="H"
                 />
                 <p className="mt-12 text-3xl font-bold text-gray-900">{Number(selectedProduct.price).toLocaleString('tr-TR', { style: 'currency', currency: selectedProduct.currency || 'TRY' })}</p>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 print:hidden relative z-10">
               <button 
                 onClick={() => {
                   setTimeout(() => window.print(), 100);
                 }}
                 className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium flex items-center gap-2 mr-auto"
               >
                 <QrCode size={18} />
                 QR Yazdır
               </button>
               <button 
                 onClick={(e) => { setIsDetailsOpen(false); handleEdit(selectedProduct); }}
                 className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors font-medium flex items-center gap-2"
               >
                 <Edit2 size={18} />
                 Düzenle
               </button>
               <button 
                 onClick={() => setIsDetailsOpen(false)}
                 className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
               >
                 Kapat
               </button>
            </div>`;

code = code.replace(targetStr, newStr);

// Let's also make sure the details modal header is hidden when printing
code = code.replace(
  '<div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">',
  '<div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0 print:hidden">'
);
code = code.replace(
  '<div className="flex items-center gap-4 mb-6">',
  '<div className="flex items-center gap-4 mb-6 print:hidden">'
);
code = code.replace(
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">',
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm print:hidden">'
);
code = code.replace(
  '<div className="mt-4 pt-4 border-t border-gray-100">',
  '<div className="mt-4 pt-4 border-t border-gray-100 print:hidden">'
);


fs.writeFileSync('pages/Urunler.tsx', code);
