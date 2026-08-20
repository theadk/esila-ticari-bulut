const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');

code = code.replace(
  "cartItems,\n    addToCart,",
  "cartItems,\n    setCartItems,\n    addToCart,"
);

code = code.replace(
  "cartItems, addToCart, updateCartItem, removeFromCart,",
  "cartItems, setCartItems, addToCart, updateCartItem, removeFromCart,"
);

code = code.replace(
  "        email: cust.email || '',\n        address: cust.address || '',\n        type: cust.type || ''\n      });",
  "        email: cust.email || '',\n        address: cust.address || '',\n        type: cust.type || ''\n      });\n      setCartItems(prev => prev.map(item => {\n        const product = store.products?.find(p => p.id === item.productId);\n        if (product) {\n           const newPrice = (cust.type === 'Satıcı' && product.supplierPrice) ? product.supplierPrice : product.price;\n           return { ...item, price: newPrice };\n        }\n        return item;\n      }));"
);

fs.writeFileSync('pages/Siparisler.tsx', code);
