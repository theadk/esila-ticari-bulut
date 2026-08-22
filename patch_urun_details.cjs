const fs = require('fs');
let code = fs.readFileSync('pages/Urunler.tsx', 'utf8');

code = code.replace(
  '<div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">\n                   <Package size={32} />\n                </div>',
  '<div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 overflow-hidden">\n                   {selectedProduct.image ? <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" /> : <Package size={32} />}\n                </div>'
);

fs.writeFileSync('pages/Urunler.tsx', code);
