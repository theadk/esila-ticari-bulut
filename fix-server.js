import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/startsWith\("postgres"\)/g, 'startsWith("mysql")');
content = content.replace(/\$[0-9]+/g, '?');
// Also need to fix destructuring since mysql2 returns [rows, fields] instead of {rows}
content = content.replace(/const \{ rows \} = await pool\.query/g, 'const [rows] = await pool.query');

fs.writeFileSync('server.ts', content);
