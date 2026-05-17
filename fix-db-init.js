import fs from 'fs';

let content = fs.readFileSync('server/db.ts', 'utf8');

const sqlSchema = `
    const schemaSql = fs.readFileSync('esila_ticari_schema.sql', 'utf8');
    const statements = schemaSql.split(';').filter((s: string) => s.trim().length > 0);
    for (const stmt of statements) {
      await client.query(stmt);
    }
`;

content = content.replace("await client.query(`", `import fs from 'fs';\n\n    ` + sqlSchema + "\n    /*\n    await client.query(`");
content = content.replace("console.log(\"Database initialized successfully.\");", "*/\n    console.log(\"Database initialized successfully.\");");

fs.writeFileSync('server/db.ts', content);
