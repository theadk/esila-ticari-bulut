import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const tenantAPI = `
  app.get('/api/tenants', async (req, res) => {
    try {
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) return res.json([]);
      const pool = getPool();
      const [rows] = await pool.query("SELECT * FROM tenants");
      res.json(rows);
    } catch (e) { res.status(500).json({error: String(e)}); }
  });

  app.post('/api/tenants', async (req, res) => {
    try {
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) return res.json({success: true});
      const pool = getPool();
      const data = req.body;
      const q = "INSERT INTO tenants (vkn, name, email, modules, status) VALUES (?, ?, ?, ?, 'Bekliyor')";
      await pool.query(q, [data.vkn, data.name, data.email, data.modules]);
      
      // Seed user for tenant
      await pool.query("INSERT INTO users (id, vkn, name, username, email, passwordHash, role, status) VALUES (?, ?, ?, ?, ?, ?, 'Admin', 'Aktif')",
        ["admin-" + data.vkn, data.vkn, data.name + ' Admin', data.vkn, data.email, data.vkn + '123']
      );

      res.json({success: true});
    } catch(e) { res.status(500).json({error: String(e)}); }
  });

  // Generic CRUD API for all tables
`;

content = content.replace("  // Generic CRUD API for all tables", tenantAPI);

fs.writeFileSync('server.ts', content);
