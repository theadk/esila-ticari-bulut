import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '..', 'database.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT,
    price REAL,
    stock INTEGER,
    category TEXT,
    warehouse TEXT,
    barcode TEXT,
    description TEXT,
    brand TEXT,
    taxRate REAL
  );

  CREATE TABLE IF NOT EXISTS warehouses (
    id TEXT PRIMARY KEY,
    name TEXT,
    address TEXT,
    capacity INTEGER
  );
`);

// Check if empty, then seed warehouses
const whRow = db.prepare('SELECT count(*) as count FROM warehouses').get() as { count: number };
if (whRow.count === 0) {
  const insertWh = db.prepare('INSERT INTO warehouses (id, name, address, capacity) VALUES (?, ?, ?, ?)');
  insertWh.run('1', 'Ana Depo', 'Merkez', 1000);
  insertWh.run('2', 'Şube Depo', 'Kadıköy', 500);
  insertWh.run('3', 'Soğuk Hava Deposu', 'Bodrum', 200);
  insertWh.run('4', 'İade Deposu', 'Merkez', 300);
}

// Check if empty, then seed
const row = db.prepare('SELECT count(*) as count FROM products').get() as { count: number };
if (row.count === 0) {
  const insert = db.prepare('INSERT INTO products (id, code, name, price, stock, category, warehouse, barcode, description, brand, taxRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const seed = db.transaction((products: any[]) => {
    for (const p of products) {
      insert.run(p.id, p.code, p.name, p.price, p.stock, p.category, p.warehouse, p.barcode, p.description, p.brand, p.taxRate);
    }
  });

  seed([
    ['1', 'PRD-001', 'Kablosuz Kulaklık', 1250.00, 45, 'Elektronik', 'Ana Depo', '8691234567890', 'Gürültü önleyici kulaklık', 'Sony', 20],
    ['2', 'PRD-002', 'Akıllı Saat', 3400.00, 12, 'Elektronik', 'Şube Depo', '8691234567891', 'Nabız ölçerli akıllı saat', 'Apple', 20],
    ['3', 'PRD-003', 'Laptop Çantası', 450.00, 120, 'Aksesuar', 'Ana Depo', '8691234567892', 'Su geçirmez çanta', 'Targus', 20],
    ['4', 'PRD-004', 'USB-C Kablo', 150.00, 0, 'Aksesuar', 'Ana Depo', '8691234567893', 'Hızlı şarj destekli', 'Anker', 20]
  ]);
}

export default db;
