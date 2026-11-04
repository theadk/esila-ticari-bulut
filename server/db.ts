import mysql from 'mysql2/promise';
import fs from 'fs';
import { notifyAdminDbDisconnect } from './mailer.js';

let pool: mysql.Pool | null = null;
let configuredDatabaseUrl: string = process.env.DATABASE_URL || '';
let lastDbError: { code?: string; message: string; timestamp: string; hint?: string } | null = null;

export function getConfiguredDatabaseUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql')) {
    configuredDatabaseUrl = process.env.DATABASE_URL;
  }
  return configuredDatabaseUrl;
}

export function getLastDbError() {
  return lastDbError;
}

function buildErrorHint(err: any): string {
  const code = err?.code || '';
  const msg = String(err?.message || '');
  if (code === 'ER_ACCESS_DENIED_ERROR' || msg.includes('Access denied')) {
    return 'Kullanıcı adı veya şifre hatalı ya da cPanel > Uzak MySQL (Remote MySQL) bölümünde bu sunucunun IP adresine (% veya sunucu IP) izin verilmemiş.';
  }
  if (code === 'ETIMEDOUT' || msg.includes('ETIMEDOUT')) {
    return 'MySQL sunucusu (Port 3306) yanıt vermedi (Zaman aşımı). Hosting panelinizde (cPanel/Plesk) "Uzak MySQL (Remote MySQL)" erişiminin açık olduğundan ve 3306 portunun dış bağlantıya izin verdiğinden emin olun.';
  }
  if (code === 'ECONNREFUSED') {
    return 'Hedef sunucu 3306 portundan bağlantıyı reddetti. Sunucu adresini (Host) ve port numarasını kontrol edin.';
  }
  if (code === 'ENOTFOUND') {
    return 'Sunucu adresi (Host/Domain) bulunamadı. Lütfen sunucu adresini kontrol edin.';
  }
  if (code === 'ER_BAD_DB_ERROR') {
    return 'Belirtilen veritabanı adı sunucuda bulunamadı. Veritabanı adını kontrol edin.';
  }
  return 'Veritabanı bağlantı bilgilerini ve uzak MySQL erişim izinlerini kontrol edin.';
}

export async function resetPool(newDatabaseUrl?: string) {
  if (typeof newDatabaseUrl === 'string') {
    configuredDatabaseUrl = newDatabaseUrl.trim();
    process.env.DATABASE_URL = configuredDatabaseUrl;
  } else if (configuredDatabaseUrl) {
    process.env.DATABASE_URL = configuredDatabaseUrl;
  }

  if (pool) {
    try {
      await pool.end();
    } catch {
      // ignore pool close errors
    }
    pool = null;
  }
  lastDbError = null;
}

export async function testMysqlConnection(targetUrl: string): Promise<{
  success: boolean;
  latencyMs: number;
  message: string;
  errorCode?: string;
  hint?: string;
}> {
  const start = Date.now();
  let tempConn: mysql.Connection | null = null;
  try {
    tempConn = await mysql.createConnection({
      uri: targetUrl,
      connectTimeout: 7000,
    });
    await tempConn.query('SELECT 1');
    const latencyMs = Date.now() - start;
    await tempConn.end();
    return {
      success: true,
      latencyMs,
      message: `MySQL veritabanına başarıyla bağlanıldı (${latencyMs} ms).`,
    };
  } catch (err: any) {
    if (tempConn) {
      try {
        await tempConn.end();
      } catch {
        // ignore
      }
    }
    const latencyMs = Date.now() - start;
    const hint = buildErrorHint(err);
    return {
      success: false,
      latencyMs,
      errorCode: err?.code || 'DB_ERROR',
      message: err?.message || String(err),
      hint,
    };
  }
}

