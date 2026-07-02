const fs = require('fs');

function fix(file) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/\(await pool\.query\) as any\(/g, 'await pool.query(');
  // Add `as any` at the end of those specific statements if needed, or just cast `rows.length` instead.
  // Actually, wait, `rows.length` is already casted as `(rows as any[]).length` so I don't need `as any` on `await pool.query()`.
  fs.writeFileSync(file, code);
}
fix('server.ts');
fix('server2.ts');
