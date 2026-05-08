import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './server/db.js';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  app.get('/api/products', (req, res) => {
    try {
      const products = db.prepare('SELECT * FROM products').all();
      res.json(products);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    try {
      const stmt = db.prepare('DELETE FROM products WHERE id = ?');
      stmt.run(id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get('/api/warehouses', (req, res) => {
    try {
      const warehouses = db.prepare('SELECT * FROM warehouses').all();
      res.json(warehouses);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/warehouses', (req, res) => {
    const { id, name, address, capacity } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO warehouses (id, name, address, capacity) VALUES (?, ?, ?, ?)');
      stmt.run(id, name, address, capacity);
      res.json(req.body);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { code, name, price, stock, category, warehouse, barcode, description, brand, taxRate } = req.body;
    try {
      const stmt = db.prepare('UPDATE products SET code = ?, name = ?, price = ?, stock = ?, category = ?, warehouse = ?, barcode = ?, description = ?, brand = ?, taxRate = ? WHERE id = ?');
      stmt.run(code, name, price, stock, category, warehouse, barcode, description, brand, taxRate, id);
      res.json({ id, ...req.body });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/products', (req, res) => {
    const { id, code, name, price, stock, category, warehouse, barcode, description, brand, taxRate } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO products (id, code, name, price, stock, category, warehouse, barcode, description, brand, taxRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      stmt.run(id, code, name, price, stock, category, warehouse, barcode, description, brand, taxRate);
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
