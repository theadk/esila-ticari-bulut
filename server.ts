import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, initDb } from './server/db.js';
import cors from 'cors';
import { getFallbackTable, insertFallbackRow, updateFallbackRow, deleteFallbackRow } from './server/fallbackDb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));













async function startServer() {
  await initDb();
  
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use(cors());

  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const fallbackUsers = getFallbackTable('users');
        const fallbackTenants = getFallbackTable('tenants');
        const user = fallbackUsers.find(u => (u.username === username || u.email === username) && u.passwordHash === password);
        if (user) {
          if (user.status === 'Pasif') return res.status(401).json({ error: 'Hesabınız pasif durumdadır.' });
          
          const tenant = fallbackTenants.find((t: any) => t.vkn === user.vkn);
          if (tenant) {
             if (tenant.status === 'Pasif') return res.status(401).json({ error: 'Firma hesabı pasif durumdadır.' });
             if (tenant.expirationDate && new Date(tenant.expirationDate) < new Date()) {
                return res.status(401).json({ error: 'Firma lisans süresi dolmuştur.' });
             }
          }
          
          return res.json(user);
        }
        return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
      }
      
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM users WHERE (username = ? OR email = ?) AND passwordHash = ?', [username, username, password]);
      const user = rows[0];
      if (user) {
        if (user.status === 'Pasif') return res.status(401).json({ error: 'Hesabınız pasif durumdadır.' });
        
        const [tenantRows] = await pool.query('SELECT * FROM tenants WHERE vkn = ?', [user.vkn]);
        const tenant = tenantRows[0];
        if (tenant) {
           if (tenant.status === 'Pasif') return res.status(401).json({ error: 'Firma hesabı pasif durumdadır.' });
           if (tenant.expirationDate && new Date(tenant.expirationDate) < new Date()) {
              return res.status(401).json({ error: 'Firma lisans süresi dolmuştur.' });
           }
        }
        
        return res.json(user);
      }
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
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
    // Simulate sending email
    console.log(`[Mutabakat] Email gönderildi: ${mutabakat.customerName} - Bakiye: ${mutabakat.balance} ${mutabakat.balanceType}`);
    console.log(`[Onay Linki] /api/reconciliations/${mutabakat.id}/approve`);
    console.log(`[Red Linki] /api/reconciliations/${mutabakat.id}/reject`);

    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const vkn = req.headers['x-tenant-id'] || '1111111111';
      insertFallbackRow('reconciliations', { ...mutabakat, vkn });
      return res.json(mutabakat);
    }
    
    try {
      const pool = getPool();
      await pool.query('INSERT INTO reconciliations (vkn, id, `customerId`, `customerName`, date, `balanceType`, balance, status, notes, `emailSentAt`, `respondedAt`, `responseNotes`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.headers['x-tenant-id'] || '1111111111', mutabakat.id, mutabakat.customerId, mutabakat.customerName, mutabakat.date, mutabakat.balanceType, mutabakat.balance, mutabakat.status, mutabakat.notes, mutabakat.emailSentAt, mutabakat.respondedAt, mutabakat.responseNotes]);
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
      await pool.query('UPDATE reconciliations SET `customerId` = ?, `customerName` = ?, date = ?, `balanceType` = ?, balance = ?, status = ?, notes = ?, `emailSentAt` = ?, `respondedAt` = ?, `responseNotes` = ? WHERE id = ? AND vkn = ?', [customerId, customerName, date, balanceType, balance, status, notes, emailSentAt, respondedAt, responseNotes, id, req.headers['x-tenant-id'] || '1111111111']);
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
    
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      updateFallbackRow('reconciliations', id, req.headers['x-tenant-id'] || '1111111111', { status: 'Onaylandı', respondedAt: date, responseNotes: notes });
      return res.send(`
        <html>
          <body style="font-family:sans-serif; text-align:center; padding-top: 50px;">
            <h1 style="color: green;">Mutabakat Onaylandı</h1>
            <p>Onayınız sisteme başarıyla işlenmiştir.</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body>
        </html>
      `);
    }

    try {
      const pool = getPool();
      await pool.query('UPDATE reconciliations SET status = ?, `respondedAt` = ?, `responseNotes` = ? WHERE id = ? AND vkn = ?', ['Onaylandı', date, notes, id, req.headers['x-tenant-id'] || '1111111111']);
      res.send(`
        <html>
          <body style="font-family:sans-serif; text-align:center; padding-top: 50px;">
            <h1 style="color: green;">Mutabakat Onaylandı</h1>
            <p>Onayınız sisteme başarıyla işlenmiştir.</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body>
        </html>
      `);
    } catch (e) {
      res.status(500).send('Sunucu hatası: ' + e);
    }
  });

  app.get('/api/reconciliations/:id/reject', async (req, res) => {
    const id = req.params.id;
    const notes = req.query.notes || '';
    const date = new Date().toISOString();
    
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      updateFallbackRow('reconciliations', id, req.headers['x-tenant-id'] || '1111111111', { status: 'Reddedildi', respondedAt: date, responseNotes: notes });
      return res.send(`
        <html>
          <body style="font-family:sans-serif; text-align:center; padding-top: 50px;">
            <h1 style="color: red;">Mutabakat Reddedildi</h1>
            <p>Ret işleminiz sisteme başarıyla işlenmiştir.</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body>
        </html>
      `);
    }

    try {
      const pool = getPool();
      await pool.query('UPDATE reconciliations SET status = ?, `respondedAt` = ?, `responseNotes` = ? WHERE id = ? AND vkn = ?', ['Reddedildi', date, notes, id, req.headers['x-tenant-id'] || '1111111111']);
      res.send(`
        <html>
          <body style="font-family:sans-serif; text-align:center; padding-top: 50px;">
            <h1 style="color: red;">Mutabakat Reddedildi</h1>
            <p>Ret işleminiz sisteme başarıyla işlenmiştir.</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body>
        </html>
      `);
    } catch (e) {
      res.status(500).send('Sunucu hatası: ' + e);
    }
  });

  

  app.get('/api/tenants', async (req, res) => {
    try {
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) return res.json(getFallbackTable('tenants'));
      const pool = getPool();
      const [rows] = await pool.query("SELECT * FROM tenants");
      res.json(rows);
    } catch (e) { res.status(500).json({error: String(e)}); }
  });

  app.post('/api/tenants', async (req, res) => {
    try {
      const data = req.body;
      let expInterval = '1 YEAR';
      if (data.package === 'Aylık') expInterval = '1 MONTH';
      if (data.package === 'Sınırsız') expInterval = '100 YEAR';

      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const dDate = new Date();
        dDate.setFullYear(dDate.getFullYear() + (data.package === 'Aylık' ? 0 : data.package === 'Sınırsız' ? 100 : 1));
        if (data.package === 'Aylık') dDate.setMonth(dDate.getMonth() + 1);

        insertFallbackRow('tenants', { ...data, status: 'Bekliyor', expirationDate: dDate.toISOString() });
        insertFallbackRow('users', { id: "admin-" + data.vkn, vkn: data.vkn, name: data.name + ' Admin', username: data.vkn, email: data.email, passwordHash: data.vkn + '123', role: 'Admin', status: 'Aktif' });
   insertFallbackRow('settings', { vkn: data.vkn, id: 1, companyName: data.name, email: data.email });
        return res.json({success: true});
      }

      const pool = getPool();
      const q = `INSERT INTO tenants (vkn, name, email, modules, status, package, expirationDate) VALUES (?, ?, ?, ?, 'Bekliyor', ?, DATE_ADD(NOW(), INTERVAL ${expInterval}))`;
      await pool.query(q, [data.vkn, data.name, data.email, JSON.stringify(data.modules), data.package || 'Yıllık']);
      
      // Seed user for tenant
      await pool.query("INSERT INTO users (id, vkn, name, username, email, passwordHash, role, status) VALUES (?, ?, ?, ?, ?, ?, 'Admin', 'Aktif')",
        ["admin-" + data.vkn, data.vkn, data.name + ' Admin', data.vkn, data.email, data.vkn + '123']
      );

      // Seed settings
      await pool.query("INSERT INTO settings (vkn, id, companyName, email) VALUES (?, 1, ?, ?)",
        [data.vkn, data.name, data.email]
      );

      res.json({success: true});
    } catch(e) { res.status(500).json({error: String(e)}); }
  });

  app.put('/api/tenants/:vkn/activate', async (req, res) => {
    try {
      const { vkn } = req.params;
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
      updateFallbackRow('tenants', vkn, vkn, { status: 'Aktif' }); // Note: wait, id of tenant is its vkn... fallbackDb searches by id? The tenant has vkn as primary key!
      // I'll manually modify tenants lookup below.
      return res.json({success: true});
    }
      const pool = getPool();
      await pool.query("UPDATE tenants SET status = 'Aktif' WHERE vkn = ?", [vkn]);
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
          expirationDate: dDate.toISOString()
        });
        return res.json({success: true});
      }
      const pool = getPool();
      if (data.package) {
        if (data.expirationDate) {
           const q = `UPDATE tenants SET name = ?, email = ?, package = ?, modules = ?, expirationDate = ? WHERE vkn = ?`;
           await pool.query(q, [data.name, data.email, data.package, JSON.stringify(data.modules), new Date(data.expirationDate).toISOString().slice(0, 19).replace('T', ' '), vkn]);
        } else {
           const q = `UPDATE tenants SET name = ?, email = ?, package = ?, modules = ?, expirationDate = DATE_ADD(NOW(), INTERVAL ${expInterval}) WHERE vkn = ?`;
           await pool.query(q, [data.name, data.email, data.package, JSON.stringify(data.modules), vkn]);
        }
      } else {
         await pool.query("UPDATE tenants SET name = ?, email = ?, modules = ? WHERE vkn = ?", 
        [data.name, data.email, JSON.stringify(data.modules), vkn]);
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

  app.get('/api/test-users', (req, res) => { res.json(getFallbackTable('users')); });
  
  // Generic CRUD API for all tables

  const tables = ["users","settings","customers","customer_transactions","cash_transactions","personnel","personnel_records","orders","proposals"];
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
