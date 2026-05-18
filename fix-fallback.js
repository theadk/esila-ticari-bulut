import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// Add import
if (!code.includes("fallbackDb.js")) {
    code = code.replace("import cors from 'cors';", "import cors from 'cors';\nimport { getFallbackTable, insertFallbackRow, updateFallbackRow, deleteFallbackRow } from './server/fallbackDb.js';")
}

// In app.post('/api/products')
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*fallbackProducts\.push\(\{ \.\.\.req\.body, id: req\.body\.id \|\| String\(Date\.now\(\)\) \}\);\s*return res\.json\(req\.body\);\s*\}/,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      insertFallbackRow('products', { ...req.body, vkn, id: req.body.id || String(Date.now()) });
      return res.json(req.body);
    }`
);

// In app.get('/api/products')
code = code.replace(
    /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) return res\.json\(fallbackProducts\);/g,
    `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) return res.json(getFallbackTable('products', req.headers['x-tenant-id'] || '1111111111'));`
);

// app.delete('/api/products/:id')
code = code.replace(
    /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*fallbackProducts = fallbackProducts\.filter\(p => String\(p\.id\) \!== String\(req\.params\.id\)\);\s*return res\.json\(\{ success: true \}\);\s*\}/g,
    `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      deleteFallbackRow('products', req.params.id, req.headers['x-tenant-id'] || '1111111111');
      return res.json({ success: true });
    }`
);

// Repeat for generic GET
code = code.replace(
    `if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {\n          if (table === 'users') return res.json(fallbackUsers.filter(u => !u.vkn || u.vkn === vkn || vkn === '1111111111'));\n          return res.json([]);\n        }`,
    `if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {\n          return res.json(getFallbackTable(table, vkn));\n        }`
)

// Generic POST
code = code.replace(
    /if \(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\) return res\.json\(req\.body\);/g,
    `if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
          const vkn = req.headers['x-tenant-id'] || '1111111111';
          insertFallbackRow(table, { ...req.body, vkn });
          return res.json(req.body);
        }`
);

fs.writeFileSync('server2.ts', code);
