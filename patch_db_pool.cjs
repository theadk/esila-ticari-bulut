const fs = require('fs');

let code = fs.readFileSync('server/db.ts', 'utf8');

const newPoolSettings = `      pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10, 
        idleTimeout: 60000, 
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        connectTimeout: 10000
      });`;

code = code.replace(
/      pool = mysql\.createPool\(\{[\s\S]*?connectTimeout: 10000 \/\/ 10 seconds timeout\n      \}\);/,
newPoolSettings
);

// We should also check if we need to reconnect, but mysql2 pool should handle it automatically if enableKeepAlive is true and it creates new connections on demand.
fs.writeFileSync('server/db.ts', code);
console.log("Patched pool settings in server/db.ts");
