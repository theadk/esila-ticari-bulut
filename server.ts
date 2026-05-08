import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, initDb } from './server/db.js';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let fallbackWarehouses = [
  { id: '1', name: 'Ana Depo', address: 'Merkez', capacity: 1000 },
  { id: '2', name: 'Şube Depo', address: 'Kadıköy', capacity: 500 },
  { id: '3', name: 'Soğuk Hava Deposu', address: 'Bodrum', capacity: 200 },
  { id: '4', name: 'İade Deposu', address: 'Merkez', capacity: 300 }
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
    if (!process.env.DATABASE_URL) return res.json(fallbackProducts);
    try {
      const pool = getPool();
      const { rows } = await pool.query('SELECT * FROM products');
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    if (!process.env.DATABASE_URL) {
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

  app.get('/api/warehouses', async (req, res) => {
    if (!process.env.DATABASE_URL) return res.json(fallbackWarehouses);
    try {
      const pool = getPool();
      const { rows } = await pool.query('SELECT * FROM warehouses');
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/warehouses', async (req, res) => {
    if (!process.env.DATABASE_URL) {
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

  app.put('/api/products/:id', async (req, res) => {
    if (!process.env.DATABASE_URL) {
      const idx = fallbackProducts.findIndex(p => String(p.id) === String(req.params.id));
      if (idx !== -1) fallbackProducts[idx] = { ...fallbackProducts[idx], ...req.body, id: req.params.id };
      return res.json({ id: req.params.id, ...req.body });
    }
    const { id } = req.params;
    const { code, name, price, stock, category, warehouse, barcode, description, brand, taxRate } = req.body;
    try {
      const pool = getPool();
      await pool.query(
        'UPDATE products SET code = $1, name = $2, price = $3, stock = $4, category = $5, warehouse = $6, barcode = $7, description = $8, brand = $9, "taxRate" = $10 WHERE id = $11',
        [code, name, price, stock, category, warehouse, barcode, description, brand, taxRate, id]
      );
      res.json({ id, ...req.body });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/products', async (req, res) => {
    if (!process.env.DATABASE_URL) {
      fallbackProducts.push({ ...req.body, id: req.body.id || String(Date.now()) });
      return res.json(req.body);
    }
    const { id, code, name, price, stock, category, warehouse, barcode, description, brand, taxRate } = req.body;
    try {
      const pool = getPool();
      await pool.query(
        'INSERT INTO products (id, code, name, price, stock, category, warehouse, barcode, description, brand, "taxRate") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [id, code, name, price, stock, category, warehouse, barcode, description, brand, taxRate]
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
