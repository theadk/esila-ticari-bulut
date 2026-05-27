const fs = require('fs');

function updateServerFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Insert password generator at the top
  const generatorFn = `
function generateSecurePassword() {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+~\`|}{[]:;?><,./-=';
  const all = lowercase + uppercase + numbers + symbols;

  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = password.length; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password.split('').sort(() => 0.5 - Math.random()).join('');
}
`;
  if (!content.includes('generateSecurePassword()')) {
    content = content.replace("import express from 'express';", "import express from 'express';\n" + generatorFn);
  }

  content = content.replace(
    /app.get\('\/api\/tenants', async \(req, res\) => \{[\s\S]*?res\.json\(rows\);\s*\} catch/g,
    `app.get('/api/tenants', async (req, res) => {
    try {
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
         const tenants = getFallbackTable('tenants');
         const users = getFallbackTable('users');
         const resData = tenants.map((t) => {
            const u = users.find((us) => us.vkn === t.vkn && us.role === 'Admin');
            return { ...t, password: u ? u.passwordHash : '' };
         });
         return res.json(resData);
      }
      const pool = getPool();
      const [rows] = await pool.query("SELECT t.*, u.passwordHash as password FROM tenants t LEFT JOIN users u ON t.vkn = u.vkn AND u.role = 'Admin' GROUP BY t.vkn");
      res.json(rows);
    } catch`
  );

  if (!content.includes('const newAdminPass = generateSecurePassword();')) {
      content = content.replace(
        /const data = req\.body;/,
        `const data = req.body;
      const newAdminPass = generateSecurePassword();`
      );
      
      content = content.replace(
        /passwordHash:\s*data\.vkn\s*\+\s*'123'/g,
        `passwordHash: newAdminPass`
      );
      
      content = content.replace(
        /\["admin-" \+ data\.vkn, data\.vkn, data\.name \+ ' Admin', data\.vkn, data\.email, data\.vkn \+ '123'\]/g,
        `["admin-" + data.vkn, data.vkn, data.name + ' Admin', data.vkn, data.email, newAdminPass]`
      );
  }

  content = content.replace(
    /const sendActivationMail = async \(tenantEmail: string, tenantName: string\) => \{/g,
    `const sendActivationMail = async (tenantEmail: string, tenantName: string, adminPassword?: string) => {
         const passInfo = adminPassword ? (\`<p>Sisteme giriş yapabilirsiniz.</p><p><b>Kullanıcı Adı:</b> \${req.params.vkn}<br><b>Şifre:</b> \${adminPassword}</p>\`) : '<p>Sisteme giriş yapabilirsiniz.</p>';`
  );

  content = content.replace(
    /`<p>Sayın \${tenantName},<\/p><p>Esila Ticari üyeliğiniz başarıyla onaylanmış ve hesabınız aktive edilmiştir\. Sisteme giriş yapabilirsiniz\.<\/p>`/g,
    `\`<p>Sayın \${tenantName},</p><p>Esila Ticari üyeliğiniz başarıyla onaylanmış ve hesabınız aktive edilmiştir.</p>\${passInfo}\``
  );

  content = content.replace(
    /if \(t\) await sendActivationMail\(t\.email, t\.name\);/,
    `if (t) {
           const fallbacksU = getFallbackTable('users');
           const au = fallbacksU.find((u) => u.vkn === vkn && u.role === 'Admin');
           await sendActivationMail(t.email, t.name, au ? au.passwordHash : '');
        }`
  );

  content = content.replace(
    /if \(rows && rows\.length > 0\) \{\s*await sendActivationMail\(rows\[0\]\.email, rows\[0\]\.name\);\s*\}/,
    `if (rows && rows.length > 0) {
         const [uRows] = await pool.query("SELECT passwordHash FROM users WHERE vkn = ? AND role = 'Admin'", [vkn]);
         const adminPass = uRows && uRows.length > 0 ? uRows[0].passwordHash : '';
         await sendActivationMail(rows[0].email, rows[0].name, adminPass);
      }`
  );
  
  fs.writeFileSync(file, content);
}

updateServerFile('server.ts');
updateServerFile('server2.ts');
console.log('updated server files for strong passwords');
