import mysql from 'mysql2/promise';
import fs from 'fs';

let pool: mysql.Pool;

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('mysql')) {
      console.warn("DATABASE_URL is not set or invalid. Database operations will fail or be unavailable.");
      // Dummy pool if no url provided, though this will throw on query
      pool = mysql.createPool({ uri: 'mysql://dummy' });
    } else {
      pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        connectTimeout: 10000 // 10 seconds timeout
      });
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
    // 1. Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Fetch already executed migrations
    const [executedRows] = await client.query('SELECT name FROM _migrations');
    const executedMigrations = new Set((executedRows as any[]).map(r => r.name));

    // 3. Define migrations
    const migrations = [
      {
        name: '001_initial_schema',
        up: async () => {
          const schemaSql = fs.readFileSync('esila_ticari_schema.sql', 'utf8');
          const statements = schemaSql.split(';').filter((s: string) => s.trim().length > 0);
          for (const stmt of statements) {
            try {
              await client.query(stmt);
            } catch (e: any) {
              console.error('Error executing statement in 001_initial_schema:', stmt.substring(0, 100), '...', e.message);
            }
          }
        }
      },
      {
        name: '002_add_missing_columns',
        up: async () => {
          const alterStatements = [
            'ALTER TABLE settings ADD COLUMN plumbingChecklistTemplate JSON;',
            'ALTER TABLE tenants ADD COLUMN isEsilaCustomer BOOLEAN DEFAULT FALSE;',
            'ALTER TABLE customers ADD COLUMN customerType VARCHAR(50);',
            'ALTER TABLE customers MODIFY COLUMN type VARCHAR(50);',
            'ALTER TABLE customers ADD COLUMN city VARCHAR(255);',
            'ALTER TABLE customers ADD COLUMN district VARCHAR(255);',
            'ALTER TABLE customers ADD COLUMN iban VARCHAR(255);',
            'ALTER TABLE customers ADD COLUMN balance DECIMAL(15,2) DEFAULT 0;',
            'ALTER TABLE customers ADD COLUMN status VARCHAR(50) DEFAULT "Aktif";',
            'ALTER TABLE personnel ADD COLUMN fixtures JSON;',
            'ALTER TABLE orders ADD COLUMN subTotal DECIMAL(15,2);',
            'ALTER TABLE orders ADD COLUMN taxTotal DECIMAL(15,2);',
            'ALTER TABLE orders ADD COLUMN total DECIMAL(15,2);',
            'ALTER TABLE proposals ADD COLUMN discountTotal DECIMAL(15,2);',
            'ALTER TABLE proposals ADD COLUMN notes TEXT;',
            'ALTER TABLE proposals ADD COLUMN isConvertedToOrder BOOLEAN DEFAULT FALSE;',
            'ALTER TABLE proposals MODIFY COLUMN status VARCHAR(50);',
            'ALTER TABLE cash_transactions ADD COLUMN customerId VARCHAR(255);',
            'ALTER TABLE service_tickets ADD COLUMN plumbingChecklist JSON;',
            'ALTER TABLE service_tickets ADD COLUMN nextMaintenanceDate DATETIME;',
            'ALTER TABLE service_tickets ADD COLUMN maintenancePeriodMonths INT;',
            'ALTER TABLE service_tickets ADD COLUMN maintenanceReminderSent BOOLEAN DEFAULT FALSE;'
          ];

          for (const stmt of alterStatements) {
            try {
              await client.query(stmt);
            } catch (e: any) {
              // Ignore duplicate column errors, throw otherwise
              if (e.code !== 'ER_DUP_FIELDNAME') {
                console.error('Error in 002_add_missing_columns:', e.message, '->', stmt);
              }
            }
          }
        }
      }
    ];

    // 4. Execute pending migrations
    for (const migration of migrations) {
      if (!executedMigrations.has(migration.name)) {
        console.log(`Running migration: ${migration.name}`);
        try {
          await migration.up();
          await client.query('INSERT INTO _migrations (name) VALUES (?)', [migration.name]);
          console.log(`Migration completed: ${migration.name}`);
        } catch (error) {
          console.error(`Migration failed: ${migration.name}`, error);
          // If a migration fails, we stop the sequence to avoid cascading issues.
          throw error; 
        }
      }
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
        warehouseStocks JSON,
        showInQuickSale BOOLEAN DEFAULT false
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
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS job_applications (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          firstName VARCHAR(255),
          lastName VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(50),
          positionApplied VARCHAR(255),
          applicationDate DATETIME,
          status VARCHAR(50) DEFAULT 'Yeni',
          resumeUrl VARCHAR(1000),
          notes TEXT
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS bank_accounts (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          bankName VARCHAR(255),
          accountName VARCHAR(255),
          iban VARCHAR(255),
          balance REAL
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS boms (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          targetProductId VARCHAR(255),
          name VARCHAR(255),
          items JSON,
          estimatedTimeMinutes INTEGER,
          isActive BOOLEAN DEFAULT true
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS work_orders (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          bomId VARCHAR(255),
          plannedQuantity INTEGER,
          producedQuantity INTEGER DEFAULT 0,
          status VARCHAR(50) DEFAULT 'Planlandı',
          targetProductId VARCHAR(255),
          priority VARCHAR(50) DEFAULT 'Normal'
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS attendance (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          personnelId VARCHAR(255),
          date VARCHAR(50),
          status VARCHAR(50),
          entryTime VARCHAR(50),
          exitTime VARCHAR(50),
          overtimeHours REAL
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS salary_adjustments (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          personnelId VARCHAR(255),
          date VARCHAR(50),
          type VARCHAR(50),
          amount REAL,
          description TEXT
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS personnel_tasks (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          personnelId VARCHAR(255),
          title VARCHAR(255),
          description TEXT,
          status VARCHAR(50),
          dueDate VARCHAR(50),
          createdAt VARCHAR(50),
          priority VARCHAR(50)
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS meeting_notes (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          customerId VARCHAR(255),
          date VARCHAR(50),
          notes TEXT,
          nextContactDate VARCHAR(50),
          personnelId VARCHAR(255)
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS documents (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255),
          category VARCHAR(100),
          tags JSON,
          uploadDate VARCHAR(50),
          size INTEGER,
          type VARCHAR(100),
          url TEXT,
          uploadedBy VARCHAR(255),
          relatedEntityId VARCHAR(255)
        );
      `);
    } catch (e: any) {
      console.error('CREATE job_applications or new tables:', e.message);
    }
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

