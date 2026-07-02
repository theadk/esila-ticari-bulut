const fs = require('fs');

function fixFile(file) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  code = code.replace(/tenan\(tRows as any\[\]\)\.length/g, '(tenantRows as any[]).length');
  // Also 2322 in server.ts: Property 'length' does not exist on type 'QueryResult'
  // I'll just change any `length` error manually in the regex
  code = code.replace(/\[\w+Rows\] = await pool\.query/g, (match) => match.replace('await', '(await') + ') as any');
  code = code.replace(/\[aRows\] = await pool\.query/g, '[aRows] = (await pool.query')

  fs.writeFileSync(file, code);
}

fixFile('server.ts');
fixFile('server2.ts');
