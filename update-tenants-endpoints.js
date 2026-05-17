import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\('\/api\/tenants', async \(req, res\) => {[\s\S]*?}\);/;
const getReplacement = `app.get('/api/tenants', async (req, res) => {
    try {
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) return res.json(fallbackTenants);
      const pool = getPool();
      const [rows] = await pool.query("SELECT * FROM tenants");
      res.json(rows);
    } catch (e) { res.status(500).json({error: String(e)}); }
  });`;

content = content.replace(regex, getReplacement);

const regexPost = /app\.post\('\/api\/tenants', async \(req, res\) => {[\s\S]*?}\);/;
const postReplacement = `app.post('/api/tenants', async (req, res) => {
    try {
      const data = req.body;
      let expInterval = '1 YEAR';
      if (data.package === 'Aylık') expInterval = '1 MONTH';
      if (data.package === 'Sınırsız') expInterval = '100 YEAR';

      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const dDate = new Date();
        dDate.setFullYear(dDate.getFullYear() + (data.package === 'Aylık' ? 0 : data.package === 'Sınırsız' ? 100 : 1));
        if (data.package === 'Aylık') dDate.setMonth(dDate.getMonth() + 1);

        fallbackTenants.push({
          ...data,
          status: 'Bekliyor',
          expirationDate: dDate.toISOString()
        });
        return res.json({success: true});
      }

      const pool = getPool();
      const q = \`INSERT INTO tenants (vkn, name, email, modules, status, package, expirationDate) VALUES (?, ?, ?, ?, 'Bekliyor', ?, DATE_ADD(NOW(), INTERVAL \${expInterval}))\`;
      await pool.query(q, [data.vkn, data.name, data.email, JSON.stringify(data.modules), data.package || 'Yıllık']);
      
      // Seed user for tenant
      await pool.query("INSERT INTO users (id, vkn, name, username, email, passwordHash, role, status) VALUES (?, ?, ?, ?, ?, ?, 'Admin', 'Aktif')",
        ["admin-" + data.vkn, data.vkn, data.name + ' Admin', data.vkn, data.email, data.vkn + '123']
      );

      res.json({success: true});
    } catch(e) { res.status(500).json({error: String(e)}); }
  });

  app.put('/api/tenants/:vkn/activate', async (req, res) => {
    try {
      const { vkn } = req.params;
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const t = fallbackTenants.find(x => x.vkn === vkn);
        if (t) t.status = 'Aktif';
        return res.json({success: true});
      }
      const pool = getPool();
      await pool.query("UPDATE tenants SET status = 'Aktif' WHERE vkn = ?", [vkn]);
      res.json({success: true});
    } catch(e) { res.status(500).json({error: String(e)}); }
  });`;

content = content.replace(regexPost, postReplacement);

fs.writeFileSync('server.ts', content);
