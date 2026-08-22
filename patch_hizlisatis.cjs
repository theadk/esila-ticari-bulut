const fs = require('fs');
let code = fs.readFileSync('pages/HizliSatis.tsx', 'utf8');

code = code.replace(
  'className="border border-gray-200 rounded-xl p-2 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-sm cursor-pointer transition-colors flex flex-col items-center text-center justify-between aspect-square shrink-0"\n                >\n                   <div className="text-[10px] lg:text-[11px] font-semibold text-emerald-900 line-clamp-3 leading-tight pt-1">{product.name}</div>',
  'className="border border-gray-200 rounded-xl p-2 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-sm cursor-pointer transition-colors flex flex-col items-center text-center justify-between aspect-square shrink-0 relative overflow-hidden"\n                >\n                   {product.image && <div className="w-full h-1/2 mb-1 flex-shrink-0 rounded bg-white"><img src={product.image} alt={product.name} className="w-full h-full object-cover rounded" /></div>}\n                   <div className={`text-[10px] lg:text-[11px] font-semibold text-emerald-900 leading-tight pt-1 ${product.image ? "line-clamp-2" : "line-clamp-3"}`}>{product.name}</div>'
);

fs.writeFileSync('pages/HizliSatis.tsx', code);
