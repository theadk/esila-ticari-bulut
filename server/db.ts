import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool;

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL is not set. Database operations will fail or be unavailable.");
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') 
           ? { rejectUnauthorized: false } 
           : undefined
    });
  }
  return pool;
}

export async function initDb() {
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgres')) {
    console.log('No valid DATABASE_URL configured, skipping DB init.');
    return;
  }

  const client = getPool();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        address TEXT,
        capacity INTEGER
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        sub_categories TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(255),
        name VARCHAR(255),
        price REAL,
        stock INTEGER,
        category VARCHAR(255),
        warehouse VARCHAR(255),
        barcode VARCHAR(255),
        description TEXT,
        brand VARCHAR(255),
        "taxRate" REAL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255)
      );
    `);

    // seeding warehouses
    const whRes = await client.query('SELECT count(*) FROM warehouses');
    if (parseInt(whRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO warehouses (id, name, address, capacity) VALUES 
        ('1', 'Ana Depo', 'Merkez', 1000),
        ('2', 'Şube Depo', 'Kadıköy', 500),
        ('3', 'Soğuk Hava Deposu', 'Bodrum', 200),
        ('4', 'İade Deposu', 'Merkez', 300)
      `);
    }

    // seeding products
    const prodRes = await client.query('SELECT count(*) FROM products');
    if (parseInt(prodRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO products (id, code, name, price, stock, category, warehouse, barcode, description, brand, "taxRate") VALUES 
        ('1', 'PRD-001', 'Kablosuz Kulaklık', 1250.00, 45, 'Elektronik', 'Ana Depo', '8691234567890', 'Gürültü önleyici kulaklık', 'Sony', 20),
        ('2', 'PRD-002', 'Akıllı Saat', 3400.00, 12, 'Elektronik', 'Şube Depo', '8691234567891', 'Nabız ölçerli akıllı saat', 'Apple', 20),
        ('3', 'PRD-003', 'Laptop Çantası', 450.00, 120, 'Aksesuar', 'Ana Depo', '8691234567892', 'Su geçirmez çanta', 'Targus', 20),
        ('4', 'PRD-004', 'USB-C Kablo', 150.00, 0, 'Aksesuar', 'Ana Depo', '8691234567893', 'Hızlı şarj destekli', 'Anker', 20)
      `);
    }

    const brandRes = await client.query('SELECT count(*) FROM brands');
    if (parseInt(brandRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO brands (id, name) VALUES 
        ('1', 'Sony'),
        ('2', 'Apple'),
        ('3', 'Samsung')
      `);
    }
    
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

