import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// fallbackBrands POST
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*fallbackBrands\.push\(req\.body\);\s*return res\.json\(req\.body\);\s*\}/g,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
    insertFallbackRow('brands', { ...req.body, vkn: req.headers['x-tenant-id'] || '1111111111' });
    return res.json(req.body);
  }`
);

// fallbackWarehouses POST
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*fallbackWarehouses\.push\(req\.body\);\s*return res\.json\(req\.body\);\s*\}/g,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
    insertFallbackRow('warehouses', { ...req.body, vkn: req.headers['x-tenant-id'] || '1111111111' });
    return res.json(req.body);
  }`
);

// fallbackWarehouses DELETE
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*const initLen = fallbackWarehouses\.length;\s*const filtered = fallbackWarehouses\.filter\(w => String\(w\.id\) !== String\(req\.params\.id\)\);\s*fallbackWarehouses\.length = 0;\s*fallbackWarehouses\.push\(\.\.\.filtered\);\s*return res\.json\(\{ success: true \}\);\s*\}/g,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      deleteFallbackRow('warehouses', req.params.id, req.headers['x-tenant-id'] || '1111111111');
      return res.json({ success: true });
    }`
);

// let fallbackReconciliations: any[] = [];
code = code.replace(/let fallbackReconciliations: any\[\] = \[\];/g, "");

// fallbackReconciliations PUT
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*const idx = fallbackReconciliations\.findIndex\(r => String\(r\.id\) === String\(id\)\);\s*if \(idx \!\=\= -1\) fallbackReconciliations\[idx\] = \{ \.\.\.fallbackReconciliations\[idx\], \.\.\.req\.body, id \};\s*return res\.json\(\{ id, \.\.\.req\.body \}\);\s*\}/g,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      updateFallbackRow('reconciliations', id, req.headers['x-tenant-id'] || '1111111111', req.body);
      return res.json({ id, ...req.body });
    }`
);

// fallbackReconciliations Approve
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*const rec = fallbackReconciliations\.find\(r => String\(r\.id\) === String\(id\)\);\s*if \(rec\) \{\s*rec\.status = 'Onaylandı';\s*rec\.respondedAt = date;\s*rec\.responseNotes = notes;\s*\}\s*return res\.send\(\`\n.*?<\/html>\`\);\s*\}/s,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      updateFallbackRow('reconciliations', id, req.headers['x-tenant-id'] || '1111111111', { status: 'Onaylandı', respondedAt: date, responseNotes: notes });
      return res.send(\`<html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Mutabakat Başarıyla Onaylandı</h2><p>Teşekkür ederiz.</p></body></html>\`);
    }`
);

// fallbackReconciliations Reject
code = code.replace(
  /if \(\(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\)\) \{\s*const rec = fallbackReconciliations\.find\(r => String\(r\.id\) === String\(id\)\);\s*if \(rec\) \{\s*rec\.status = 'Reddedildi';\s*rec\.respondedAt = date;\s*rec\.responseNotes = notes;\s*\}\s*return res\.send\(\`\n.*?<\/html>\`\);\s*\}/s,
  `if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      updateFallbackRow('reconciliations', id, req.headers['x-tenant-id'] || '1111111111', { status: 'Reddedildi', respondedAt: date, responseNotes: notes });
      return res.send(\`<html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Mutabakat Reddedildi</h2><p>Geri bildiriminiz için teşekkür ederiz.</p></body></html>\`);
    }`
);

// fallbackTenants POST
code = code.replace(
  /fallbackTenants\.push\(\{\s*\.\.\.data,\s*status: 'Bekliyor',\s*expirationDate: dDate\.toISOString\(\)\s*\}\);/g,
  `insertFallbackRow('tenants', { ...data, status: 'Bekliyor', expirationDate: dDate.toISOString() });`
);
code = code.replace(
  /fallbackUsers\.push\(\{\s*id: "admin-" \+ data\.vkn,\s*vkn: data\.vkn,\s*name: data\.name \+ ' Admin',\s*username: data\.vkn,\s*email: data\.email,\s*passwordHash: data\.vkn \+ '123',\s*role: 'Admin',\s*status: 'Aktif'\s*\}\);/g,
  `insertFallbackRow('users', { id: "admin-" + data.vkn, vkn: data.vkn, name: data.name + ' Admin', username: data.vkn, email: data.email, passwordHash: data.vkn + '123', role: 'Admin', status: 'Aktif' });
   insertFallbackRow('settings', { vkn: data.vkn, id: 1, companyName: data.name, email: data.email });`
);

// fallbackTenants PUT
code = code.replace(
  /if \(\!process\.env\.DATABASE_URL \|\| \!process\.env\.DATABASE_URL\.startsWith\("mysql"\)\) \{\s*const t = fallbackTenants\.find\(x => x\.vkn === vkn\);\s*if \(t\) t\.status = 'Aktif';\s*return res\.json\(\{success: true\}\);\s*\}/g,
  `if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
      updateFallbackRow('tenants', vkn, vkn, { status: 'Aktif' }); // Note: wait, id of tenant is its vkn... fallbackDb searches by id? The tenant has vkn as primary key!
      // I'll manually modify tenants lookup below.
      return res.json({success: true});
    }`
);

fs.writeFileSync('server.ts', code);
