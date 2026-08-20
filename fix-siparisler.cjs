const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');

// Add type to customerInfo
code = code.replace(
  "email: '',\n    address: ''\n  });",
  "email: '',\n    address: '',\n    type: ''\n  });"
);

// Update addToCart to use supplierPrice if type === 'Satıcı'
code = code.replace(
  "price: product.price,\n        taxRate:",
  "price: (customerInfo.type === 'Satıcı' && product.supplierPrice) ? product.supplierPrice : product.price,\n        taxRate:"
);

// When customer is selected, also populate type
code = code.replace(
  "phone: cust.phone || '',\n        email: cust.email || '',\n        address: cust.address || ''\n      });",
  "phone: cust.phone || '',\n        email: cust.email || '',\n        address: cust.address || '',\n        type: cust.type || ''\n      });"
);

// We should also recalculate prices when the customer changes? That is harder in this setup because we don't have access to all products easily inside handleCustomerSelect to update cartItems' prices.
// But we can just clear the cart when customer changes if they switch between Alıcı and Satıcı. Or just leave it as it is (price at the time of adding). The prompt says "ürünlere tedarikçiler için satış fiyatı ekle. tedarikçi carisine sahip kişilere ürünlerdeki tedarikçi fiyatından satış yapsın." which means when adding, it should fetch that price. Let's add an effect to recalculate cart items when customer type changes? 
// No, the simplest is to just use customerInfo.type when adding.

fs.writeFileSync('pages/Siparisler.tsx', code);
