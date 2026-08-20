const fs = require('fs');
let code = fs.readFileSync('pages/HizliSatis.tsx', 'utf8');

// add isSupplier variable definition somewhere around calculateTotal
code = code.replace(
  "const calculateTotal = () => {\n    return cart.reduce((total, item) => total + (item.product.price * item.quantity * (1 - item.discount / 100)), 0);\n  };",
  "const isSupplier = customers.find(c => String(c.id) === String(selectedCustomerId))?.type === 'Satıcı';\n  const getProductPrice = (p: Product) => (isSupplier && p.supplierPrice) ? p.supplierPrice : p.price;\n\n  const calculateTotal = () => {\n    return cart.reduce((total, item) => total + (getProductPrice(item.product) * item.quantity * (1 - item.discount / 100)), 0);\n  };"
);

// replace item.product.price with getProductPrice(item.product)
code = code.replace(
  "{(item.product.price || 0).toLocaleString('tr-TR')} ₺",
  "{(getProductPrice(item.product) || 0).toLocaleString('tr-TR')} ₺"
);

code = code.replace(
  "{(((item.product.price || 0) * item.quantity) * (1 - item.discount / 100)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺",
  "{(((getProductPrice(item.product) || 0) * item.quantity) * (1 - item.discount / 100)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺"
);

// In handleCheckout, the prices passed to order items and transactions also need to use getProductPrice
code = code.replace(
  "price: c.product.price,",
  "price: getProductPrice(c.product),"
);

fs.writeFileSync('pages/HizliSatis.tsx', code);
