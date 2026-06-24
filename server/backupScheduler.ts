import cron from 'node-cron';
import { getPool } from './db.js';
import { getFallbackTable } from './fallbackDb.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUPS_DIR = path.join(process.cwd(), 'backups');

const tables = [
  "settings", "categories", "brands", "products", "warehouses", "stock_transfers",
  "customers", "customer_transactions", "cash_transactions", "personnel", "personnel_records", 
  "orders", "proposals", "reconciliations", "service_tickets", "e_invoices", 
  "email_logs", "reminder_notes", "job_applications"
]; // Notice users and tenants could be handled, but user is per-tenant, so let's include 'users' too.

const ALL_TABLES = ["users", ...tables];

async function runBackup() {
    console.log('[Backup] Firma bazlı yedekleme başlatılıyor...');
    try {
        if (!fs.existsSync(BACKUPS_DIR)) {
            fs.mkdirSync(BACKUPS_DIR, { recursive: true });
        }

        let tenants: any[] = [];
        const isMySQL = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("mysql");

        if (!isMySQL) {
            tenants = getFallbackTable('tenants');
        } else {
            const pool = getPool();
            try {
                const [rows] = await pool.query(`SELECT vkn FROM tenants`);
                tenants = rows as any[];
            } catch (dbError: any) {
                console.error(`[Backup] Veritabanı bağlantı hatası: ${dbError.message}. Yedekleme atlandı.`);
                return;
            }
        }

        for (const tenant of tenants) {
            const vkn = tenant.vkn;
            if (!vkn) continue;

            const tenantDir = path.join(BACKUPS_DIR, String(vkn));
            if (!fs.existsSync(tenantDir)) {
                fs.mkdirSync(tenantDir, { recursive: true });
            }

            const backupData: Record<string, any[]> = {};
            
            if (!isMySQL) {
                for (const table of ALL_TABLES) {
                    backupData[table] = getFallbackTable(table, vkn);
                }
            } else {
                const pool = getPool();
                for (const table of ALL_TABLES) {
                    try {
                        const [rows] = await pool.query(`SELECT * FROM ${table} WHERE vkn = ?`, [vkn]);
                        backupData[table] = rows as any[];
                    } catch (e) {
                         console.warn(`[Backup] Tablo yedeklenemedi (${table}) for VKN ${vkn}:`, e);
                    }
                }
            }

            const timestamp = new Date().toISOString().split('T')[0];
            const backupFile = path.join(tenantDir, `backup_${timestamp}.json`);
            fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');
            
            // Keep only the last 5 backups
            const files = fs.readdirSync(tenantDir).filter(f => f.startsWith('backup_') && f.endsWith('.json'));
            if (files.length > 5) {
                // Sort by date inside filename or simply by name since it's ISO format
                files.sort();
                const filesToDelete = files.slice(0, files.length - 5);
                for (const fileToDelete of filesToDelete) {
                    fs.unlinkSync(path.join(tenantDir, fileToDelete));
                }
            }
        }
        
        console.log(`[Backup] Tüm firmaların (Toplam: ${tenants.length}) yedeği başarıyla alındı ve son 5 yedek kuralı uygulandı.`);
        
        // Generate the system level global backup (optional, but keep it for normal system restore if wanted by superadmin)
        const globalBackupData: Record<string, any[]> = {};
        if (!isMySQL) {
            for (const table of ["tenants", "users", ...tables]) {
                globalBackupData[table] = getFallbackTable(table);
            }
        } else {
            const pool = getPool();
            for (const table of ["tenants", "users", ...tables]) {
                try {
                    const [rows] = await pool.query(`SELECT * FROM ${table}`);
                    globalBackupData[table] = rows as any[];
                } catch(e) {}
            }
        }
        fs.writeFileSync(path.join(process.cwd(), 'backup.json'), JSON.stringify(globalBackupData, null, 2), 'utf-8');
        console.log('[Backup] Sistemsel tam yedekleme de başarıyla güncellendi.');

    } catch (e) {
        console.error('[Backup] Yedekleme sırasında hata oluştu:', e);
    }
}

export function startBackupScheduler() {
    // Ilk calistiginda sistemin durumunu kaydet
    setTimeout(() => {
        runBackup();
    }, 1000 * 10); // 10 saniye sonra al

    // Her gece 03:00'te çalışır
    cron.schedule('0 3 * * *', runBackup);
}

