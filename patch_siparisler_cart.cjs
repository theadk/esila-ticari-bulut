const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');

code = code.replace(
  /<div key=\{item\.productId\} className="flex gap-3 items-start bg-gray-50\/80 p-3 rounded-xl border border-gray-100\/50 hover:border-gray-200 transition-colors">\n\s*<div className="flex-1 min-w-0">/g,
  `<div key={item.productId} className="flex gap-3 items-start bg-gray-50/80 p-3 rounded-xl border border-gray-100/50 hover:border-gray-200 transition-colors">
                        {(() => {
                          const p = store.products.find(p => p.id === item.productId);
                          return p?.image ? <img src={p.image} className="w-10 h-10 object-cover rounded shadow-sm border border-gray-100 shrink-0" /> : <div className="w-10 h-10 bg-white border border-gray-100 rounded flex items-center justify-center shrink-0"><Package className="w-5 h-5 text-gray-400" /></div>;
                        })()}
                        <div className="flex-1 min-w-0">`
);

fs.writeFileSync('pages/Siparisler.tsx', code);
