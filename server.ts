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
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres"))) return res.json(fallbackProducts);
    try {
      const pool = getPool();
      const { rows } = await pool.query('SELECT * FROM products');
      res.json(rows.map((row: any) => ({
        ...row,
        warehouseStocks: typeof row.warehouseStocks === 'string' ? JSON.parse(row.warehouseStocks) : (row.warehouseStocks || [])
      })));
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres"))) {
      fallbackProducts = fallbackProducts.filter(p => String(p.id) !== String(req.params.id));
      return res.json({ success: true });
    }
    const { id } = req.params;
    try {
      const pool = getPool();
      await pool.query('DELETE FROM products WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get('/api/categories', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres"))) return res.json(fallbackCategories);
    try {
      const pool = getPool();
      const { rows } = await pool.query('SELECT * FROM categories');
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
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres"))) {
      fallbackCategories.push(newCat);
      return res.json(newCat);
    }
    const { id, name, subCategories } = newCat;
    try {
      const pool = getPool();
      await pool.query('INSERT INTO categories (id, name, sub_categories) VALUES ($1, $2, $3)', [id, name, JSON.stringify(subCategories)]);
      res.json(newCat);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put('/api/categories/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres"))) {
      const idx = fallbackCategories.findIndex(c => String(c.id) === String(req.params.id));
      if (idx !== -1) fallbackCategories[idx] = { ...fallbackCategories[idx], ...req.body, id: req.params.id };
      return res.json({ id: req.params.id, ...req.body });
    }
    const { id } = req.params;
    const { name, subCategories } = req.body;
    try {
      const pool = getPool();
      await pool.query('UPDATE categories SET name = $1, sub_categories = $2 WHERE id = $3', [name, JSON.stringify(subCategories), id]);
      res.json({ id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres"))) {
      fallbackCategories = fallbackCategories.filter(c => String(c.id) !== String(req.params.id));
      return res.json({ success: true });
    }
    const { id } = req.params;
    try {
      const pool = getPool();
      await pool.query('DELETE FROM categories WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/brands', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres"))) return res.json(fallbackBrands);
    try {
      const pool = getPool();
      const { rows } = await pool.query('SELECT * FROM brands');
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/brands', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres"))) {
      fallbackBrands.push(req.body);
      return res.json(req.body);
    }
    const { id, name } = req.body;
    try {
      const pool = getPool();
      await pool.query('INSERT INTO brands (id, name) VALUES ($1, $2)', [id, name]);
      res.json(req.body);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.put('/api/brands/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres"))) {
      const idx = fallbackBrands.findIndex(b => String(b.id) === String(req.params.id));
      if (idx !== -1) fallbackBrands[idx] = { ...fallbackBrands[idx], ...req.body, id: req.params.id };
      return res.json({ id: req.params.id, ...req.body });
    }
    const { id } = req.params;
    const { name } = req.body;
    try {
      const pool = getPool();
      await pool.query('UPDATE brands SET name = $1 WHERE id = $2', [name, id]);
      res.json({ id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete('/api/brands/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres"))) {
      fallbackBrands = fallbackBrands.filter(b => String(b.id) !== String(req.params.id));
      return res.json({ success: true });
    }
    try {
      const pool = getPool();
      await pool.query('DELETE FROM brands WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/warehouses', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres"))) return res.json(fallbackWarehouses);
    try {
      const pool = getPool();
      const { rows } = await pool.query('SELECT * FROM warehouses');
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/warehouses', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres"))) {
      fallbackWarehouses.push(req.body);
      return res.json(req.body);
    }
    const { id, name, address, capacity } = req.body;
    try {
      const pool = getPool();
      await pool.query(
        'INSERT INTO warehouses (id, name, address, capacity) VALUES ($1, $2, $3, $4)', 
        [id, name, address, capacity]
      );
      res.json(req.body);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.put('/api/warehouses/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres"))) {
      const idx = fallbackWarehouses.findIndex(w => String(w.id) === String(req.params.id));
      if (idx !== -1) fallbackWarehouses[idx] = { ...fallbackWarehouses[idx], ...req.body, id: req.params.id };
      return res.json({ id: req.params.id, ...req.body });
    }
    const { name, address, capacity } = req.body;
    try {
      const pool = getPool();
      await pool.query(
        'UPDATE warehouses SET name = $1, address = $2, capacity = $3 WHERE id = $4',
        [name, address, capacity, req.params.id]
      );
      res.json({ id: req.params.id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete('/api/warehouses/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres"))) {
      const initLen = fallbackWarehouses.length;
      const filtered = fallbackWarehouses.filter(w => String(w.id) !== String(req.params.id));
      fallbackWarehouses.length = 0;
      fallbackWarehouses.push(...filtered);
      return res.json({ success: true });
    }
    try {
      const pool = getPool();
      await pool.query('DELETE FROM warehouses WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres"))) {
      const idx = fallbackProducts.findIndex(p => String(p.id) === String(req.params.id));
      if (idx !== -1) fallbackProducts[idx] = { ...fallbackProducts[idx], ...req.body, id: req.params.id };
      return res.json({ id: req.params.id, ...req.body });
    }
    const { id } = req.params;
    const { code, name, price, stock, category, warehouse, barcode, description, brand, taxRate, warehouseStocks } = req.body;
    try {
      const pool = getPool();
      await pool.query(
        'UPDATE products SET code = $1, name = $2, price = $3, stock = $4, category = $5, warehouse = $6, barcode = $7, description = $8, brand = $9, "taxRate" = $10, "warehouseStocks" = $11 WHERE id = $12',
        [code, name, price, stock, category, warehouse, barcode, description, brand, taxRate, JSON.stringify(warehouseStocks || []), id]
      );
      res.json({ id, ...req.body });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/products', async (req, res) => {
    if ((!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres"))) {
      fallbackProducts.push({ ...req.body, id: req.body.id || String(Date.now()) });
      return res.json(req.body);
    }
    const { id, code, name, price, stock, category, warehouse, barcode, description, brand, taxRate, warehouseStocks } = req.body;
    try {
      const pool = getPool();
      await pool.query(
        'INSERT INTO products (id, code, name, price, stock, category, warehouse, barcode, description, brand, "taxRate", "warehouseStocks") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [id, code, name, price, stock, category, warehouse, barcode, description, brand, taxRate, JSON.stringify(warehouseStocks || [])]
      );
      res.json(req.body);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

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
