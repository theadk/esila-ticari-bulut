const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  "taxRate,\n      warehouseStocks,\n      showInQuickSale,\n    } = req.body;",
  "taxRate,\n      warehouseStocks,\n      showInQuickSale,\n      supplierPrice,\n    } = req.body;"
);
fs.writeFileSync('server.ts', code);
