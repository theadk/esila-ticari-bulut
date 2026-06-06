import cron from 'node-cron';
import { getPool } from './db.js';
import { getFallbackTable } from './fallbackDb.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_FILE = path.join(__dirname, '..', 'backup.json');

const tables = [
  "tenants", "users", "settings", "categories", "brands", "products", "warehouses", "stock_transfers",
  "customers", "customer_transactions", "cash_transactions", "personnel", "personnel_records", 
  "orders", "proposals", "reconciliations", "service_tickets", "e_invoices", 
  "email_logs", "reminder_notes", "job_applications"
];

export function startBackupScheduler() {
    // Günlük gece 03:00'te çalışır
    cron.schedule('0 3 * * *', async () => {
        console.log('[Cron] Günlük yedekleme başlatılıyor...');
        try {
            const backupData: Record<string, any[]> = {};
            
            if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
                for (const table of tables) {
                    backupData[table] = getFallbackTable(table);
                }
            } else {
                const pool = getPool();
                for (const table of tables) {
                    try {
                        const [rows] = await pool.query(`SELECT * FROM ${table}`);
                        backupData[table] = rows as any[];
                    } catch (e) {
                         console.warn(`[Cron] Tablo yedeklenemedi (${table}):`, e);
                    }
                }
            }

            fs.writeFileSync(BACKUP_FILE, JSON.stringify(backupData, null, 2), 'utf-8');
            console.log('[Cron] Günlük yedekleme başarıyla tamamlandı. Yedeklenen dosya:', BACKUP_FILE);
        } catch (e) {
            console.error('[Cron] Yedekleme sırasında hata oluştu:', e);
        }
    });

    // Anlık çağrı için (uygulama başladığında deneme amaçlı değilse yorum satırı olsun, biz sadece zamanlanmış bırakacağız)
}
