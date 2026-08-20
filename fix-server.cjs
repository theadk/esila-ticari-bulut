const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  "brand, taxRate, warehouseStocks, showInQuickSale",
  "brand, taxRate, warehouseStocks, showInQuickSale, supplierPrice"
);
code = code.replace(
  "taxRate, `warehouseStocks`, `purchasePrice`, `showInQuickSale`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  "taxRate, `warehouseStocks`, `purchasePrice`, `showInQuickSale`, `supplierPrice`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);
code = code.replace(
  "brand,          taxRate,          JSON.stringify(warehouseStocks || []),          purchasePrice,          showInQuickSale ? 1 : 0,",
  "brand,          taxRate,          JSON.stringify(warehouseStocks || []),          purchasePrice,          showInQuickSale ? 1 : 0,          supplierPrice,"
);
code = code.replace(
  "brand = ?, `taxRate` = ?, `warehouseStocks` = ?, `purchasePrice` = ?, `showInQuickSale` = ? WHERE id = ? AND vkn = ?",
  "brand = ?, `taxRate` = ?, `warehouseStocks` = ?, `purchasePrice` = ?, `showInQuickSale` = ?, `supplierPrice` = ? WHERE id = ? AND vkn = ?"
);
code = code.replace(
  "brand,          taxRate,          JSON.stringify(warehouseStocks || []),          purchasePrice,          showInQuickSale ? 1 : 0,          id,",
  "brand,          taxRate,          JSON.stringify(warehouseStocks || []),          purchasePrice,          showInQuickSale ? 1 : 0,          supplierPrice,          id,"
);
fs.writeFileSync('server.ts', code);
