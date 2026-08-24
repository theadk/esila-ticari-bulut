const fs = require('fs');

let code = fs.readFileSync('server/db.ts', 'utf8');

// Add vkn to the CREATE TABLE schema
code = code.replace(
  /CREATE TABLE IF NOT EXISTS warehouses \(\s*id VARCHAR\(255\)/,
  'CREATE TABLE IF NOT EXISTS warehouses (\n        vkn VARCHAR(50),\n        id VARCHAR(255)'
);

// Add ALTER TABLE to migrations
const alterMigration = `
    try {
      await client.query("ALTER TABLE warehouses ADD COLUMN vkn VARCHAR(50)");
      console.log("Added vkn to warehouses");
    } catch(e) {}
`;

code = code.replace(
  '// You can add column updates like this:',
  '// You can add column updates like this:' + alterMigration
);

fs.writeFileSync('server/db.ts', code);
console.log("Patched server/db.ts");
