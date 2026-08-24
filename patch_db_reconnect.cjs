const fs = require('fs');

let code = fs.readFileSync('server/db.ts', 'utf8');

const target = `export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('mysql')) {
      console.warn("DATABASE_URL is not set or invalid. Database operations will fail or be unavailable.");
      // Dummy pool if no url provided, though this will throw on query
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
        connectTimeout: 10000
      });
    }

      // --- ETIMEDOUT & Reconnect Interceptor ---
      const originalQuery = pool.query.bind(pool);
      (pool as any).query = async function(...args: any[]) {
        let retries = 3;
        while (retries > 0) {
          const startTime = Date.now();
          try {
            return await originalQuery(...args);
          } catch (error: any) {
            const isConnectionError = error.code === 'ETIMEDOUT' || 
                                      error.code === 'ECONNRESET' || 
                                      error.code === 'PROTOCOL_CONNECTION_LOST' || 
                                      error.code === 'EPIPE' ||
                                      (error.message && error.message.includes('ETIMEDOUT'));
            
            if (isConnectionError) {
              const duration = Date.now() - startTime;
              console.warn(\`[DB Timeout/Disconnect] Bağlantı koptu veya zaman aşımı (\${duration}ms). Hata: \${error.code}. Kalan deneme: \${retries - 1}\`);
              retries--;
              if (retries === 0) {
                 throw new Error(\`Veritabanı bağlantısı koptu ve yeniden bağlanılamadı (\${error.code} - \${duration}ms). Lütfen hosting panelinizden 'Uzak MySQL' erişimine izin verin.\`);
              }
              await new Promise(res => setTimeout(res, 500));
            } else {
              throw error;
            }
          }
        }
      };

      const originalGetConnection = pool.getConnection.bind(pool);
      (pool as any).getConnection = async function() {
        let retries = 3;
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
            
            return conn;
          } catch (error: any) {
            const isConnectionError = error.code === 'ETIMEDOUT' || 
                                      error.code === 'ECONNRESET' || 
                                      error.code === 'PROTOCOL_CONNECTION_LOST' || 
                                      error.code === 'EPIPE' ||
                                      (error.message && error.message.includes('ETIMEDOUT'));
                                      
            if (isConnectionError) {
              const duration = Date.now() - startTime;
              console.warn(\`[DB GetConnection] Bağlantı hatası (\${duration}ms). Hata: \${error.code}. Kalan deneme: \${retries - 1}\`);
              retries--;
              if (retries === 0) {
                 throw new Error(\`Veritabanına bağlanılamadı (\${error.code} - \${duration}ms). Lütfen hosting panelinizden 'Uzak MySQL' erişimine izin verin.\`);
              }
              await new Promise(res => setTimeout(res, 500));
            } else {
              throw error;
            }
          }
        }
      };
      // -----------------------------
  }
  return pool;
}`;

// Replace the entire getPool function
code = code.replace(/export function getPool\(\) \{[\s\S]*?return pool;\n\}/, target);

fs.writeFileSync('server/db.ts', code);
console.log("Patched server/db.ts with smart reconnect logic.");