export function getPool() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql')) {
    configuredDatabaseUrl = process.env.DATABASE_URL;
  }
  if (!pool) {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('mysql')) {
      console.log("Local fallback database mode active.");
      // Dummy pool if no url provided
      pool = mysql.createPool({ uri: 'mysql://dummy' });
    } else {
      pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10, 
        idleTimeout: 60000, 
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        connectTimeout: 8000,
        multipleStatements: false
      });

      (pool as any).on?.('error', (err: any) => {
        lastDbError = {
          code: err?.code,
          message: err?.message || String(err),
          timestamp: new Date().toISOString(),
          hint: buildErrorHint(err),
        };
        notifyAdminDbDisconnect(err, 'MySQL Bağlantı Havuzu (Pool Event)').catch(() => {});
      });
    }

      // --- ETIMEDOUT & Reconnect Interceptor ---
      const originalQuery = pool.query.bind(pool);
      (pool as any).query = async function(...args: any[]) {
        let retries = 2;
        while (retries > 0) {
          const startTime = Date.now();
          try {
            const res = await originalQuery(...args);
            lastDbError = null;
            return res;
          } catch (error: any) {
            const isConnectionError = error.code === 'ETIMEDOUT' || 
                                       error.code === 'ECONNRESET' || 
                                       error.code === 'PROTOCOL_CONNECTION_LOST' || 
                                       error.code === 'EPIPE' ||
                                       error.code === 'ER_ACCESS_DENIED_ERROR' ||
                                       error.code === 'ECONNREFUSED' ||
                                       error.code === 'ENOTFOUND' ||
                                      (error.message && error.message.includes('ETIMEDOUT'));

            if (error.code === 'ER_ACCESS_DENIED_ERROR') {
              lastDbError = {
                code: error.code,
                message: error.message || String(error),
                timestamp: new Date().toISOString(),
                hint: buildErrorHint(error),
              };
              process.env.DATABASE_URL = '';
              notifyAdminDbDisconnect(error, 'MySQL Erişim Reddedildi (ER_ACCESS_DENIED_ERROR)').catch(() => {});
              throw error;
            }
            
            if (isConnectionError) {
              const duration = Date.now() - startTime;
              retries--;
              if (retries === 0) {
                 lastDbError = {
                   code: error.code,
                   message: error.message || String(error),
                   timestamp: new Date().toISOString(),
                   hint: buildErrorHint(error),
                 };
                 process.env.DATABASE_URL = '';
                 notifyAdminDbDisconnect(error, `Sorgu Esnasında Bağlantı Koptu (${duration}ms)`).catch(() => {});
                 throw error;
              }
              await new Promise(res => setTimeout(res, 400));
            } else {
              throw error;
            }
          }
        }
      };

      const originalGetConnection = pool.getConnection.bind(pool);
      (pool as any).getConnection = async function() {
        let retries = 2;
        while (retries > 0) {
          const startTime = Date.now();
          try {
            const conn = await originalGetConnection();
            
            try {
              await conn.ping();
            } catch (pingErr: any) {
              conn.destroy(); // Kill dead connection
              throw pingErr;  // Throw to trigger retry
            }
            
            lastDbError = null;
            return conn;
          } catch (error: any) {
            const isConnectionError = error.code === 'ETIMEDOUT' || 
                                      error.code === 'ECONNRESET' || 
                                      error.code === 'PROTOCOL_CONNECTION_LOST' || 
                                      error.code === 'EPIPE' ||
                                      error.code === 'ER_ACCESS_DENIED_ERROR' ||
                                      error.code === 'ECONNREFUSED' ||
                                      error.code === 'ENOTFOUND' ||
                                      (error.message && error.message.includes('ETIMEDOUT'));
                                      
            if (isConnectionError) {
              const duration = Date.now() - startTime;
              console.warn(`[DB GetConnection] Bağlantı hatası (${duration}ms). Hata: ${error.code}. Kalan deneme: ${retries - 1}`);
              retries--;
              if (retries === 0) {
                 lastDbError = {
                   code: error.code,
                   message: error.message || String(error),
                   timestamp: new Date().toISOString(),
                   hint: buildErrorHint(error),
                 };
                 notifyAdminDbDisconnect(error, `Bağlantı Havuzundan Bağlantı Alınamadı (${duration}ms)`).catch(console.error);
                 throw new Error(`Veritabanına bağlanılamadı (${error.code} - ${duration}ms). Lütfen hosting panelinizden 'Uzak MySQL' erişimine izin verin.`);
              }
              await new Promise(res => setTimeout(res, 400));
            } else {
              throw error;
            }
          }
        }
      };
      // -----------------------------
  }
  return pool;
}

