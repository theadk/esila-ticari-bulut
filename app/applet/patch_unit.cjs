const fs = require('fs');

// 1. Patch server/db.ts
let dbContent = fs.readFileSync('server/db.ts', 'utf8');
if (!dbContent.includes('unit VARCHAR(50)')) {
  dbContent = dbContent.replace(
    'showInQuickSale BOOLEAN DEFAULT false',
    'showInQuickSale BOOLEAN DEFAULT false,\n        unit VARCHAR(50) DEFAULT \'Adet\''
  );
}

const migrationTarget = "const alterStatements = [";
const migrationReplacement = `const alterStatements = [
            'ALTER TABLE products ADD COLUMN unit VARCHAR(50) DEFAULT \\'Adet\\';',`;
if (!dbContent.includes('ALTER TABLE products ADD COLUMN unit')) {
  dbContent = dbContent.replace(migrationTarget, migrationReplacement);
}

fs.writeFileSync('server/db.ts', dbContent, 'utf8');
console.log('Patched server/db.ts successfully');

// 2. Patch server.ts
let serverContent = fs.readFileSync('server.ts', 'utf8');

// Update PUT /api/products/:id extraction
if (!serverContent.includes('unit,')) {
  serverContent = serverContent.replace(
    `      supplierPrice,\n      image,\n    } = req.body;`,
    `      supplierPrice,\n      image,\n      unit,\n    } = req.body;`
  );
}

// Update PUT query
const putQueryOld = `\`supplierPrice\` = ?, \`image\` = ? WHERE id = ? AND vkn = ?`;
const putQueryNew = `\`supplierPrice\` = ?, \`image\` = ?, \`unit\` = ? WHERE id = ? AND vkn = ?`;
if (serverContent.includes(putQueryOld) && !serverContent.includes('`unit` = ?')) {
  serverContent = serverContent.replace(putQueryOld, putQueryNew);
  serverContent = serverContent.replace(
    `image || null,\n          id,`,
    `image || null,\n          unit || 'Adet',\n          id,`
  );
}

// Update POST /api/products extraction
// (Already added unit via first replacement if matching supplierPrice/image)

// Update POST insert query
const postInsertOld = `\`supplierPrice\`, \`image\`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
const postInsertNew = `\`supplierPrice\`, \`image\`, \`unit\`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
if (serverContent.includes(postInsertOld) && !serverContent.includes('`image`, `unit`')) {
  serverContent = serverContent.replace(postInsertOld, postInsertNew);
  serverContent = serverContent.replace(
    `image || null,\n        ],`,
    `image || null,\n          unit || 'Adet',\n        ],`
  );
}

fs.writeFileSync('server.ts', serverContent, 'utf8');
console.log('Patched server.ts successfully');
