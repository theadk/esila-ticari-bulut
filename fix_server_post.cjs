const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// For POST /api/products, we need to extract `image`
code = code.replace(
  "showInQuickSale,\n      supplierPrice,\n    } = req.body;",
  "showInQuickSale,\n      supplierPrice,\n      image,\n    } = req.body;"
);
fs.writeFileSync('server.ts', code);
