const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');

code = code.replace(
  '<div className="text-xs text-gray-400 mb-1">{product.code}</div>',
  '<div className="text-xs text-gray-400 mb-1">{product.code}</div>\n                        {product.image && <div className="w-full h-16 mb-2 overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center"><img src={product.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" /></div>}'
);

// We should also increase the height to fit the image
code = code.replace(
  'h-32"',
  'h-48"'
);

fs.writeFileSync('pages/Siparisler.tsx', code);
