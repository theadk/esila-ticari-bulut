const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  "taxRate,\n      warehouseStocks,\n      showInQuickSale,\n    } = req.body;",
  "taxRate,\n      warehouseStocks,\n      showInQuickSale,\n      supplierPrice,\n    } = req.body;"
);
code = code.replace(
  "`purchasePrice`, `showInQuickSale`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  "`purchasePrice`, `showInQuickSale`, `supplierPrice`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);
code = code.replace(
  "purchasePrice,\n          showInQuickSale ? 1 : 0,\n        ],",
  "purchasePrice,\n          showInQuickSale ? 1 : 0,\n          supplierPrice,\n        ],"
);
fs.writeFileSync('server.ts', code);
