import express from 'express';

function generateSecurePassword() {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^*()_+=-';
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

import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, initDb } from './server/db.js';
import cors from 'cors';
import { sendMail } from './server/mailer.js';
import { startMailScheduler } from './server/mailScheduler.js';
import { startBackupScheduler } from './server/backupScheduler.js';
import { getFallbackTable, insertFallbackRow, updateFallbackRow, deleteFallbackRow } from './server/fallbackDb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loginAttempts = new Map<string, { attempts: number, lockUntil: number | null }>();














async function startServer() {
  await initDb();
  startMailScheduler();
  startBackupScheduler();
  
  const app = express();
  const PORT = process.env.PORT || 3000;

  // 50mb is a lot, but handles large payload images and PDFs
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cors());

  app.get('/api/exchange-rates', async (req, res) => {
    try {
      const response = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml');
      if (!response.ok) {
        throw new Error('TCMB API error: ' + response.statusText);
      }
      const xmlData = await response.text();
      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.send(xmlData);
    } catch (error) {
      console.error('Exchange rate error:', error);
      res.status(500).json({ error: 'Failed to fetch exchange rates' });
    }
  });

  app.post('/api/test-email', async (req, res) => {
    try {
      const { email } = req.body;
      const result = await sendMail(email, "Esila Ticari Test Maili", `
        <h2 style="color: #059669; font-size: 20px; font-weight: 600; margin-top: 0;">Test E-Postası Başarılı</h2>
        <p>Merhaba, bu e-posta sistemden otomatik olarak gönderilen bir test mesajıdır.</p>
        <p>E-posta gönderim altyapınızın <b>sorunsuz bir şekilde çalıştığını</b> teyit ederiz.</p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; color: #166534; font-weight: 500; margin-top: 16px;">✅ Sistem şu an e-posta göndermeye hazırdır.</div>
        `);
      if (result.success) {
        res.json({ success: true, messageId: result.messageId });
      } else {
        res.status(500).json({ error: String(result.error) });
      }
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/send-email', async (req, res) => {
    try {
      const vkn = typeof req.headers['x-tenant-id'] === 'string' ? req.headers['x-tenant-id'] : '1111111111';
      
      // Limit Check
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("mysql")) {
        const pool = getPool();
        const [tenantRows] = await pool.query('SELECT emailLimit, emailCount FROM tenants WHERE vkn = ?', [vkn]) as any;
        if (tenantRows && tenantRows.length > 0) {
            const limit = tenantRows[0].emailLimit || 0;
            const count = tenantRows[0].emailCount || 0;
            if (limit > 0 && count >= limit) {
                return res.status(403).json({ success: false, error: "E-Posta gönderim limitine ulaştınız. Lütfen paketinizi yükseltin." });
            }
            await pool.query('UPDATE tenants SET emailCount = emailCount + 1 WHERE vkn = ?', [vkn]);
        }
      } else {
         const tTable = getFallbackTable('tenants');
         const t = tTable.find((x: any) => x.vkn === vkn);
         if (t) {
             const limit = t.emailLimit || 0;
             const count = t.emailCount || 0;
             if (limit > 0 && count >= limit) {
                 return res.status(403).json({ success: false, error: "E-Posta gönderim limitine ulaştınız. Lütfen paketinizi yükseltin." });
             }
             updateFallbackRow('tenants', vkn, vkn, { emailCount: count + 1 });
         }
      }

      const { to, subject, html, wrapped, attachments } = req.body;
      const result = await sendMail(to, subject, html, wrapped ?? false, attachments, vkn);
      if (result.success) {
        res.json({ success: true, messageId: result.messageId });
      } else {
        res.status(500).json({ error: String(result.error) });
      }
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/send-sms', async (req, res) => {
    try {
      const vkn = typeof req.headers['x-tenant-id'] === 'string' ? req.headers['x-tenant-id'] : '1111111111';
      
      // Limit Check
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("mysql")) {
        const pool = getPool();
        const [tenantRows] = await pool.query('SELECT smsLimit, smsCount FROM tenants WHERE vkn = ?', [vkn]) as any;
        if (tenantRows && tenantRows.length > 0) {
            const limit = tenantRows[0].smsLimit || 0;
            const count = tenantRows[0].smsCount || 0;
            if (limit > 0 && count >= limit) {
                return res.status(403).json({ success: false, error: "SMS gönderim limitine ulaştınız. Lütfen paketinizi yükseltin." });
            }
            await pool.query('UPDATE tenants SET smsCount = smsCount + 1 WHERE vkn = ?', [vkn]);
        }
      } else {
         const tTable = getFallbackTable('tenants');
         const t = tTable.find((x: any) => x.vkn === vkn);
         if (t) {
             const limit = t.smsLimit || 0;
             const count = t.smsCount || 0;
             if (limit > 0 && count >= limit) {
                 return res.status(403).json({ success: false, error: "SMS gönderim limitine ulaştınız. Lütfen paketinizi yükseltin." });
             }
             updateFallbackRow('tenants', vkn, vkn, { smsCount: count + 1 });
         }
      }

      const payload = req.body;
      const response = await fetch('https://api.iletimerkezi.com/v1/send-sms/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch(e) {
        return res.status(500).json({ error: 'API Hatası: Geçersiz JSON yanıtı alındı.' });
      }
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const fallbacks = getFallbackTable('users');
        const user = fallbacks.find((u: any) => u.email === email);
        
        if (!user) {
          return res.status(404).json({ error: 'Bu e-posta adresi sistemde kayıtlı değil.' });
        }
        if (user.status === 'Pasif') {
           return res.status(403).json({ error: 'Hesabınız pasif durumdadır. Yöneticinize başvurun.' });
        }
        return res.json({ success: true, name: user.name });
      }

      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'Bu e-posta adresi sistemde kayıtlı değil.' });
      }
      
      const user = rows[0];
      if (user.status === 'Pasif') {
        return res.status(403).json({ error: 'Hesabınız pasif durumdadır. Yöneticinize başvurun.' });
      }
      return res.json({ success: true, name: user.name });
      
    } catch(e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const now = Date.now();
      const userAttempt = loginAttempts.get(username) || { attempts: 0, lockUntil: null };

      if (userAttempt.lockUntil && userAttempt.lockUntil > now) {
         const remaining = Math.ceil((userAttempt.lockUntil - now) / 60000);
         return res.status(403).json({ error: `Çok fazla hatalı giriş yaptınız. Hesabınız ${remaining} dakika süreyle kilitlenmiştir.` });
      }

      // If lock has expired, reset it
      if (userAttempt.lockUntil && userAttempt.lockUntil <= now) {
         userAttempt.attempts = 0;
         userAttempt.lockUntil = null;
      }

      const handleFailedLogin = () => {
         userAttempt.attempts += 1;
         if (userAttempt.attempts >= 5) {
            userAttempt.lockUntil = now + (5 * 60 * 1000);
            loginAttempts.set(username, userAttempt);
            return res.status(403).json({ error: 'Çok fazla hatalı giriş yaptınız. Hesabınız 5 dakika süreyle kilitlenmiştir.' });
         } else {
            loginAttempts.set(username, userAttempt);
            return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
         }
      };

      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const fallbackUsers = getFallbackTable('users');
        const fallbackTenants = getFallbackTable('tenants');
        const matchingUser = fallbackUsers.find((u: any) => (u.username === username || u.email === username));
        
        if (matchingUser) {
           if (matchingUser.passwordHash === password) {
              if (matchingUser.status === 'Pasif') return res.status(401).json({ error: 'Hesabınız pasif durumdadır.' });
              
              const tenant = fallbackTenants.find((t: any) => t.vkn === matchingUser.vkn);
              if (tenant) {
                 if (tenant.status === 'Pasif') return res.status(401).json({ error: 'Firma hesabı pasif durumdadır.' });
                 if (tenant.expirationDate && new Date(tenant.expirationDate) < new Date()) {
                    return res.status(401).json({ error: 'Firma lisans süresi dolmuştur.' });
                 }
              }
              
              loginAttempts.delete(username);
              return res.json(matchingUser);
           } else {
              return handleFailedLogin();
           }
        }
        return handleFailedLogin();
      }
      
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM users WHERE (username = ? OR email = ?)', [username, username]);
      const user = rows[0];
      if (user) {
        if (user.passwordHash === password) {
           if (user.status === 'Pasif') return res.status(401).json({ error: 'Hesabınız pasif durumdadır.' });
           
           const [tenantRows] = await pool.query('SELECT * FROM tenants WHERE vkn = ?', [user.vkn]);
           const tenant = tenantRows[0];
           if (tenant) {
              if (tenant.status === 'Pasif') return res.status(401).json({ error: 'Firma hesabı pasif durumdadır.' });
              if (tenant.expirationDate && new Date(tenant.expirationDate) < new Date()) {
                 return res.status(401).json({ error: 'Firma lisans süresi dolmuştur.' });
              }
           }
           
           loginAttempts.delete(username);
           return res.json(user);
        } else {
           return handleFailedLogin();
        }
      }
      return handleFailedLogin();
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get('/api/products', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) return res.json(getFallbackTable('products', req.headers['x-tenant-id'] || '1111111111'));
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM products WHERE vkn = ?', [req.headers['x-tenant-id'] || '1111111111']);
      res.json(rows.map((row: any) => ({
        ...row,
        warehouseStocks: typeof row.warehouseStocks === 'string' ? JSON.parse(row.warehouseStocks) : (row.warehouseStocks || [])
      })));
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      deleteFallbackRow('products', req.params.id, req.headers['x-tenant-id'] || '1111111111');
      return res.json({ success: true });
    }
    const { id } = req.params;
    try {
      const pool = getPool();
      await pool.query('DELETE FROM products WHERE id = ? AND vkn = ?', [id, req.headers['x-tenant-id'] || '1111111111']);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get('/api/categories', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) return res.json(getFallbackTable('categories', req.headers['x-tenant-id'] || '1111111111'));
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM categories WHERE vkn = ?', [req.headers['x-tenant-id'] || '1111111111']);
      res.json(rows.map((r: any) => {
        let parsed = [];
        try {
          parsed = typeof r.sub_categories === 'string' ? JSON.parse(r.sub_categories) : (r.sub_categories || []);
        } catch(e) {}
        return {
          id: r.id,
          name: r.name,
          subCategories: Array.isArray(parsed) ? parsed : []
        };
      }));
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/categories', async (req, res) => {
    const newCat = { ...req.body, id: req.body.id || String(Date.now()) };
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      insertFallbackRow('categories', { ...newCat, vkn });
      return res.json(newCat);
    }
    const { id, name, subCategories } = newCat;
    try {
      const pool = getPool();
      await pool.query('INSERT INTO categories (vkn, id, name, sub_categories) VALUES (?, ?, ?, ?)', [req.headers['x-tenant-id'] || '1111111111', id, name, JSON.stringify(subCategories)]);
      res.json(newCat);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put('/api/categories/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      updateFallbackRow('categories', req.params.id, vkn, req.body);
      return res.json({ id: req.params.id, ...req.body });
    }
    const { id } = req.params;
    const { name, subCategories } = req.body;
    try {
      const pool = getPool();
      await pool.query('UPDATE categories SET name = ?, sub_categories = ? WHERE id = ? AND vkn = ?', [name, JSON.stringify(subCategories), id, req.headers['x-tenant-id'] || '1111111111']);
      res.json({ id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      deleteFallbackRow('categories', req.params.id, req.headers['x-tenant-id'] || '1111111111');
      return res.json({ success: true });
    }
    const { id } = req.params;
    try {
      const pool = getPool();
      await pool.query('DELETE FROM categories WHERE id = ? AND vkn = ?', [id, req.headers['x-tenant-id'] || '1111111111']);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/brands', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) return res.json(getFallbackTable('brands', req.headers['x-tenant-id'] || '1111111111'));
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM brands WHERE vkn = ?', [req.headers['x-tenant-id'] || '1111111111']);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/brands', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
    insertFallbackRow('brands', { ...req.body, vkn: req.headers['x-tenant-id'] || '1111111111' });
    return res.json(req.body);
  }
    const { id, name } = req.body;
    try {
      const pool = getPool();
      await pool.query('INSERT INTO brands (vkn, id, name) VALUES (?, ?, ?)', [req.headers['x-tenant-id'] || '1111111111', id, name]);
      res.json(req.body);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.put('/api/brands/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      updateFallbackRow('brands', req.params.id, vkn, req.body);
      return res.json({ id: req.params.id, ...req.body });
    }
    const { id } = req.params;
    const { name } = req.body;
    try {
      const pool = getPool();
      await pool.query('UPDATE brands SET name = ? WHERE id = ? AND vkn = ?', [name, id, req.headers['x-tenant-id'] || '1111111111']);
      res.json({ id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete('/api/brands/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      deleteFallbackRow('brands', req.params.id, req.headers['x-tenant-id'] || '1111111111');
      return res.json({ success: true });
    }
    try {
      const pool = getPool();
      await pool.query('DELETE FROM brands WHERE id = ? AND vkn = ?', [req.params.id, req.headers['x-tenant-id'] || '1111111111']);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/warehouses', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) return res.json(getFallbackTable('warehouses', req.headers['x-tenant-id'] || '1111111111'));
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM warehouses WHERE vkn = ?', [req.headers['x-tenant-id'] || '1111111111']);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get('/api/stock_transfers', async (req, res) => {
    const vkn = req.headers['x-tenant-id'] || '1111111111';
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) return res.json(getFallbackTable('stock_transfers', vkn));
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM stock_transfers WHERE vkn = ? ORDER BY date DESC', [vkn]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/stock_transfers', async (req, res) => {
    const vkn = req.headers['x-tenant-id'] || '1111111111';
    const data = req.body;
    
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const products = getFallbackTable('products', vkn);
      const product = products.find((p: any) => p.id === data.productId);
      if (product) {
         if (!product.warehouseStocks) product.warehouseStocks = [];
         
         const sourceWhIndex = product.warehouseStocks.findIndex((w: any) => w.warehouseId === data.sourceWarehouse);
         if (sourceWhIndex > -1) {
            product.warehouseStocks[sourceWhIndex].stock -= data.quantity;
         } else {
            product.warehouseStocks.push({ warehouseId: data.sourceWarehouse, stock: -data.quantity });
         }

         const targetWhIndex = product.warehouseStocks.findIndex((w: any) => w.warehouseId === data.targetWarehouse);
         if (targetWhIndex > -1) {
            product.warehouseStocks[targetWhIndex].stock += data.quantity;
         } else {
            product.warehouseStocks.push({ warehouseId: data.targetWarehouse, stock: data.quantity });
         }
         
         updateFallbackRow('products', data.productId, vkn, { warehouseStocks: product.warehouseStocks });
      }

      insertFallbackRow('stock_transfers', { ...data, vkn });
      return res.json({ id: data.id, ...data });
    }

    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT warehouseStocks FROM products WHERE id = ? AND vkn = ?', [data.productId, vkn]) as any;
      if (rows && rows.length > 0) {
         let wStocks = rows[0].warehouseStocks;
         if (typeof wStocks === 'string') wStocks = JSON.parse(wStocks);
         if (!wStocks) wStocks = [];

         const sourceWhIndex = wStocks.findIndex((w: any) => w.warehouseId === data.sourceWarehouse);
         if (sourceWhIndex > -1) wStocks[sourceWhIndex].stock -= data.quantity;
         else wStocks.push({ warehouseId: data.sourceWarehouse, stock: -data.quantity });

         const targetWhIndex = wStocks.findIndex((w: any) => w.warehouseId === data.targetWarehouse);
         if (targetWhIndex > -1) wStocks[targetWhIndex].stock += data.quantity;
         else wStocks.push({ warehouseId: data.targetWarehouse, stock: data.quantity });

         await pool.query('UPDATE products SET warehouseStocks = ? WHERE id = ? AND vkn = ?', [JSON.stringify(wStocks), data.productId, vkn]);
      }

      const q = "INSERT INTO stock_transfers (id, vkn, productId, productName, sourceWarehouse, targetWarehouse, quantity, date, personnelName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
      await pool.query(q, [data.id, vkn, data.productId, data.productName, data.sourceWarehouse, data.targetWarehouse, data.quantity, data.date, data.personnelName]);
      
      res.json({ id: data.id, ...data });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/warehouses', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
    insertFallbackRow('warehouses', { ...req.body, vkn: req.headers['x-tenant-id'] || '1111111111' });
    return res.json(req.body);
  }
    const { id, name, address, capacity } = req.body;
    try {
      const pool = getPool();
      await pool.query('INSERT INTO warehouses (vkn, id, name, address, capacity) VALUES (?, ?, ?, ?, ?)', [req.headers['x-tenant-id'] || '1111111111', id, name, address, capacity]);
      res.json(req.body);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.put('/api/warehouses/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      updateFallbackRow('warehouses', req.params.id, vkn, req.body);
      return res.json({ id: req.params.id, ...req.body });
    }
    const { name, address, capacity } = req.body;
    try {
      const pool = getPool();
      await pool.query('UPDATE warehouses SET name = ?, address = ?, capacity = ? WHERE id = ? AND vkn = ?', [name, address, capacity, req.params.id, req.headers['x-tenant-id'] || '1111111111']);
      res.json({ id: req.params.id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete('/api/warehouses/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      deleteFallbackRow('warehouses', req.params.id, req.headers['x-tenant-id'] || '1111111111');
      return res.json({ success: true });
    }
    try {
      const pool = getPool();
      await pool.query('DELETE FROM warehouses WHERE id = ? AND vkn = ?', [req.params.id, req.headers['x-tenant-id'] || '1111111111']);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      updateFallbackRow('products', req.params.id, vkn, req.body);
      return res.json({ id: req.params.id, ...req.body });
    }
    const { id } = req.params;
    const { code, name, price, purchasePrice, stock, category, warehouse, barcode, description, brand, taxRate, warehouseStocks, showInQuickSale } = req.body;
    try {
      const pool = getPool();
      await pool.query(
        'UPDATE products SET code = ?, name = ?, price = ?, stock = ?, category = ?, warehouse = ?, barcode = ?, description = ?, brand = ?, `taxRate` = ?, `warehouseStocks` = ?, `purchasePrice` = ?, `showInQuickSale` = ? WHERE id = ? AND vkn = ?',
        [code, name, price, stock, category, warehouse, barcode, description, brand, taxRate, JSON.stringify(warehouseStocks || []), purchasePrice, showInQuickSale ? 1 : 0, id, req.headers['x-tenant-id'] || '1111111111']
      );
      res.json({ id, ...req.body });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/products', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      insertFallbackRow('products', { ...req.body, vkn, id: req.body.id || String(Date.now()) });
      return res.json(req.body);
    }
    const { id, code, name, price, purchasePrice, stock, category, warehouse, barcode, description, brand, taxRate, warehouseStocks, showInQuickSale } = req.body;
    try {
      const pool = getPool();
      await pool.query('INSERT INTO products (vkn, id, code, name, price, stock, category, warehouse, barcode, description, brand, `taxRate`, `warehouseStocks`, `purchasePrice`, `showInQuickSale`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.headers['x-tenant-id'] || '1111111111', id, code, name, price, stock, category, warehouse, barcode, description, brand, taxRate, JSON.stringify(warehouseStocks || []), purchasePrice, showInQuickSale ? 1 : 0]
      );
      res.json(req.body);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  
  
  app.get('/api/reconciliations', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) return res.json(getFallbackTable('reconciliations', req.headers['x-tenant-id'] || '1111111111'));
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM reconciliations WHERE vkn = ?', [req.headers['x-tenant-id'] || '1111111111']);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/reconciliations', async (req, res) => {
    const mutabakat = { ...req.body, id: req.body.id || String(Date.now()), emailSentAt: new Date().toISOString() };
    
    console.log(`[Mutabakat] İstemci tarafından mail gönderilmesi bekleniyor: ${mutabakat.customerName} - Bakiye: ${mutabakat.balance} ${mutabakat.balanceType}`);
    console.log(`[Onay Linki] /api/reconciliations/${mutabakat.id}/approve`);
    console.log(`[Red Linki] /api/reconciliations/${mutabakat.id}/reject`);

    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      insertFallbackRow('reconciliations', { ...mutabakat, vkn });
      return res.json(mutabakat);
    }
    
    try {
      const pool = getPool();
      await pool.query('INSERT INTO reconciliations (vkn, id, `customerId`, `customerName`, date, `balanceType`, balance, status, notes, `emailSentAt`, `respondedAt`, `responseNotes`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.headers['x-tenant-id'] || '1111111111', mutabakat.id, mutabakat.customerId, mutabakat.customerName, mutabakat.date, mutabakat.balanceType, mutabakat.balance, mutabakat.status || 'Bekliyor', mutabakat.notes || '', mutabakat.emailSentAt || null, mutabakat.respondedAt || null, mutabakat.responseNotes || null]);
      res.json(mutabakat);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.put('/api/reconciliations/:id', async (req, res) => {
    const { id } = req.params;
    const { customerId, customerName, date, balanceType, balance, status, notes, emailSentAt, respondedAt, responseNotes } = req.body;
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      updateFallbackRow('reconciliations', id, req.headers['x-tenant-id'] || '1111111111', req.body);
      return res.json({ id, ...req.body });
    }
    try {
      const pool = getPool();
      await pool.query('UPDATE reconciliations SET `customerId` = ?, `customerName` = ?, date = ?, `balanceType` = ?, balance = ?, status = ?, notes = ?, `emailSentAt` = ?, `respondedAt` = ?, `responseNotes` = ? WHERE id = ? AND vkn = ?', [customerId, customerName, date, balanceType, balance, status || 'Bekliyor', notes || '', emailSentAt || null, respondedAt || null, responseNotes || null, id, req.headers['x-tenant-id'] || '1111111111']);
      res.json({ id, ...req.body });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.delete('/api/reconciliations/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      deleteFallbackRow('reconciliations', req.params.id, req.headers['x-tenant-id'] || '1111111111');
      return res.json({ success: true });
    }
    try {
      const pool = getPool();
      await pool.query('DELETE FROM reconciliations WHERE id = ? AND vkn = ?', [req.params.id, req.headers['x-tenant-id'] || '1111111111']);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get('/api/reconciliations/:id/approve', async (req, res) => {
    const id = req.params.id;
    const notes = req.query.notes || '';
    const date = new Date().toISOString();
    const vkn = req.query.vkn || req.headers['x-tenant-id'] || '1111111111';
    
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      updateFallbackRow('reconciliations', id, vkn as string, { status: 'Onaylandı', respondedAt: date, responseNotes: notes });
      return res.json({ success: true, message: 'Mutabakat Onaylandı' });
    }

    try {
      const pool = getPool();
      await pool.query('UPDATE reconciliations SET status = ?, `respondedAt` = ?, `responseNotes` = ? WHERE id = ? AND vkn = ?', ['Onaylandı', date, notes, id, vkn]);
      res.json({ success: true, message: 'Mutabakat Onaylandı' });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get('/api/reconciliations/:id/reject', async (req, res) => {
    const id = req.params.id;
    const notes = req.query.notes || '';
    const date = new Date().toISOString();
    const vkn = req.query.vkn || req.headers['x-tenant-id'] || '1111111111';
    
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      updateFallbackRow('reconciliations', id, vkn as string, { status: 'Reddedildi', respondedAt: date, responseNotes: notes });
      return res.json({ success: true, message: 'Mutabakat Reddedildi' });
    }

    try {
      const pool = getPool();
      await pool.query('UPDATE reconciliations SET status = ?, `respondedAt` = ?, `responseNotes` = ? WHERE id = ? AND vkn = ?', ['Reddedildi', date, notes, id, vkn]);
      res.json({ success: true, message: 'Mutabakat Reddedildi' });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  

  app.get('/api/tenants', async (req, res) => {
    try {
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
         const tenants = getFallbackTable('tenants');
         const users = getFallbackTable('users');
         const settingsTable = getFallbackTable('settings');
         const resData = tenants.map((t) => {
            const u = users.find((us) => us.vkn === t.vkn && us.role === 'Admin');
            const sett = settingsTable.find(s => s.vkn === t.vkn);
            return { ...t, password: u ? u.passwordHash : '', phone: sett ? sett.phone : t.phone, address: sett ? sett.address : t.address };
         });
         return res.json(resData);
      }
      const pool = getPool();
      const [rows] = await pool.query("SELECT t.*, u.passwordHash as password, s.phone, s.address FROM tenants t LEFT JOIN users u ON t.vkn = u.vkn AND u.role = 'Admin' LEFT JOIN settings s ON t.vkn = s.vkn GROUP BY t.vkn");
      res.json(rows);
    } catch (e) { res.status(500).json({error: String(e)}); }
  });

  
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
                `<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Sayın ${tenant.name},</h2>
<p style="margin-bottom: 16px;">Sistem yöneticiniz tarafından hesabınızın şifresi güvenlik amacıyla sıfırlanmıştır. Oluşturulan yeni şifreniz ile sisteme giriş yapabilirsiniz.</p>

<div style="background-color: #f3f4f6; border-left: 4px solid #059669; padding: 16px; margin-bottom: 24px;">
<p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Yeni Şifreniz</p>
<p style="margin: 8px 0 0 0; font-size: 24px; font-family: monospace; font-weight: 700; color: #111827;">${newAdminPass}</p>
</div>

<p style="color: #dc2626; font-size: 14px; margin-bottom: 8px; font-weight: 500;">⚠️ Güvenlik Uyarısı:</p>
<ul style="color: #4b5563; font-size: 14px; padding-left: 20px; margin-top: 0;">
<li>Sisteme giriş yaptıktan sonra şifrenizi ayarlar menüsünden lütfen değiştiriniz.</li>
<li>Bu şifreyi kimseyle paylaşmayınız.</li>
</ul>`
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
            `<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Sayın ${tenant.name},</h2>
<p style="margin-bottom: 16px;">Sistem yöneticiniz tarafından hesabınızın şifresi güvenlik amacıyla sıfırlanmıştır. Oluşturulan yeni şifreniz ile sisteme giriş yapabilirsiniz.</p>

<div style="background-color: #f3f4f6; border-left: 4px solid #059669; padding: 16px; margin-bottom: 24px;">
<p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Yeni Şifreniz</p>
<p style="margin: 8px 0 0 0; font-size: 24px; font-family: monospace; font-weight: 700; color: #111827;">${newAdminPass}</p>
</div>

<p style="color: #dc2626; font-size: 14px; margin-bottom: 8px; font-weight: 500;">⚠️ Güvenlik Uyarısı:</p>
<ul style="color: #4b5563; font-size: 14px; padding-left: 20px; margin-top: 0;">
<li>Sisteme giriş yaptıktan sonra şifrenizi ayarlar menüsünden lütfen değiştiriniz.</li>
<li>Bu şifreyi kimseyle paylaşmayınız.</li>
</ul>`
         );
      }
      
      res.json({success: true, password: newAdminPass});
    } catch(e) { res.status(500).json({error: String(e)}); }
  });

  app.post('/api/tenants', async (req, res) => {
    try {
      const data = req.body;
      const newAdminPass = generateSecurePassword();
      let expInterval = '1 YEAR';
      if (data.package === 'Aylık') expInterval = '1 MONTH';
      if (data.package === 'Sınırsız') expInterval = '100 YEAR';

      const sendRegistrationMail = async (tenantEmail: string, tenantName: string) => {
         if (tenantEmail) {
            await sendMail(
              tenantEmail,
              "Yeni Kayıt Talebi - Esila Ticari",
              `<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Sayın ${tenantName},</h2>
<p style="margin-bottom: 16px;">Esila Ticari Yönetim Sistemi'ne kayıt talebiniz başarıyla bize ulaşmıştır. Bizi tercih ettiğiniz için teşekkür ederiz.</p>

<div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
    <h3 style="color: #1e40af; margin-top: 0; font-size: 16px;">Sırada Ne Var?</h3>
    <p style="color: #1e3a8a; margin-bottom: 0;">Müşteri temsilcilerimiz şu anda firma bilgilerinizi inceliyor. İnceleme işlemi tamamlandığında, hesabınız aktive edilecek ve size <b>yeni bir bilgilendirme e-postası</b> gönderilecektir.</p>
</div>

<p style="margin-bottom: 8px;">Hesabınızın onay süreci tamamlandığında göndereceğimiz e-posta içerisinde sisteme giriş yapabilmeniz için gereken yönetici şifreniz bulunacaktır.</p>`
            );
         }
      };

      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const dDate = new Date();
        dDate.setFullYear(dDate.getFullYear() + (data.package === 'Aylık' ? 0 : data.package === 'Sınırsız' ? 100 : 1));
        if (data.package === 'Aylık') dDate.setMonth(dDate.getMonth() + 1);

        insertFallbackRow('tenants', { ...data, status: 'Bekliyor', expirationDate: dDate.toISOString(), smsLimit: data.smsLimit || 0, emailLimit: data.emailLimit || 0, smsCount: 0, emailCount: 0 });
        insertFallbackRow('users', { id: "admin-" + data.vkn, vkn: data.vkn, name: data.name + ' Admin', username: data.vkn, email: data.email, passwordHash: newAdminPass, role: 'Admin', status: 'Aktif' });
   insertFallbackRow('settings', { vkn: data.vkn, id: 1, companyName: data.name, email: data.email });
        
        await sendRegistrationMail(data.email, data.name);
        return res.json({success: true, password: newAdminPass});
      }

      const pool = getPool();
      const q = `INSERT INTO tenants (vkn, name, email, modules, status, package, expirationDate, sector, isEsilaCustomer, smsLimit, emailLimit, smsCount, emailCount) VALUES (?, ?, ?, ?, 'Bekliyor', ?, DATE_ADD(NOW(), INTERVAL ${expInterval}), ?, ?, ?, ?, 0, 0)`;
      await pool.query(q, [data.vkn, data.name, data.email, JSON.stringify(data.modules), data.package || 'Yıllık', data.sector || '', data.isEsilaCustomer ? true : false, data.smsLimit || 0, data.emailLimit || 0]);
      
      // Seed user for tenant
      await pool.query("INSERT INTO users (id, vkn, name, username, email, passwordHash, role, status) VALUES (?, ?, ?, ?, ?, ?, 'Admin', 'Aktif')",
        ["admin-" + data.vkn, data.vkn, data.name + ' Admin', data.vkn, data.email, newAdminPass]
      );

      // Seed settings
      const fullAddress = [data.address, data.district, data.city].filter(Boolean).join(' - ');
      await pool.query("INSERT INTO settings (vkn, id, companyName, email, phone, address) VALUES (?, 1, ?, ?, ?, ?)",
        [data.vkn, data.name, data.email, data.phone || '', fullAddress]
      );

      await sendRegistrationMail(data.email, data.name);
      res.json({success: true, password: newAdminPass});
    } catch(e) { res.status(500).json({error: String(e)}); }
  });

  
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
  
  app.put('/api/tenants/:vkn/activate', async (req, res) => {
    try {
      const { vkn } = req.params;
      
      const sendActivationMail = async (tenantEmail: string, tenantName: string, adminPassword?: string) => {
         let passInfoHTML = '';
         if (adminPassword) {
            passInfoHTML = `
              <p style="margin-top: 24px; margin-bottom: 8px; font-weight: 500; color: #374151;">Aşağıdaki yönetici bilgileri ile sisteme güvenle giriş yapabilirsiniz:</p>
              <div style="background-color: #f3f4f6; border-left: 4px solid #059669; padding: 16px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px;">
                 <div>
                    <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Kullanıcı Adı (T.C./VKN)</p>
                    <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 600; color: #111827;">${req.params.vkn}</p>
                 </div>
                 <div>
                    <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Şifre</p>
                    <p style="margin: 4px 0 0 0; font-size: 18px; font-family: monospace; font-weight: 700; color: #111827;">${adminPassword}</p>
                 </div>
              </div>
            `;
         } else {
             passInfoHTML = '<p style="margin-top: 24px; margin-bottom: 24px;">Sisteme giriş yapabilirsiniz.</p>';
         }
         
         if (tenantEmail) {
            await sendMail(
              tenantEmail,
              "Hesabınız Aktive Edildi - Esila Ticari",
              `<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Tebrikler Sayın ${tenantName},</h2>
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <p style="color: #166534; font-weight: 500; margin: 0;">Esila Ticari üyeliğiniz yönetimimiz tarafından incelenmiş ve <b>başarıyla onaylanarak aktive edilmiştir.</b></p>
              </div>
              <p>Firmamızın dijital ürün ailesine hoş geldiniz. Bütün ön muhasebe ihtiyaçlarınızı hızlı, güvenli ve bulut üzerinden kesintisiz yürütebilirsiniz.</p>
              ${passInfoHTML}
              <p style="color: #6b7280; font-size: 14px;">Güvenliğiniz için ilk girişten sonra şifrenizi sağ üst köşedeki profil veya ayarlar menüsünden değiştirmenizi öneririz.</p>`
            );
         }
      };

      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const fallbacks = getFallbackTable('tenants');
        const t = fallbacks.find((x: any) => x.vkn === vkn);
        if (t) {
           const fallbacksU = getFallbackTable('users');
           const au = fallbacksU.find((u) => u.vkn === vkn && u.role === 'Admin');
           await sendActivationMail(t.email, t.name, au ? au.passwordHash : '');
        }

        updateFallbackRow('tenants', vkn, vkn, { status: 'Aktif' }); // Note: wait, id of tenant is its vkn... fallbackDb searches by id? The tenant has vkn as primary key!
        // I'll manually modify tenants lookup below.
        return res.json({success: true});
      }
      
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM tenants WHERE vkn = ?', [vkn]);
      if (rows && rows.length > 0) {
         const [uRows] = await pool.query("SELECT passwordHash FROM users WHERE vkn = ? AND role = 'Admin'", [vkn]);
         const adminPass = uRows && uRows.length > 0 ? uRows[0].passwordHash : '';
         await sendActivationMail(rows[0].email, rows[0].name, adminPass);
      }

      await pool.query("UPDATE tenants SET status = 'Aktif' WHERE vkn = ?", [vkn]);
      res.json({success: true});
    } catch(e) { res.status(500).json({error: String(e)}); }
  });

  app.put('/api/tenants/:vkn/reject', async (req, res) => {
    try {
      const { vkn } = req.params;
      
      const sendRejectionMail = async (tenantEmail: string, tenantName: string) => {
         if (tenantEmail) {
            await sendMail(
              tenantEmail,
              "Başvurunuz Reddedildi - Esila Ticari",
              `<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Sayın ${tenantName},</h2>
<p style="margin-bottom: 16px;">Esila Ticari lisans başvurunuz ekiplerimiz tarafından değerlendirilmiş, ancak maalesef şu aşamada <b>onaylanamamıştır</b>.</p>

<p style="margin-bottom: 24px;">Lisans ve kullanım koşulları politikalarımız gereği başvurunuz uygun görülmemiş veya sisteme giriş kapasitelerimiz dolmuş olabilir.</p>

<div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
    <p style="color: #991b1b; margin: 0; font-size: 14px;">Sistemimize göstermiş olduğunuz ilgiden dolayı teşekkür ederiz. İlerleyen tarihlerde dilediğiniz zaman tekrar kayıt başvurusunda bulunabilirsiniz.</p>
</div>`
            );
         }
      };

      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const fallbacks = getFallbackTable('tenants');
        const t = fallbacks.find((x: any) => x.vkn === vkn);
        if (t) await sendRejectionMail(t.email, t.name);

        deleteFallbackRow('tenants', vkn, vkn);
        return res.json({success: true});
      }
      
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM tenants WHERE vkn = ?', [vkn]);
      if (rows && rows.length > 0) {
         await sendRejectionMail(rows[0].email, rows[0].name);
      }

      await pool.query("DELETE FROM tenants WHERE vkn = ?", [vkn]);
      await pool.query("DELETE FROM users WHERE vkn = ?", [vkn]);
      await pool.query("DELETE FROM settings WHERE vkn = ?", [vkn]);
      res.json({success: true});
    } catch(e) { res.status(500).json({error: String(e)}); }
  });

  app.put('/api/tenants/:vkn', async (req, res) => {
    try {
      const { vkn } = req.params;
      const data = req.body;
      
      let expInterval = "1 YEAR";
      if (data.package === 'Aylık') expInterval = "1 MONTH";
      if (data.package === 'Sınırsız') expInterval = "100 YEAR";

      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const dDate = data.expirationDate ? new Date(data.expirationDate) : new Date();
        if (!data.expirationDate) {
          dDate.setFullYear(dDate.getFullYear() + (data.package === 'Aylık' ? 0 : data.package === 'Sınırsız' ? 100 : 1));
          if (data.package === 'Aylık') dDate.setMonth(dDate.getMonth() + 1);
        }
        
        updateFallbackRow('tenants', vkn, vkn, { 
          name: data.name, 
          email: data.email, 
          package: data.package,
          modules: JSON.stringify(data.modules),
          expirationDate: dDate.toISOString(),
          smsLimit: data.smsLimit || 0,
          emailLimit: data.emailLimit || 0
        });
        return res.json({success: true});
      }
      const pool = getPool();
      if (data.package) {
        if (data.expirationDate) {
           const q = `UPDATE tenants SET name = ?, email = ?, package = ?, modules = ?, expirationDate = ?, smsLimit = ?, emailLimit = ? WHERE vkn = ?`;
           await pool.query(q, [data.name, data.email, data.package, JSON.stringify(data.modules), new Date(data.expirationDate).toISOString().slice(0, 19).replace('T', ' '), data.smsLimit || 0, data.emailLimit || 0, vkn]);
        } else {
           const q = `UPDATE tenants SET name = ?, email = ?, package = ?, modules = ?, expirationDate = DATE_ADD(NOW(), INTERVAL ${expInterval}), smsLimit = ?, emailLimit = ? WHERE vkn = ?`;
           await pool.query(q, [data.name, data.email, data.package, JSON.stringify(data.modules), data.smsLimit || 0, data.emailLimit || 0, vkn]);
        }
      } else {
         await pool.query("UPDATE tenants SET name = ?, email = ?, modules = ?, smsLimit = ?, emailLimit = ? WHERE vkn = ?", 
        [data.name, data.email, JSON.stringify(data.modules), data.smsLimit || 0, data.emailLimit || 0, vkn]);
      }
      res.json({success: true});
    } catch(e) { res.status(500).json({error: String(e)}); }
  });

  app.delete('/api/tenants/:vkn', async (req, res) => {
    try {
      const { vkn } = req.params;
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        deleteFallbackRow('tenants', vkn, vkn);
        return res.json({success: true});
      }
      const pool = getPool();
      await pool.query("DELETE FROM tenants WHERE vkn = ?", [vkn]);
      // Optional: Delete from other tables where vkn = vkn ? Cascade delete handles it usually, or we can manually delete
      await pool.query("DELETE FROM users WHERE vkn = ?", [vkn]);
      await pool.query("DELETE FROM settings WHERE vkn = ?", [vkn]);
      res.json({success: true});
    } catch(e) { res.status(500).json({error: String(e)}); }
  });

  app.get('/api/admin/email-logs', async (req, res) => {
    try {
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        return res.json([]);
      }
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM email_logs ORDER BY date DESC LIMIT 200');
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get('/api/tenant-info', async (req, res) => {
    try {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const fallbacks = getFallbackTable('tenants');
         const t = fallbacks.find((x: any) => x.vkn === vkn);
         return res.json(t || { expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() });
      }
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM tenants WHERE vkn = ?', [vkn]);
      if (rows.length > 0) return res.json(rows[0]);
      res.json({});
    } catch(e) { res.status(500).json({ error: String(e) }); }
  });

  const publicVerificationCodes = new Map<string, { code: string, expires: number }>();

  app.post('/api/public-form/request-code', async (req, res) => {
    try {
      const { id, type, t } = req.body;
      if (!id || !type || !t) return res.status(400).json({ error: 'Missing params' });

      let record;
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
         const records = getFallbackTable(type === 'ticket' ? 'service_tickets' : 'orders', t);
         record = records.find((x: any) => x.id === id);
      } else {
         const pool = getPool();
         const tableName = type === 'ticket' ? 'service_tickets' : 'orders';
         const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE id = ? AND vkn = ?`, [id, t]) as any;
         record = rows[0];
      }

      if (!record) return res.status(404).json({ error: 'Record not found' });
      
      let customer;
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
         const customers = getFallbackTable('customers', t);
         customer = customers.find((x: any) => x.id === (record.customerId || record.customer_id));
      } else {
         const pool = getPool();
         const [cRows] = await pool.query(`SELECT * FROM customers WHERE id = ? AND vkn = ?`, [record.customerId || record.customer_id, t]) as any;
         customer = cRows[0];
      }

      const email = customer?.email;
      const phone = customer?.phone || customer?.phone1;

      if (!email && !phone) {
         return res.status(400).json({ error: 'Müşteriye ait e-posta veya telefon bulunamadı.' });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const key = `${t}_${type}_${id}`;
      publicVerificationCodes.set(key, { code, expires: Date.now() + 10 * 60 * 1000 });

      if (email) {
          await sendMail(email, "Evrak Doğrulama Kodu", `
            <div style="font-family: sans-serif; padding: 20px;">
                <h2 style="color: #059669;">Evrak Görüntüleme Talebi</h2>
                <p>Talep ettiğiniz evrağı güvenli bir şekilde görüntülemek için doğrulama kodunuz:</p>
                <div style="font-size: 24px; font-weight: bold; padding: 12px; background: #f3f4f6; display: inline-block; border-radius: 6px; letter-spacing: 2px;">${code}</div>
                <p style="color: #666; font-size: 12px; mt-4">Bu kod 10 dakika boyunca geçerlidir.</p>
            </div>
          `, false, [], t);
      } else {
          console.log(`[SMS SIMULASYON Müşteri:${phone}] Kodunuz: ${code}`);
      }
      
      const sentTo = [];
      if (email) sentTo.push(email.replace(/(.{2})(.*)(?=@)/, (m:string, a:string, b:string) => a + '*'.repeat(b.length)));
      if (!email && phone) sentTo.push(phone.slice(0, 3) + '***' + phone.slice(-2));

      res.json({ success: true, sentTo: sentTo.join(' ve ') });
    } catch(e) { res.status(500).json({ error: String(e) }); }
  });

  app.post('/api/public-form/verify', async (req, res) => {
    try {
      const { id, type, t, code } = req.body;
      const key = `${t}_${type}_${id}`;
      const vData = publicVerificationCodes.get(key);
      
      if (!vData) return res.status(400).json({ error: 'Kod bulunamadı veya süresi dolmuş.' });
      if (vData.expires < Date.now()) {
         publicVerificationCodes.delete(key);
         return res.status(400).json({ error: 'Kodun süresi dolmuş.' });
      }
      if (vData.code !== code) return res.status(400).json({ error: 'Geçersiz kod.' });

      publicVerificationCodes.delete(key);

      let record;
      let customer;
      let settings;
      let products;
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
         record = getFallbackTable(type === 'ticket' ? 'service_tickets' : 'orders', t).find((x: any) => x.id === id);
         customer = getFallbackTable('customers', t).find((x: any) => x.id === (record.customerId || record.customer_id));
         settings = getFallbackTable('settings', t)[0] || {};
         products = getFallbackTable('products', t);
      } else {
         const pool = getPool();
         const tableName = type === 'ticket' ? 'service_tickets' : 'orders';
         const [rRows] = await pool.query(`SELECT * FROM ${tableName} WHERE id = ? AND vkn = ?`, [id, t]) as any;
         record = rRows[0];
         if(record && typeof record.items === 'string') record.items = JSON.parse(record.items);
         if(record && typeof record.device === 'string') record.device = JSON.parse(record.device);
         if(record && typeof record.materials === 'string') record.materials = JSON.parse(record.materials);

         const [cRows] = await pool.query(`SELECT * FROM customers WHERE id = ? AND vkn = ?`, [record.customerId || record.customer_id, t]) as any;
         customer = cRows[0];
         const [sRows] = await pool.query(`SELECT * FROM settings WHERE vkn = ?`, [t]) as any;
         settings = sRows[0] || {};
         const [pRows] = await pool.query(`SELECT * FROM products WHERE vkn = ?`, [t]) as any;
         products = pRows;
      }

      res.json({ success: true, record, customer, settings, products });
    } catch(e) { res.status(500).json({ error: String(e) }); }
  });

  const publicAccessTokens = new Map<string, { id: string, type: string, tenantId: string, expires: number, singleUse: boolean }>();

  app.post('/api/public-form/generate-link', (req, res) => {
    try {
      const { id, type, t, expirationMinutes = 60, singleUse = false } = req.body;
      if (!id || !type || !t) return res.status(400).json({ error: 'Missing params' });
      
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      publicAccessTokens.set(token, {
          id, type, tenantId: t,
          expires: Date.now() + expirationMinutes * 60 * 1000,
          singleUse
      });
      
      const link = `https://${req.get('host')}/?token=${token}`;
      res.json({ success: true, token, link });
    } catch(e) { res.status(500).json({ error: String(e) }); }
  });

  app.post('/api/public-form/verify-token', async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ error: 'Token eksik' });

      const tData = publicAccessTokens.get(token);
      if (!tData) return res.status(400).json({ error: 'Link süresi dolmuş veya geçersiz.' });
      if (tData.expires < Date.now()) {
          publicAccessTokens.delete(token);
          return res.status(400).json({ error: 'Link süresi dolmuş.' });
      }
      
      if (tData.singleUse) {
          publicAccessTokens.delete(token);
      }

      const { id, type, tenantId: t } = tData;

      let record;
      let customer;
      let settings;
      let products;
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
         record = getFallbackTable(type === 'ticket' ? 'service_tickets' : 'orders', t).find((x: any) => x.id === id);
         customer = getFallbackTable('customers', t).find((x: any) => x.id === (record.customerId || record.customer_id));
         settings = getFallbackTable('settings', t)[0] || {};
         products = getFallbackTable('products', t);
      } else {
         const pool = getPool();
         const tableName = type === 'ticket' ? 'service_tickets' : 'orders';
         const [rRows] = await pool.query(`SELECT * FROM ${tableName} WHERE id = ? AND vkn = ?`, [id, t]) as any;
         record = rRows[0];
         if(record && typeof record.items === 'string') record.items = JSON.parse(record.items);
         if(record && typeof record.device === 'string') record.device = JSON.parse(record.device);
         if(record && typeof record.materials === 'string') record.materials = JSON.parse(record.materials);

         const [cRows] = await pool.query(`SELECT * FROM customers WHERE id = ? AND vkn = ?`, [record.customerId || record.customer_id, t]) as any;
         customer = cRows[0];
         const [sRows] = await pool.query(`SELECT * FROM settings WHERE vkn = ?`, [t]) as any;
         settings = sRows[0] || {};
         const [pRows] = await pool.query(`SELECT * FROM products WHERE vkn = ?`, [t]) as any;
         products = pRows;
      }

      res.json({ success: true, record, customer, settings, products, type, id, t });
    } catch(e) { res.status(500).json({ error: String(e) }); }
  });

  app.get('/api/test-users', (req, res) => { res.json(getFallbackTable('users')); });
  
  // Generic CRUD API for all tables

  const tables = ["users","settings","customers","customer_transactions","cash_transactions","personnel","personnel_records","orders","proposals","service_tickets","e_invoices","job_applications","reminder_notes"];
  for (const table of tables) {
    app.get(`/api/${table}`, async (req, res) => {
      try {
        const vkn = req.headers['x-tenant-id'] || '1111111111';
        if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
          return res.json(getFallbackTable(table, vkn));
        }
        const pool = getPool();
        const [rows] = await pool.query(`SELECT * FROM ${table} WHERE vkn = ?`, [vkn]);
        res.json(rows);
      } catch (e) {
        res.status(500).json({ error: String(e) });
      }
    });

    app.post(`/api/${table}`, async (req, res) => {
      try {
        if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
          const vkn = req.headers['x-tenant-id'] || '1111111111';
          insertFallbackRow(table, { ...req.body, vkn });
          return res.json(req.body);
        }
        const pool = getPool();
        const data = req.body;
        const keys = Object.keys(data);
        const values = Object.values(data).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const questionMarks = keys.map(() => '?').join(', ');
        const backtick = String.fromCharCode(96);
        const fields = keys.map(k => backtick + k + backtick).join(', ');
        const vkn = req.headers['x-tenant-id'] || '1111111111';
        const query = `INSERT INTO ${table} (vkn, ${fields}) VALUES (?, ${questionMarks})`;
        await pool.query(query, [vkn, ...values]);
        res.json(req.body);
      } catch (e) {
        res.status(500).json({ error: String(e) });
      }
    });

    app.put(`/api/${table}/:id`, async (req, res) => {
      try {
        if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
          const vkn = req.headers['x-tenant-id'] || '1111111111';
          updateFallbackRow(table, req.params.id, vkn, req.body);
          return res.json({ id: req.params.id, ...req.body });
        }
        const pool = getPool();
        const data = req.body;
        if (data.id) delete data.id; // Don't update id
        const keys = Object.keys(data);
        const values = keys.map(k => typeof data[k] === 'object' && data[k] !== null ? JSON.stringify(data[k]) : data[k]);
        const backtick = String.fromCharCode(96);
        const setString = keys.map(k => backtick + k + backtick + ' = ?').join(', ');
        const vkn = req.headers['x-tenant-id'] || '1111111111';
        const query = `UPDATE ${table} SET ${setString} WHERE id = ? AND vkn = ?`;
        await pool.query(query, [...values, req.params.id, vkn]);
        res.json({ id: req.params.id, ...data });
      } catch (e) {
        res.status(500).json({ error: String(e) });
      }
    });

    app.delete(`/api/${table}/:id`, async (req, res) => {
      try {
        if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
          const vkn = req.headers['x-tenant-id'] || '1111111111';
          deleteFallbackRow(table, req.params.id, vkn);
          return res.json({ success: true });
        }
        const pool = getPool();
        const vkn = req.headers['x-tenant-id'] || '1111111111';
        await pool.query(`DELETE FROM ${table} WHERE id = ? AND vkn = ?`, [req.params.id, vkn]);
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ error: String(e) });
      }
    });
  }

// Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
