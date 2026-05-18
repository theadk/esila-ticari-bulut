import fs from 'fs';

let code = fs.readFileSync('server2.ts', 'utf8');

// Fix app.put in generic
code = code.replace(
  /app\.put\(\`\/api\/\$\{table\}\/:id\`, async \(req, res\) => \{\s*try \{\s*if \(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\) \{\s*const vkn = req\.headers\['x-tenant-id'\] \|\| '1111111111';\s*insertFallbackRow\(table, \{ \.\.\.req\.body, vkn \}\);\s*return res\.json\(req\.body\);\s*\}/,
  `app.put(\`/api/\${table}/:id\`, async (req, res) => {
      try {
        if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
          const vkn = req.headers['x-tenant-id'] || '1111111111';
          updateFallbackRow(table, req.params.id, vkn, req.body);
          return res.json({ id: req.params.id, ...req.body });
        }`
);

fs.writeFileSync('server.ts', code);
