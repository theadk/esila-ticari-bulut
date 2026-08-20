const fs = require('fs');
let code = fs.readFileSync('pages/Teklifler.tsx', 'utf8');

// when adding a product, determine price based on selectedCustomer
code = code.replace(
  "productName: product.name,\n          price: product.price,",
  "productName: product.name,\n          price: (selectedCustomer?.type === 'Satıcı' && product.supplierPrice) ? product.supplierPrice : product.price,"
);

// when selectedCustomer changes, recalculate prices
code = code.replace(
  "setSelectedCustomer(c || null);",
  "setSelectedCustomer(c || null);\n                          if (c) {\n                            setCartItems(prev => prev.map(item => {\n                              const product = products.find(p => p.id === item.productId);\n                              if (product) {\n                                const newPrice = (c.type === 'Satıcı' && product.supplierPrice) ? product.supplierPrice : product.price;\n                                return { ...item, price: newPrice };\n                              }\n                              return item;\n                            }));\n                          }"
);

fs.writeFileSync('pages/Teklifler.tsx', code);
