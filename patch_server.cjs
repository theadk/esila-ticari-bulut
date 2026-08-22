const fs = require('fs');

// Patch server/db.ts for migration
let dbCode = fs.readFileSync('server/db.ts', 'utf8');

const migrationToAdd = `
      {
        name: '007_add_product_image_column',
        up: async () => {
          const stmt = 'ALTER TABLE products ADD COLUMN image LONGTEXT;';
          try {
            await client.query(stmt);
          } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') {
              console.error('Error in 007_add_product_image_column:', e.message, '->', stmt);
            }
          }
        }
      }
    ];`;

dbCode = dbCode.replace(
  "      }\n    ];",
  migrationToAdd
);
fs.writeFileSync('server/db.ts', dbCode);


// Patch server.ts for api/products endpoints
let serverCode = fs.readFileSync('server.ts', 'utf8');

// For PUT /api/products/:id
serverCode = serverCode.replace(
  "supplierPrice,\n    } = req.body;",
  "supplierPrice,\n      image,\n    } = req.body;"
);

serverCode = serverCode.replace(
  "`showInQuickSale` = ?, `supplierPrice` = ? WHERE id = ? AND vkn = ?",
  "`showInQuickSale` = ?, `supplierPrice` = ?, `image` = ? WHERE id = ? AND vkn = ?"
);

serverCode = serverCode.replace(
  "showInQuickSale ? 1 : 0,\n          supplierPrice,\n          id,",
  "showInQuickSale ? 1 : 0,\n          supplierPrice,\n          image || null,\n          id,"
);

// For POST /api/products
serverCode = serverCode.replace(
  "INSERT INTO products (vkn, id, code, name, price, stock, category, warehouse, barcode, description, brand, `taxRate`, `warehouseStocks`, `purchasePrice`, `showInQuickSale`, `supplierPrice`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  "INSERT INTO products (vkn, id, code, name, price, stock, category, warehouse, barcode, description, brand, `taxRate`, `warehouseStocks`, `purchasePrice`, `showInQuickSale`, `supplierPrice`, `image`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);

serverCode = serverCode.replace(
  "showInQuickSale ? 1 : 0,\n          supplierPrice,\n        ],",
  "showInQuickSale ? 1 : 0,\n          supplierPrice,\n          image || null,\n        ],"
);

fs.writeFileSync('server.ts', serverCode);

