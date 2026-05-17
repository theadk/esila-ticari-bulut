import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, initDb } from './server/db.js';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let fallbackCategories = [
  { id: '1', name: 'Elektronik', subCategories: ['Telefon', 'Bilgisayar', 'Aksesuar'] },
  { id: '2', name: 'Giyim', subCategories: ['Erkek', 'Kadın', 'Çocuk'] }
];

let fallbackWarehouses = [
  { id: '1', name: 'Ana Depo', address: 'Merkez', capacity: 1000 },
  { id: '2', name: 'Şube Depo', address: 'Kadıköy', capacity: 500 },
  { id: '3', name: 'Soğuk Hava Deposu', address: 'Bodrum', capacity: 200 },
  { id: '4', name: 'İade Deposu', address: 'Merkez', capacity: 300 }
];

let fallbackBrands = [
  { id: '1', name: 'Sony' },
  { id: '2', name: 'Apple' },
  { id: '3', name: 'Samsung' }
];

let fallbackProducts = [
  { id: '1', code: 'PRD-001', name: 'Kablosuz Kulaklık', price: 1250.00, stock: 45, category: 'Elektronik', warehouse: 'Ana Depo', barcode: '8691234567890', description: 'Gürültü önleyici kulaklık', brand: 'Sony', taxRate: 20 },
  { id: '2', code: 'PRD-002', name: 'Akıllı Saat', price: 3400.00, stock: 12, category: 'Elektronik', warehouse: 'Şube Depo', barcode: '8691234567891', description: 'Nabız ölçerli akıllı saat', brand: 'Apple', taxRate: 20 },
  { id: '3', code: 'PRD-003', name: 'Laptop Çantası', price: 450.00, stock: 120, category: 'Aksesuar', warehouse: 'Ana Depo', barcode: '8691234567892', description: 'Su geçirmez çanta', brand: 'Targus', taxRate: 20 },
  { id: '4', code: 'PRD-004', name: 'USB-C Kablo', price: 150.00, stock: 0, category: 'Aksesuar', warehouse: 'Ana Depo', barcode: '8691234567893', description: 'Hızlı şarj destekli', brand: 'Anker', taxRate: 20 }
];

