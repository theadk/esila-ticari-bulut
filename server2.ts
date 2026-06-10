import express from 'express';

function generateSecurePassword() {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
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
import { getFallbackTable, insertFallbackRow, updateFallbackRow, deleteFallbackRow } from './server/fallbackDb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loginAttempts = new Map<string, { attempts: number, lockUntil: number | null }>();


let fallbackUsers: any[] = [
  { id: 'u1', name: 'Sistem Yöneticisi', username: 'admin', email: 'admin@esila.com', passwordHash: 'admin123', role: 'Admin', status: 'Aktif' }
];

let fallbackTenants = [
  { vkn: '1111111111', name: 'Esila Master', email: 'admin@firma.com', modules: ['all'], status: 'Aktif', package: 'Sınırsız', expirationDate: null }
];

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
  startMailScheduler();
  
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use(cors());

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
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) return res.json(fallbackCategories);
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM categories WHERE vkn = ?', [req.headers['x-tenant-id'] || '1111111111']);
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
      await pool.query('INSERT INTO categories (vkn, id, name, sub_categories) VALUES (?, ?, ?, ?)', [req.headers['x-tenant-id'] || '1111111111', id, name, JSON.stringify(subCategories)]);
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
      await pool.query('UPDATE categories SET name = ?, sub_categories = ? WHERE id = ? AND vkn = ?', [name, JSON.stringify(subCategories), id, req.headers['x-tenant-id'] || '1111111111']);
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
      await pool.query('DELETE FROM categories WHERE id = ? AND vkn = ?', [id, req.headers['x-tenant-id'] || '1111111111']);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/brands', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) return res.json(fallbackBrands);
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
      fallbackBrands.push(req.body);
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
      const idx = fallbackBrands.findIndex(b => String(b.id) === String(req.params.id));
      if (idx !== -1) fallbackBrands[idx] = { ...fallbackBrands[idx], ...req.body, id: req.params.id };
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
      fallbackBrands = fallbackBrands.filter(b => String(b.id) !== String(req.params.id));
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
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql"))) return res.json(fallbackWarehouses);
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
      fallbackWarehouses.push(req.body);
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
      const idx = fallbackWarehouses.findIndex(w => String(w.id) === String(req.params.id));
      if (idx !== -1) fallbackWarehouses[idx] = { ...fallbackWarehouses[idx], ...req.body, id: req.params.id };
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
      const initLen = fallbackWarehouses.length;
      const filtered = fallbackWarehouses.filter(w => String(w.id) !== String(req.params.id));
      fallbackWarehouses.length = 0;
      fallbackWarehouses.push(...filtered);
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
      const idx = fallbackProducts.findIndex(p => String(p.id) === String(req.params.id));
      if (idx !== -1) fallbackProducts[idx] = { ...fallbackProducts[idx], ...req.body, id: req.params.id };
      return res.json({ id: req.params.id, ...req.body });
    }
    const { id } = req.params;
    const { code, name, price, purchasePrice, stock, category, warehouse, barcode, description, brand, taxRate, warehouseStocks } = req.body;
    try {
      const pool = getPool();
      await pool.query(
        'UPDATE products SET code = ?, name = ?, price = ?, stock = ?, category = ?, warehouse = ?, barcode = ?, description = ?, brand = ?, `taxRate` = ?, `warehouseStocks` = ?, `purchasePrice` = ? WHERE id = ? AND vkn = ?',
        [code, name, price, stock, category, warehouse, barcode, description, brand, taxRate, JSON.stringify(warehouseStocks || []), purchasePrice, id, req.headers['x-tenant-id'] || '1111111111']
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
    const { id, code, name, price, purchasePrice, stock, category, warehouse, barcode, description, brand, taxRate, warehouseStocks } = req.body;
    try {
      const pool = getPool();
      await pool.query('INSERT INTO products (vkn, id, code, name, price, stock, category, warehouse, barcode, description, brand, `taxRate`, `warehouseStocks`, `purchasePrice`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.headers['x-tenant-id'] || '1111111111', id, code, name, price, stock, category, warehouse, barcode, description, brand, taxRate, JSON.stringify(warehouseStocks || []), purchasePrice]
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
      fallbackReconciliations.push(mutabakat);
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
      const idx = fallbackReconciliations.findIndex(r => String(r.id) === String(id));
      if (idx !== -1) fallbackReconciliations[idx] = { ...fallbackReconciliations[idx], ...req.body, id };
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
      fallbackReconciliations = fallbackReconciliations.filter(r => String(r.id) !== String(req.params.id));
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
      const rec = fallbackReconciliations.find(r => String(r.id) === String(id));
      if (rec) {
        rec.status = 'Onaylandı';
        rec.respondedAt = date;
        rec.responseNotes = notes;
      }
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
      const rec = fallbackReconciliations.find(r => String(r.id) === String(id));
      if (rec) {
        rec.status = 'Reddedildi';
        rec.respondedAt = date;
        rec.responseNotes = notes;
      }
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
            const sett = settingsTable.find((s) => s.vkn === t.vkn);
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

      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const dDate = new Date();
        dDate.setFullYear(dDate.getFullYear() + (data.package === 'Aylık' ? 0 : data.package === 'Sınırsız' ? 100 : 1));
        if (data.package === 'Aylık') dDate.setMonth(dDate.getMonth() + 1);

        fallbackTenants.push({
          ...data,
          status: 'Bekliyor',
          expirationDate: dDate.toISOString()
        });
        fallbackUsers.push({
          id: "admin-" + data.vkn,
          vkn: data.vkn,
          name: data.name + ' Admin',
          username: data.vkn,
          email: data.email,
          passwordHash: newAdminPass,
          role: 'Admin',
          status: 'Aktif'
        });
        return res.json({success: true});
      }

      const pool = getPool();
      const q = `INSERT INTO tenants (vkn, name, email, modules, status, package, expirationDate, sector, isEsilaCustomer) VALUES (?, ?, ?, ?, 'Bekliyor', ?, DATE_ADD(NOW(), INTERVAL ${expInterval}), ?, ?)`;
      await pool.query(q, [data.vkn, data.name, data.email, JSON.stringify(data.modules), data.package || 'Yıllık', data.sector || '', data.isEsilaCustomer ? true : false]);
      
      // Seed user for tenant
      await pool.query("INSERT INTO users (id, vkn, name, username, email, passwordHash, role, status) VALUES (?, ?, ?, ?, ?, ?, 'Admin', 'Aktif')",
        ["admin-" + data.vkn, data.vkn, data.name + ' Admin', data.vkn, data.email, newAdminPass]
      );

      // Seed settings
      const fullAddress = [data.address, data.district, data.city].filter(Boolean).join(' - ');
      await pool.query("INSERT INTO settings (vkn, id, companyName, email, phone, address) VALUES (?, 1, ?, ?, ?, ?)",
        [data.vkn, data.name, data.email, data.phone || '', fullAddress]
      );

      res.json({success: true});
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
      if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
        const t = fallbackTenants.find(x => x.vkn === vkn);
        if (t) t.status = 'Aktif';
        return res.json({success: true});
      }
      const pool = getPool();
      await pool.query("UPDATE tenants SET status = 'Aktif' WHERE vkn = ?", [vkn]);
      res.json({success: true});
    } catch(e) { res.status(500).json({error: String(e)}); }
  });

  app.get('/api/test-users', (req, res) => {
    res.json(fallbackUsers);
  });
  
  // Generic CRUD API for all tables

  const tables = ["users","settings","customers","customer_transactions","cash_transactions","personnel","personnel_records","orders","proposals","service_tickets","e_invoices","job_applications"];
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
          insertFallbackRow(table, { ...req.body, vkn });
          return res.json(req.body);
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
        if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) return res.json({ success: true });
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
