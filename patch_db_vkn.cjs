const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

const tablesToFix = ['categories', 'products', 'brands', 'reconciliations'];

tablesToFix.forEach(table => {
  const regexStr = 'CREATE TABLE IF NOT EXISTS ' + table + ' \\(\\s*id VARCHAR\\(255\\)';
  const regex = new RegExp(regexStr);
  code = code.replace(
    regex,
    'CREATE TABLE IF NOT EXISTS ' + table + ' (\\n        vkn VARCHAR(50),\\n        id VARCHAR(255)'
  );
  
  const alterMigration = `
    try {
      await client.query("ALTER TABLE ${table} ADD COLUMN vkn VARCHAR(50)");
      console.log("Added vkn to ${table}");
    } catch(e) {}
`;
  code = code.replace('// You can add column updates like this:', '// You can add column updates like this:' + alterMigration);
});

fs.writeFileSync('server/db.ts', code);
console.log("Patched server/db.ts for missing vkn columns");