async function startServer() {
  await initDb();
  
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  app.get('/api/products', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) return res.json(fallbackProducts);
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM products');
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
      fallbackProducts = fallbackProducts.filter(p => String(p.id) !== String(req.params.id));
      return res.json({ success: true });
    }
    const { id } = req.params;
    try {
      const pool = getPool();
      await pool.query('DELETE FROM products WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get('/api/categories', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) return res.json(fallbackCategories);
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM categories');
      res.json(rows.map(r => ({
        id: r.id,
        name: r.name,
        subCategories: typeof r.sub_categories === 'string' ? JSON.parse(r.sub_categories) : (r.sub_categories || [])
      })));
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/categories', async (req, res) => {
    const newCat = { ...req.body, id: req.body.id || String(Date.now()) };
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      fallbackCategories.push(newCat);
      return res.json(newCat);
    }
    const { id, name, subCategories } = newCat;
    try {
      const pool = getPool();
      await pool.query('INSERT INTO categories (id, name, sub_categories) VALUES (?, ?, ?)', [id, name, JSON.stringify(subCategories)]);
      res.json(newCat);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put('/api/categories/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const idx = fallbackCategories.findIndex(c => String(c.id) === String(req.params.id));
      if (idx !== -1) fallbackCategories[idx] = { ...fallbackCategories[idx], ...req.body, id: req.params.id };
      return res.json({ id: req.params.id, ...req.body });
    }
    const { id } = req.params;
    const { name, subCategories } = req.body;
    try {
      const pool = getPool();
      await pool.query('UPDATE categories SET name = ?, sub_categories = ? WHERE id = ?', [name, JSON.stringify(subCategories), id]);
      res.json({ id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      fallbackCategories = fallbackCategories.filter(c => String(c.id) !== String(req.params.id));
      return res.json({ success: true });
    }
    const { id } = req.params;
    try {
      const pool = getPool();
      await pool.query('DELETE FROM categories WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/brands', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) return res.json(fallbackBrands);
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM brands');
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/brands', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      fallbackBrands.push(req.body);
      return res.json(req.body);
    }
    const { id, name } = req.body;
    try {
      const pool = getPool();
      await pool.query('INSERT INTO brands (id, name) VALUES (?, ?)', [id, name]);
      res.json(req.body);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.put('/api/brands/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const idx = fallbackBrands.findIndex(b => String(b.id) === String(req.params.id));
      if (idx !== -1) fallbackBrands[idx] = { ...fallbackBrands[idx], ...req.body, id: req.params.id };
      return res.json({ id: req.params.id, ...req.body });
    }
    const { id } = req.params;
    const { name } = req.body;
    try {
      const pool = getPool();
      await pool.query('UPDATE brands SET name = ? WHERE id = ?', [name, id]);
      res.json({ id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete('/api/brands/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      fallbackBrands = fallbackBrands.filter(b => String(b.id) !== String(req.params.id));
      return res.json({ success: true });
    }
    try {
      const pool = getPool();
      await pool.query('DELETE FROM brands WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/warehouses', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) return res.json(fallbackWarehouses);
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM warehouses');
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/warehouses', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      fallbackWarehouses.push(req.body);
      return res.json(req.body);
    }
    const { id, name, address, capacity } = req.body;
    try {
      const pool = getPool();
      await pool.query(
        'INSERT INTO warehouses (id, name, address, capacity) VALUES (?, ?, ?, ?)', 
        [id, name, address, capacity]
      );
      res.json(req.body);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.put('/api/warehouses/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const idx = fallbackWarehouses.findIndex(w => String(w.id) === String(req.params.id));
      if (idx !== -1) fallbackWarehouses[idx] = { ...fallbackWarehouses[idx], ...req.body, id: req.params.id };
      return res.json({ id: req.params.id, ...req.body });
    }
    const { name, address, capacity } = req.body;
    try {
      const pool = getPool();
      await pool.query(
        'UPDATE warehouses SET name = ?, address = ?, capacity = ? WHERE id = ?',
        [name, address, capacity, req.params.id]
      );
      res.json({ id: req.params.id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete('/api/warehouses/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const initLen = fallbackWarehouses.length;
      const filtered = fallbackWarehouses.filter(w => String(w.id) !== String(req.params.id));
      fallbackWarehouses.length = 0;
      fallbackWarehouses.push(...filtered);
      return res.json({ success: true });
    }
    try {
      const pool = getPool();
      await pool.query('DELETE FROM warehouses WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const idx = fallbackProducts.findIndex(p => String(p.id) === String(req.params.id));
      if (idx !== -1) fallbackProducts[idx] = { ...fallbackProducts[idx], ...req.body, id: req.params.id };
      return res.json({ id: req.params.id, ...req.body });
    }
    const { id } = req.params;
    const { code, name, price, purchasePrice, stock, category, warehouse, barcode, description, brand, taxRate, warehouseStocks } = req.body;
    try {
      const pool = getPool();
      await pool.query(
        'UPDATE products SET code = ?, name = ?, price = ?, stock = ?, category = ?, warehouse = ?, barcode = ?, description = ?, brand = ?, `taxRate` = ?, `warehouseStocks` = ?, `purchasePrice` = ? WHERE id = ?',
        [code, name, price, stock, category, warehouse, barcode, description, brand, taxRate, JSON.stringify(warehouseStocks || []), purchasePrice, id]
      );
      res.json({ id, ...req.body });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/products', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      fallbackProducts.push({ ...req.body, id: req.body.id || String(Date.now()) });
      return res.json(req.body);
    }
    const { id, code, name, price, purchasePrice, stock, category, warehouse, barcode, description, brand, taxRate, warehouseStocks } = req.body;
    try {
      const pool = getPool();
      await pool.query(
        'INSERT INTO products (id, code, name, price, stock, category, warehouse, barcode, description, brand, `taxRate`, `warehouseStocks`, `purchasePrice`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, code, name, price, stock, category, warehouse, barcode, description, brand, taxRate, JSON.stringify(warehouseStocks || []), purchasePrice]
      );
      res.json(req.body);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  let fallbackReconciliations: any[] = [];
  
  app.get('/api/reconciliations', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) return res.json(fallbackReconciliations);
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM reconciliations');
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
      fallbackReconciliations.push(mutabakat);
      return res.json(mutabakat);
    }
    
    try {
      const pool = getPool();
      await pool.query(
        'INSERT INTO reconciliations (id, `customerId`, `customerName`, date, `balanceType`, balance, status, notes, `emailSentAt`, `respondedAt`, `responseNotes`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [mutabakat.id, mutabakat.customerId, mutabakat.customerName, mutabakat.date, mutabakat.balanceType, mutabakat.balance, mutabakat.status, mutabakat.notes, mutabakat.emailSentAt, mutabakat.respondedAt, mutabakat.responseNotes]
      );
      res.json(mutabakat);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.put('/api/reconciliations/:id', async (req, res) => {
    const { id } = req.params;
    const { customerId, customerName, date, balanceType, balance, status, notes, emailSentAt, respondedAt, responseNotes } = req.body;
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      const idx = fallbackReconciliations.findIndex(r => String(r.id) === String(id));
      if (idx !== -1) fallbackReconciliations[idx] = { ...fallbackReconciliations[idx], ...req.body, id };
      return res.json({ id, ...req.body });
    }
    try {
      const pool = getPool();
      await pool.query(
        'UPDATE reconciliations SET `customerId` = ?, `customerName` = ?, date = ?, `balanceType` = ?, balance = ?, status = ?, notes = ?, `emailSentAt` = ?, `respondedAt` = ?, `responseNotes` = ? WHERE id = ?',
        [customerId, customerName, date, balanceType, balance, status, notes, emailSentAt, respondedAt, responseNotes, id]
      );
      res.json({ id, ...req.body });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.delete('/api/reconciliations/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) {
      fallbackReconciliations = fallbackReconciliations.filter(r => String(r.id) !== String(req.params.id));
      return res.json({ success: true });
    }
    try {
      const pool = getPool();
      await pool.query('DELETE FROM reconciliations WHERE id = ?', [req.params.id]);
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
      const rec = fallbackReconciliations.find(r => String(r.id) === String(id));
      if (rec) {
        rec.status = 'Onaylandı';
        rec.respondedAt = date;
        rec.responseNotes = notes;
      }
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
      await pool.query('UPDATE reconciliations SET status = ?, `respondedAt` = ?, `responseNotes` = ? WHERE id = ?', ['Onaylandı', date, notes, id]);
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
      const rec = fallbackReconciliations.find(r => String(r.id) === String(id));
      if (rec) {
        rec.status = 'Reddedildi';
        rec.respondedAt = date;
        rec.responseNotes = notes;
      }
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
      await pool.query('UPDATE reconciliations SET status = ?, `respondedAt` = ?, `responseNotes` = ? WHERE id = ?', ['Reddedildi', date, notes, id]);
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
      
      let expInterval = '1 YEAR';
      if (data.package === 'Aylık') expInterval = '1 MONTH';
      if (data.package === 'Sınırsız') expInterval = '100 YEAR';

      const q = `INSERT INTO tenants (vkn, name, email, modules, status, package, expirationDate) VALUES (?, ?, ?, ?, 'Bekliyor', ?, DATE_ADD(NOW(), INTERVAL ${expInterval}))`;
      await pool.query(q, [data.vkn, data.name, data.email, JSON.stringify(data.modules), data.package || 'Yıllık']);
      
      // Seed user for tenant
      await pool.query("INSERT INTO users (id, vkn, name, username, email, passwordHash, role, status) VALUES (?, ?, ?, ?, ?, ?, 'Admin', 'Aktif')",
        ["admin-" + data.vkn, data.vkn, data.name + ' Admin', data.vkn, data.email, data.vkn + '123']
      );

      res.json({success: true});
    } catch(e) { res.status(500).json({error: String(e)}); }
  });

  // Generic CRUD API for all tables

  const tables = ["users","settings","customers","customer_transactions","cash_transactions","personnel","personnel_records","orders","proposals"];
  for (const table of tables) {
    app.get(`/api/${table}`, async (req, res) => {
      try {
        if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) return res.json([]);
        const pool = getPool();
        const [rows] = await pool.query(`SELECT * FROM ${table}`);
        res.json(rows);
      } catch (e) {
        res.status(500).json({ error: String(e) });
      }
    });

    app.post(`/api/${table}`, async (req, res) => {
      try {
        if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) return res.json(req.body);
        const pool = getPool();
        const data = req.body;
        const keys = Object.keys(data);
        const values = Object.values(data).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const questionMarks = keys.map(() => '?').join(', ');
        const backtick = String.fromCharCode(96);
        const fields = keys.map(k => backtick + k + backtick).join(', ');
        const query = `INSERT INTO ${table} (${fields}) VALUES (${questionMarks})`;
        await pool.query(query, values);
        res.json(req.body);
      } catch (e) {
        res.status(500).json({ error: String(e) });
      }
    });

    app.put(`/api/${table}/:id`, async (req, res) => {
      try {
        if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) return res.json(req.body);
        const pool = getPool();
        const data = req.body;
        if (data.id) delete data.id; // Don't update id
        const keys = Object.keys(data);
        const values = keys.map(k => typeof data[k] === 'object' && data[k] !== null ? JSON.stringify(data[k]) : data[k]);
        const backtick = String.fromCharCode(96);
        const setString = keys.map(k => backtick + k + backtick + ' = ?').join(', ');
        const query = `UPDATE ${table} SET ${setString} WHERE id = ?`;
        await pool.query(query, [...values, req.params.id]);
        res.json({ id: req.params.id, ...data });
      } catch (e) {
        res.status(500).json({ error: String(e) });
      }
    });

    app.delete(`/api/${table}/:id`, async (req, res) => {
      try {
        if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) return res.json({ success: true });
        const pool = getPool();
        await pool.query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
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