export async function initDb() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql')) {
    configuredDatabaseUrl = process.env.DATABASE_URL;
  }
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('mysql')) {
    console.log('Local fallback database mode configured, skipping remote MySQL init.');
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
        name: '007_add_new_fields_for_expenses_and_prices',
        up: async () => {
          const alterStatements = [
            'ALTER TABLE products ADD COLUMN unit VARCHAR(50) DEFAULT \'Adet\';',
            'ALTER TABLE products ADD COLUMN supplierPrice DECIMAL(15,2);',
            'ALTER TABLE cash_transactions ADD COLUMN personnelId VARCHAR(255);',
            'ALTER TABLE cash_transactions ADD COLUMN accountId VARCHAR(255);'
          ];
          for (const stmt of alterStatements) {
            try {
              await client.query(stmt);
            } catch (e) {
              if (e.code !== 'ER_DUP_FIELDNAME') {
                console.error('Error in 007_add_new_fields:', e.message, '->', stmt);
              }
            }
          }
        }
      },

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
      },
      {
        name: '003_add_order_cargo_columns',
        up: async () => {
          const alterStatements = [
            'ALTER TABLE orders ADD COLUMN cargoProvider VARCHAR(255);',
            'ALTER TABLE orders ADD COLUMN cargoTrackingNumber VARCHAR(255);',
            'ALTER TABLE orders ADD COLUMN cargoBarcodeUrl VARCHAR(1000);',
            'ALTER TABLE orders ADD COLUMN currency VARCHAR(50);',
            'ALTER TABLE orders ADD COLUMN exchangeRate DECIMAL(15,4);',
            'ALTER TABLE orders ADD COLUMN proposalId VARCHAR(255);',
            'ALTER TABLE orders ADD COLUMN notes TEXT;',
            'ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) DEFAULT "Bekliyor";'
          ];
          for (const stmt of alterStatements) {
            try {
              await client.query(stmt);
            } catch (e: any) {
              if (e.code !== 'ER_DUP_FIELDNAME') {
                console.error('Error in 003_add_order_cargo_columns:', e.message, '->', stmt);
              }
            }
          }
        }
      },
      {
        name: '004_ensure_json_items',
        up: async () => {
          const alterStatements = [
            'ALTER TABLE orders ADD COLUMN items JSON;',
            'ALTER TABLE proposals ADD COLUMN items JSON;',
            'ALTER TABLE purchase_requests ADD COLUMN items JSON;',
            'ALTER TABLE suspended_carts ADD COLUMN items JSON;'
          ];
          for (const stmt of alterStatements) {
            try {
              await client.query(stmt);
            } catch (e: any) {
              if (e.code !== 'ER_DUP_FIELDNAME') {
                console.error('Error in 004_ensure_json_items:', e.message, '->', stmt);
              }
            }
          }
        }
      },
      {
        name: '005_recreate_orders_table',
        up: async () => {
          await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                vkn VARCHAR(50),
                id VARCHAR(255) PRIMARY KEY,
                customerId VARCHAR(255),
                customerName VARCHAR(255),
                date DATETIME,
                status VARCHAR(50) DEFAULT 'Bekliyor',
                totalVolume DECIMAL(15,2),
                totalWeight DECIMAL(15,2),
                totalAmount DECIMAL(15,2),
                subTotal DECIMAL(15,2),
                taxTotal DECIMAL(15,2),
                total DECIMAL(15,2),
                currency VARCHAR(50),
                exchangeRate DECIMAL(15,4),
                proposalId VARCHAR(255),
                notes TEXT,
                cargoProvider VARCHAR(255),
                cargoTrackingNumber VARCHAR(255),
                cargoBarcodeUrl VARCHAR(1000),
                items JSON
            )
          `);
          const safeOrderColumns = [
            'ALTER TABLE orders ADD COLUMN totalVolume DECIMAL(15,2);',
            'ALTER TABLE orders ADD COLUMN totalWeight DECIMAL(15,2);',
            'ALTER TABLE orders ADD COLUMN totalAmount DECIMAL(15,2);',
            'ALTER TABLE orders ADD COLUMN subTotal DECIMAL(15,2);',
            'ALTER TABLE orders ADD COLUMN taxTotal DECIMAL(15,2);',
            'ALTER TABLE orders ADD COLUMN total DECIMAL(15,2);',
            'ALTER TABLE orders ADD COLUMN currency VARCHAR(50);',
            'ALTER TABLE orders ADD COLUMN exchangeRate DECIMAL(15,4);',
            'ALTER TABLE orders ADD COLUMN proposalId VARCHAR(255);',
            'ALTER TABLE orders ADD COLUMN notes TEXT;',
            'ALTER TABLE orders ADD COLUMN cargoProvider VARCHAR(255);',
            'ALTER TABLE orders ADD COLUMN cargoTrackingNumber VARCHAR(255);',
            'ALTER TABLE orders ADD COLUMN cargoBarcodeUrl VARCHAR(1000);',
            'ALTER TABLE orders ADD COLUMN items JSON;'
          ];
          for (const stmt of safeOrderColumns) {
            try {
              await client.query(stmt);
            } catch (e: any) {
              if (e.code !== 'ER_DUP_FIELDNAME') {
                console.error('Error in 005_recreate_orders_table:', e.message);
              }
            }
          }
        }
      },
      {
        name: '006_add_reminder_settings',
        up: async () => {
          const alterStatements = [
            'ALTER TABLE settings ADD COLUMN reminder_3_days_before BOOLEAN DEFAULT TRUE;',
            'ALTER TABLE settings ADD COLUMN reminder_1_day_before BOOLEAN DEFAULT TRUE;',
            'ALTER TABLE settings ADD COLUMN reminder_overdue BOOLEAN DEFAULT TRUE;'
          ];
          for (const stmt of alterStatements) {
            try {
              await client.query(stmt);
            } catch (e) {
              if (e.code !== 'ER_DUP_FIELDNAME') {
                console.error('Error in 006_add_reminder_settings:', e.message, '->', stmt);
              }
            }
          }
        }
      },
      {
        name: '007_add_product_image_column',
        up: async () => {
          const stmt = 'ALTER TABLE products ADD COLUMN image LONGTEXT;';
          try {
            await client.query(stmt);
          } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') {
              console.error('Error in 007_add_product_image_column:', e.message, '->', stmt);
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
        vkn VARCHAR(50),
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        address TEXT,
        capacity INTEGER
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        vkn VARCHAR(50),
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        sub_categories JSON
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        vkn VARCHAR(50),
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
        showInQuickSale BOOLEAN DEFAULT false,
        unit VARCHAR(50) DEFAULT 'Adet'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS brands (
        vkn VARCHAR(50),
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS e_invoices (
        vkn VARCHAR(50),
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(100),
        invoiceType VARCHAR(50),
        scenario VARCHAR(50),
        date VARCHAR(50),
        customerName VARCHAR(255),
        amount DECIMAL(15,2),
        currency VARCHAR(10),
        exchangeRate DECIMAL(10,4),
        status VARCHAR(50),
        items JSON,
        notes TEXT,
        isProcessed BOOLEAN DEFAULT false,
        supplierTaxNumber VARCHAR(50)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reconciliations (
        vkn VARCHAR(50),
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
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS personnel_kpis (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          personnelId VARCHAR(255),
          month VARCHAR(50),
          targetSalesAmount DECIMAL(15,2),
          actualSalesAmount DECIMAL(15,2),
          targetNewLeads INT,
          actualNewLeads INT
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS suspended_carts (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255),
          date VARCHAR(255),
          items JSON,
          customerId VARCHAR(255)
        )
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
        CREATE TABLE IF NOT EXISTS personnel (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          firstName VARCHAR(255),
          lastName VARCHAR(255),
          tcNo VARCHAR(50),
          birthDate VARCHAR(50),
          gender VARCHAR(50),
          bloodType VARCHAR(50),
          phone VARCHAR(50),
          email VARCHAR(255),
          address TEXT,
          emergencyContactName VARCHAR(255),
          emergencyContactPhone VARCHAR(50),
          department VARCHAR(255),
          position VARCHAR(255),
          startDate VARCHAR(50),
          endDate VARCHAR(50),
          employmentStatus VARCHAR(50),
          salary REAL,
          iban VARCHAR(255),
          socialSecurityNo VARCHAR(255),
          currency VARCHAR(50),
          records JSON,
          payrollRecords JSON,
          fixtures JSON,
          payrolls JSON,
          annualLeaveEntitlement REAL,
          leaveRecords JSON
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS personnel_records (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          personnelId VARCHAR(255),
          date VARCHAR(50),
          type VARCHAR(50),
          description TEXT,
          amount REAL
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
        )
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
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS waybills (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          supplierId VARCHAR(255),
          documentNo VARCHAR(255),
          date DATETIME,
          items JSON,
          totalAmount DECIMAL(15,2)
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS payment_notifications (
          id VARCHAR(255) PRIMARY KEY,
          vkn VARCHAR(50),
          tenantName VARCHAR(255),
          senderName VARCHAR(255),
          senderBank VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(50),
          package VARCHAR(100),
          amount DECIMAL(15,2),
          transferDate VARCHAR(100),
          notes TEXT,
          status VARCHAR(50) DEFAULT 'Bekliyor',
          date DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (e: any) {
      console.error('CREATE job_applications or new tables:', e.message);
    }
    console.log("Database initialized successfully.");
    lastDbError = null;
  } catch (err: any) {
    lastDbError = {
      code: err?.code,
      message: err?.message || String(err),
      timestamp: new Date().toISOString(),
      hint: buildErrorHint(err),
    };
    process.env.DATABASE_URL = '';
    console.log('Active mirror of esilayaz_esilaticari loaded while remote host reconnects:', err?.message || err);
    notifyAdminDbDisconnect(err, 'Veritabanı Başlangıç Kurulumu (initDb)').catch(() => {});

    // Automatically reconnect in background as soon as remote MySQL accepts connection
    const targetUrl = configuredDatabaseUrl;
    if (targetUrl && targetUrl.startsWith('mysql')) {
      const retryInterval = setInterval(async () => {
        if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql')) {
          clearInterval(retryInterval);
          return;
        }
        const check = await testMysqlConnection(targetUrl);
        if (check.success) {
          clearInterval(retryInterval);
          await resetPool(targetUrl);
          console.log('Reconnected to live MySQL (esilayaz_esilaticari) successfully.');
        }
      }, 30000);
    }
  }
}
