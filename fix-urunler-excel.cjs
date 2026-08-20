const fs = require('fs');
let code = fs.readFileSync('pages/Urunler.tsx', 'utf8');
code = code.replace(
  "'Satış Fiyatı': p.price,\n      'KDV Oranı': p.taxRate || 0,",
  "'Satış Fiyatı': p.price,\n      'Tedarikçi Fiyatı': p.supplierPrice || 0,\n      'KDV Oranı': p.taxRate || 0,"
);
code = code.replace(
  "price: Number(row['Satış Fiyatı']) || Number(row['Perakende Fiyatı']) || Number(row['Fiyat']) || 0,\n          taxRate: (row['KDV Oranı']",
  "price: Number(row['Satış Fiyatı']) || Number(row['Perakende Fiyatı']) || Number(row['Fiyat']) || 0,\n          supplierPrice: Number(row['Tedarikçi Fiyatı']) || 0,\n          taxRate: (row['KDV Oranı']"
);
fs.writeFileSync('pages/Urunler.tsx', code);
