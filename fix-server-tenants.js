import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// For custom products, categories, brands, warehouses, reconciliations getters:
code = code.replace(/await pool\.query\('SELECT \* FROM (\w+)'\)/g, 
  "await pool.query('SELECT * FROM $1 WHERE vkn = ?', [req.headers['x-tenant-id'] || '1111111111'])");

// Deletes
code = code.replace(/await pool\.query\('DELETE FROM (\w+) WHERE id = \?', \[([^\]]+)\]\)/g, 
  "await pool.query('DELETE FROM $1 WHERE id = ? AND vkn = ?', [$2, req.headers['x-tenant-id'] || '1111111111'])");

// categories put
code = code.replace(/await pool\.query\('UPDATE categories SET name = \?, sub_categories = \? WHERE id = \?', \[name, JSON\.stringify\(subCategories\), id\]\)/g,
  "await pool.query('UPDATE categories SET name = ?, sub_categories = ? WHERE id = ? AND vkn = ?', [name, JSON.stringify(subCategories), id, req.headers['x-tenant-id'] || '1111111111'])");

// categories post
code = code.replace(/await pool\.query\('INSERT INTO categories \(id, name, sub_categories\) VALUES \(\?, \?, \?\)', \[id, name, JSON\.stringify\(subCategories\)\]\)/g,
  "await pool.query('INSERT INTO categories (vkn, id, name, sub_categories) VALUES (?, ?, ?, ?)', [req.headers['x-tenant-id'] || '1111111111', id, name, JSON.stringify(subCategories)])");

// brands put
code = code.replace(/await pool\.query\('UPDATE brands SET name = \? WHERE id = \?', \[name, id\]\)/g,
  "await pool.query('UPDATE brands SET name = ? WHERE id = ? AND vkn = ?', [name, id, req.headers['x-tenant-id'] || '1111111111'])");

// brands post
code = code.replace(/await pool\.query\('INSERT INTO brands \(id, name\) VALUES \(\?, \?\)', \[id, name\]\)/g,
  "await pool.query('INSERT INTO brands (vkn, id, name) VALUES (?, ?, ?)', [req.headers['x-tenant-id'] || '1111111111', id, name])");

// warehouses post
code = code.replace(/await pool\.query\(\s*'INSERT INTO warehouses \(id, name, address, capacity\) VALUES \(\?, \?, \?, \?\)',\s*\[id, name, address, capacity\]\s*\)/g,
  "await pool.query('INSERT INTO warehouses (vkn, id, name, address, capacity) VALUES (?, ?, ?, ?, ?)', [req.headers['x-tenant-id'] || '1111111111', id, name, address, capacity])");

// warehouses put
code = code.replace(/await pool\.query\(\s*'UPDATE warehouses SET name = \?, address = \?, capacity = \? WHERE id = \?',\s*\[name, address, capacity, req\.params\.id\]\s*\)/g,
  "await pool.query('UPDATE warehouses SET name = ?, address = ?, capacity = ? WHERE id = ? AND vkn = ?', [name, address, capacity, req.params.id, req.headers['x-tenant-id'] || '1111111111'])");

// products post
code = code.replace(/await pool\.query\(\s*'INSERT INTO products \(([^)]+)\) VALUES \(([^)]+)\)',\s*\[(.*?)\]\s*\)/g,
  "await pool.query('INSERT INTO products (vkn, $1) VALUES (?, $2)', [req.headers['x-tenant-id'] || '1111111111', $3])");

// products put
code = code.replace(/await pool\.query\(\s*'UPDATE products SET ([^W]+) WHERE id = \?',\s*\[(.*?)\]\s*\)/g,
  "await pool.query('UPDATE products SET $1 WHERE id = ? AND vkn = ?', [$2, req.headers['x-tenant-id'] || '1111111111'])");

// reconciliations post
code = code.replace(/await pool\.query\(\s*'INSERT INTO reconciliations \(([^)]+)\) VALUES \(([^)]+)\)',\s*\[(.*?)\]\s*\)/g,
  "await pool.query('INSERT INTO reconciliations (vkn, $1) VALUES (?, $2)', [req.headers['x-tenant-id'] || '1111111111', $3])");

// reconciliations put
code = code.replace(/await pool\.query\(\s*'UPDATE reconciliations SET ([^W]+) WHERE id = \?',\s*\[(.*?)\]\s*\)/g,
  "await pool.query('UPDATE reconciliations SET $1 WHERE id = ? AND vkn = ?', [$2, req.headers['x-tenant-id'] || '1111111111'])");

// Generic API GET
code = code.replace(/const \[rows\] = await pool\.query\(`SELECT \* FROM \$\{table\}`\);/g,
  "const vkn = req.headers['x-tenant-id'] || '1111111111';\n        const [rows] = await pool.query(`SELECT * FROM ${table} WHERE vkn = ?`, [vkn]);");

// Generic API POST
code = code.replace(/const query = `INSERT INTO \$\{table\} \(\$\{fields\}\) VALUES \(\$\{questionMarks\}\)`;\s+await pool\.query\(query, values\);/g,
  "const vkn = req.headers['x-tenant-id'] || '1111111111';\n        const query = `INSERT INTO ${table} (vkn, ${fields}) VALUES (?, ${questionMarks})`;\n        await pool.query(query, [vkn, ...values]);");

// Generic API PUT
code = code.replace(/const query = `UPDATE \$\{table\} SET \$\{setString\} WHERE id = \?`;\s+await pool\.query\(query, \[\.\.\.values, req\.params\.id\]\);/g,
  "const vkn = req.headers['x-tenant-id'] || '1111111111';\n        const query = `UPDATE ${table} SET ${setString} WHERE id = ? AND vkn = ?`;\n        await pool.query(query, [...values, req.params.id, vkn]);");

// Generic API DELETE
code = code.replace(/await pool\.query\(`DELETE FROM \$\{table\} WHERE id = \?`, \[req\.params\.id\]\);/g,
  "const vkn = req.headers['x-tenant-id'] || '1111111111';\n        await pool.query(`DELETE FROM ${table} WHERE id = ? AND vkn = ?`, [req.params.id, vkn]);");

fs.writeFileSync('server.ts', code);
