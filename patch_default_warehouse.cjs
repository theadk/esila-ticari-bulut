const fs = require('fs');

let code = fs.readFileSync('server/db.ts', 'utf8');

const insertDefaultWarehouse = `
    // Insert default warehouse if empty
    try {
      const [whRows] = await client.query("SELECT COUNT(*) as cnt FROM warehouses");
      if (whRows[0].cnt === 0) {
        await client.query("INSERT INTO warehouses (vkn, id, name, capacity) VALUES ('1111111111', 'wh-1', 'Merkez Depo', 1000)");
        console.log("Inserted default Merkez Depo");
      }
    } catch(e) {}
`;

if (!code.includes("Inserted default Merkez Depo")) {
    code = code.replace(
      'console.log("Database tables created successfully.");',
      insertDefaultWarehouse + '\n    console.log("Database tables created successfully.");'
    );
    fs.writeFileSync('server/db.ts', code);
    console.log("Patched server/db.ts for default warehouse");
}
