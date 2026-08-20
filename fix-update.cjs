const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "showInQuickSale ? 1 : 0,\n          id,\n          (req.headers[\"x-tenant-id\"] as string) || \"1111111111\",",
  "showInQuickSale ? 1 : 0,\n          supplierPrice,\n          id,\n          (req.headers[\"x-tenant-id\"] as string) || \"1111111111\","
);

fs.writeFileSync('server.ts', code);
