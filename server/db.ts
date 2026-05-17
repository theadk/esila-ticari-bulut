import mysql from 'mysql2/promise';
import fs from 'fs';

let pool: mysql.Pool;

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL is not set. Database operations will fail or be unavailable.");
      // Dummy pool if no url provided, though this will throw on query
      pool = mysql.createPool({ uri: 'mysql://dummy' });
    } else {
      pool = mysql.createPool(process.env.DATABASE_URL);
    }
  }
  return pool;
}

export async function initDb() {
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('mysql')) {
    console.log('No valid DATABASE_URL (mysql) configured, skipping DB init.');
    return;
  }

  const client = getPool();
  try {
    
    const schemaSql = fs.readFileSync('esila_ticari_schema.sql', 'utf8');
    const statements = schemaSql.split(';').filter((s: string) => s.trim().length > 0);
    for (const stmt of statements) {
      await client.query(stmt);
    }

    /*
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
        sub_categories JSON
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(255),
        name VARCHAR(255),
        price REAL,
        purchasePrice REAL,
        stock INTEGER,
        category VARCHAR(255),
        warehouse VARCHAR(255),
        barcode VARCHAR(255),
        description TEXT,
        brand VARCHAR(255),
        taxRate REAL,
        warehouseStocks JSON
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reconciliations (
        id VARCHAR(255) PRIMARY KEY,
        customerId VARCHAR(255),
        customerName VARCHAR(255),
        date VARCHAR(255),
        balanceType VARCHAR(50),
        balance REAL,
        status VARCHAR(50),
        notes TEXT,
        emailSentAt VARCHAR(255),
        respondedAt VARCHAR(255),
        responseNotes TEXT
      );
    `);

    // seeding warehouses
    const [whRes]: any = await client.query('SELECT count(*) as count FROM warehouses');
    if (parseInt(whRes[0].count) === 0) {
      await client.query(`
        INSERT INTO warehouses (id, name, address, capacity) VALUES 
        ('1', 'Ana Depo', 'Merkez', 1000),
        ('2', 'Şube Depo', 'Kadıköy', 500),
        ('3', 'Soğuk Hava Deposu', 'Bodrum', 200),
        ('4', 'İade Deposu', 'Merkez', 300)
      `);
    }

    // seeding products
    const [prodRes]: any = await client.query('SELECT count(*) as count FROM products');
    if (parseInt(prodRes[0].count) === 0) {
      await client.query(`
        INSERT INTO products (id, code, name, price, stock, category, warehouse, barcode, description, brand, taxRate) VALUES 
        ('1', 'PRD-001', 'Kablosuz Kulaklık', 1250.00, 45, 'Elektronik', 'Ana Depo', '8691234567890', 'Gürültü önleyici kulaklık', 'Sony', 20),
        ('2', 'PRD-002', 'Akıllı Saat', 3400.00, 12, 'Elektronik', 'Şube Depo', '8691234567891', 'Nabız ölçerli akıllı saat', 'Apple', 20),
        ('3', 'PRD-003', 'Laptop Çantası', 450.00, 120, 'Aksesuar', 'Ana Depo', '8691234567892', 'Su geçirmez çanta', 'Targus', 20),
        ('4', 'PRD-004', 'USB-C Kablo', 150.00, 0, 'Aksesuar', 'Ana Depo', '8691234567893', 'Hızlı şarj destekli', 'Anker', 20)
      `);
    }

    const [brandRes]: any = await client.query('SELECT count(*) as count FROM brands');
    if (parseInt(brandRes[0].count) === 0) {
      await client.query(`
        INSERT INTO brands (id, name) VALUES 
        ('1', 'Sony'),
        ('2', 'Apple'),
        ('3', 'Samsung')
      `);
    }
    
    */
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

