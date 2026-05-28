const fs = require('fs');

function addToggleStatus(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes("app.put('/api/tenants/:vkn/toggle-status'")) return;
  
  const endpoint = `
  app.put('/api/tenants/:vkn/toggle-status', async (req, res) => {
    try {
      const { vkn } = req.params;
      
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const fallbacks = getFallbackTable('tenants');
        const t = fallbacks.find((x) => x.vkn === vkn);
        if (t) {
           t.status = t.status === 'Aktif' ? 'Pasif' : 'Aktif';
           
           const fallbacksU = getFallbackTable('users');
           fallbacksU.forEach(u => {
              if (u.vkn === vkn) u.status = t.status;
           });
           
           return res.json({success: true, status: t.status});
        }
        return res.status(404).json({error: 'Firma bulunamadı'});
      }
      
      const pool = getPool();
      const [rows] = await pool.query("SELECT status FROM tenants WHERE vkn = ?", [vkn]);
      if (rows.length === 0) return res.status(404).json({error: "Firma bulunamadı"});
      
      const newStatus = rows[0].status === 'Aktif' ? 'Pasif' : 'Aktif';
      await pool.query("UPDATE tenants SET status = ? WHERE vkn = ?", [newStatus, vkn]);
      await pool.query("UPDATE users SET status = ? WHERE vkn = ?", [newStatus, vkn]);
      
      res.json({success: true, status: newStatus});
    } catch(e) { res.status(500).json({error: String(e)}); }
  });
  `;
  
  content = content.replace(
    /app\.put\('\/api\/tenants\/:vkn\/activate', async \(req, res\) => \{/,
    endpoint + "\n  app.put('/api/tenants/:vkn/activate', async (req, res) => {"
  );
  fs.writeFileSync(file, content);
}

addToggleStatus('server.ts');
addToggleStatus('server2.ts');
console.log('done');
