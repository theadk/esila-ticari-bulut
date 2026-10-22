const fs = require('fs');

let content = fs.readFileSync('server/db.ts', 'utf8');

const target = `            const isConnectionError = error.code === 'ETIMEDOUT' || 
                                       error.code === 'ECONNRESET' || 
                                       error.code === 'PROTOCOL_CONNECTION_LOST' || 
                                       error.code === 'EPIPE' ||
                                      (error.message && error.message.includes('ETIMEDOUT'));`;

const replacement = `            const isConnectionError = error.code === 'ETIMEDOUT' || 
                                       error.code === 'ECONNRESET' || 
                                       error.code === 'PROTOCOL_CONNECTION_LOST' || 
                                       error.code === 'EPIPE' ||
                                       error.code === 'ER_ACCESS_DENIED_ERROR' ||
                                       error.code === 'ECONNREFUSED' ||
                                       error.code === 'ENOTFOUND' ||
                                      (error.message && error.message.includes('ETIMEDOUT'));

            if (error.code === 'ER_ACCESS_DENIED_ERROR') {
              console.warn('[DB Access Denied] Uzak MySQL erişim yetkisi reddedildi (IP kısıtlaması). Otomatik olarak yerel yedek (fallback) moduna geçiliyor.');
              process.env.DATABASE_URL = '';
            }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('server/db.ts', content, 'utf8');
  console.log('Successfully patched server/db.ts');
} else {
  console.log('Target not found in server/db.ts');
}
