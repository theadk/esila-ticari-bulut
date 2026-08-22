const fs = require('fs');
let code = fs.readFileSync('pages/Urunler.tsx', 'utf8');

const regex = /<div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">\s*<Package size=\{20\} \/>/g;
code = code.replace(regex, '<div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 overflow-hidden">{product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <Package size={20} />}');

fs.writeFileSync('pages/Urunler.tsx', code);
