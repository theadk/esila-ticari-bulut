import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// Replace all GETs that return fallbackArrays
code = code.replace(/if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) return res\.json\(fallback(\w+)\);/g, (match, arrayName) => {
    let tableName = arrayName.toLowerCase();
    if (tableName === 'categories') tableName = 'categories';
    else if (tableName === 'brands') tableName = 'brands';
    else if (tableName === 'warehouses') tableName = 'warehouses';
    else if (tableName === 'reconciliations') tableName = 'reconciliations';
    else return match; // fallbackUsers and fallbackTenants might be different

    return `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) return res.json(getFallbackTable('${tableName}', req.headers['x-tenant-id'] || '1111111111'));`;
});

// Categories POST
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*fallbackCategories\.push\(newCat\);\s*return res\.json\(newCat\);\s*\}/g,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      insertFallbackRow('categories', { ...newCat, vkn });
      return res.json(newCat);
    }`
);

// Categories PUT
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*const idx = fallbackCategories\.findIndex\(c => String\(c\.id\) === String\(req\.params\.id\)\);\s*if \(idx \!\=\= -1\) fallbackCategories\[idx\] = \{ \.\.\.fallbackCategories\[idx\], \.\.\.req\.body, id: req\.params\.id \};\s*return res\.json\(\{ id: req\.params\.id, \.\.\.req\.body \}\);\s*\}/g,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      updateFallbackRow('categories', req.params.id, vkn, req.body);
      return res.json({ id: req.params.id, ...req.body });
    }`
);

// Categories DELETE
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*fallbackCategories = fallbackCategories\.filter\(c => String\(c\.id\) \!\=\= String\(req\.params\.id\)\);\s*return res\.json\(\{ success: true \}\);\s*\}/g,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      deleteFallbackRow('categories', req.params.id, req.headers['x-tenant-id'] || '1111111111');
      return res.json({ success: true });
    }`
);

// Brands POST
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*const newBrand = \{ \.\.\.req\.body, id: req\.body\.id \|\| String\(Date\.now\(\)\) \};\s*fallbackBrands\.push\(newBrand\);\s*return res\.json\(newBrand\);\s*\}/g,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      const newBrand = { ...req.body, vkn, id: req.body.id || String(Date.now()) };
      insertFallbackRow('brands', newBrand);
      return res.json(newBrand);
    }`
);

// Brands PUT
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*const idx = fallbackBrands\.findIndex\(b => String\(b\.id\) === String\(req\.params\.id\)\);\s*if \(idx \!\=\= -1\) fallbackBrands\[idx\] = \{ \.\.\.fallbackBrands\[idx\], \.\.\.req\.body, id: req\.params\.id \};\s*return res\.json\(\{ id: req\.params\.id, \.\.\.req\.body \}\);\s*\}/g,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      updateFallbackRow('brands', req.params.id, vkn, req.body);
      return res.json({ id: req.params.id, ...req.body });
    }`
);

// Brands DELETE
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*fallbackBrands = fallbackBrands\.filter\(b => String\(b\.id\) \!\=\= String\(req\.params\.id\)\);\s*return res\.json\(\{ success: true \}\);\s*\}/g,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      deleteFallbackRow('brands', req.params.id, req.headers['x-tenant-id'] || '1111111111');
      return res.json({ success: true });
    }`
);

// Warehouses POST
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*const newWh = \{ \.\.\.req\.body, id: req\.body\.id \|\| String\(Date\.now\(\)\) \};\s*fallbackWarehouses\.push\(newWh\);\s*return res\.json\(newWh\);\s*\}/g,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      const newWh = { ...req.body, vkn, id: req.body.id || String(Date.now()) };
      insertFallbackRow('warehouses', newWh);
      return res.json(newWh);
    }`
);

// Warehouses PUT
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*const idx = fallbackWarehouses\.findIndex\(w => String\(w\.id\) === String\(req\.params\.id\)\);\s*if \(idx \!\=\= -1\) fallbackWarehouses\[idx\] = \{ \.\.\.fallbackWarehouses\[idx\], \.\.\.req\.body, id: req\.params\.id \};\s*return res\.json\(\{ id: req\.params\.id, \.\.\.req\.body \}\);\s*\}/g,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      updateFallbackRow('warehouses', req.params.id, vkn, req.body);
      return res.json({ id: req.params.id, ...req.body });
    }`
);

// Warehouses DELETE
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*fallbackWarehouses = fallbackWarehouses\.filter\(w => String\(w\.id\) \!\=\= String\(req\.params\.id\)\);\s*return res\.json\(\{ success: true \}\);\s*\}/g,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      deleteFallbackRow('warehouses', req.params.id, req.headers['x-tenant-id'] || '1111111111');
      return res.json({ success: true });
    }`
);

// Reconciliations POST
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*fallbackReconciliations\.push\(mutabakat\);\s*return res\.json\(mutabakat\);\s*\}/g,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      insertFallbackRow('reconciliations', { ...mutabakat, vkn });
      return res.json(mutabakat);
    }`
);

// Reconciliations PUT
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*const idx = fallbackReconciliations\.findIndex\(r => String\(r\.id\) === String\(req\.params\.id\)\);\s*if \(idx \!\=\= -1\) fallbackReconciliations\[idx\] = \{ \.\.\.fallbackReconciliations\[idx\], \.\.\.req\.body, id: req\.params\.id \};\s*return res\.json\(\{ id: req\.params\.id, \.\.\.req\.body \}\);\s*\}/g,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      updateFallbackRow('reconciliations', req.params.id, vkn, req.body);
      return res.json({ id: req.params.id, ...req.body });
    }`
);

// Reconciliations DELETE
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*fallbackReconciliations = fallbackReconciliations\.filter\(r => String\(r\.id\) \!\=\= String\(req\.params\.id\)\);\s*return res\.json\(\{ success: true \}\);\s*\}/g,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      deleteFallbackRow('reconciliations', req.params.id, req.headers['x-tenant-id'] || '1111111111');
      return res.json({ success: true });
    }`
);

fs.writeFileSync('server.ts', code);
