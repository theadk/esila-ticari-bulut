const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');

code = code.replace(
  /\{selectedOrder\.items\?\.map\(\(item, idx\) => \(\n\s*<tr key=\{idx\}>\n\s*<td className="px-4 py-3 font-medium text-gray-900">\{item.productName\}<\/td>/,
  `{selectedOrder.items?.map((item, idx) => {
                          const p = store.products.find(prod => prod.id === item.productId);
                          return (
                          <tr key={idx}>
                            <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                               {p?.image ? <img src={p.image} alt={item.productName} className="w-8 h-8 object-cover rounded-md border border-gray-200" /> : <Package className="w-8 h-8 p-1 text-gray-400 bg-gray-100 rounded-md" />}
                               {item.productName}
                            </td>`
);

fs.writeFileSync('pages/Siparisler.tsx', code);
