import { getPool } from './server/db.js';
import { config } from 'dotenv';
config();

async function runTest() {
  console.log("Veritabanı bağlantısı sınanıyor...");
  console.log("URL:", process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') : 'YOK');
  const pool = getPool();
  try {
    const startTime = Date.now();
    await pool.query('SELECT 1');
    console.log(`✅ BAŞARILI: Veritabanına bağlanıldı! (${Date.now() - startTime}ms)`);
    process.exit(0);
  } catch (err: any) {
    console.error(`❌ BAŞARISIZ: ${err.message}`);
    process.exit(1);
  }
}

runTest();
