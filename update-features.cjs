const fs = require('fs');

function updateServerFiles(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  if(code.includes('INSERT INTO tenants (vkn, name, email, modules, status, package, expirationDate)')) {
    code = code.replace(
      /const q \= `INSERT INTO tenants \(vkn, name, email, modules, status, package, expirationDate\) VALUES \(\?, \?, \?, \?, 'Bekliyor', \?, DATE_ADD\(NOW\(\), INTERVAL \$\{expInterval\}\)\)`;\n\s*await pool\.query\(q, \[data\.vkn, data\.name, data\.email, JSON\.stringify\(data\.modules\), data\.package \|\| 'Yıllık'\]\);/g,
      "const q = `INSERT INTO tenants (vkn, name, email, modules, status, package, expirationDate, sector) VALUES (?, ?, ?, ?, 'Bekliyor', ?, DATE_ADD(NOW(), INTERVAL ${expInterval}), ?)`;\n      await pool.query(q, [data.vkn, data.name, data.email, JSON.stringify(data.modules), data.package || 'Yıllık', data.sector || '']);"
    );
  }

  // 2. Add /api/tenants/:vkn/reset-password endpoint
  if(!code.includes("app.post('/api/tenants/:vkn/reset-password'")) {
    const pwdEndpoint = `
  app.post('/api/tenants/:vkn/reset-password', async (req, res) => {
    try {
      const { vkn } = req.params;
      const newAdminPass = generateSecurePassword();

      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const fallbacksU = getFallbackTable('users');
        const adminUser = fallbacksU.find(u => u.vkn === vkn && u.role === 'Admin');
        if (adminUser) {
           adminUser.passwordHash = newAdminPass;
           
           const fallbacksT = getFallbackTable('tenants');
           const tenant = fallbacksT.find(t => t.vkn === vkn);
           
           if (tenant && tenant.email) {
             await sendMail(
                tenant.email,
                "Şifreniz Sıfırlandı - Esila Ticari",
                \`<p>Sayın \${tenant.name},</p><p>Sistem yöneticiniz tarafından şifreniz sıfırlanmıştır.</p><p><b>Yeni Şifreniz:</b> \${newAdminPass}</p>\`
             );
           }
           
           return res.json({success: true, password: newAdminPass});
        }
        return res.status(404).json({error: "Yönetici hesabı bulunamadı."});
      }

      const pool = getPool();
      const [rows] = await pool.query("SELECT * FROM users WHERE vkn = ? AND role = 'Admin'", [vkn]);
      if (rows.length === 0) return res.status(404).json({error: "Admin kullanıcı bulunamadı."});
      
      const adminUser = rows[0];
      await pool.query("UPDATE users SET passwordHash = ? WHERE id = ?", [newAdminPass, adminUser.id]);
      
      const [tenantRows] = await pool.query("SELECT * FROM tenants WHERE vkn = ?", [vkn]);
      const tenant = tenantRows[0];
      if (tenant && tenant.email) {
         await sendMail(
            tenant.email,
            "Şifreniz Sıfırlandı - Esila Ticari",
            \`<p>Sayın \${tenant.name},</p><p>Sistem yöneticiniz tarafından şifreniz sıfırlanmıştır.</p><p><b>Yeni Şifreniz:</b> \${newAdminPass}</p>\`
         );
      }
      
      res.json({success: true, password: newAdminPass});
    } catch(e) { res.status(500).json({error: String(e)}); }
  });
`;
    // Insert just before `app.post('/api/tenants'`
    code = code.replace(
      "app.post('/api/tenants', async (req, res) => {",
      pwdEndpoint + "\n  app.post('/api/tenants', async (req, res) => {"
    );
  }

  fs.writeFileSync(file, code);
}

updateServerFiles('server.ts');
updateServerFiles('server2.ts');
console.log('done updating servers');
