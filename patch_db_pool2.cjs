const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

// I will just rewrite the getPool top part completely to be safe.
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

      // --- ETIMEDOUT Interceptor ---`;

code = code.replace(/export function getPool\(\) \{[\s\S]*?\/\/ --- ETIMEDOUT Interceptor ---/, target);
fs.writeFileSync('server/db.ts', code);
console.log("Fixed getPool");
