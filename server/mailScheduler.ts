import cron from 'node-cron';
import { getPool } from './db.js';
import { getFallbackTable } from './fallbackDb.js';
import { sendMail } from './mailer.js';

export function startMailScheduler() {
    // Günlük sabah 08:00'de çalışır
    cron.schedule('0 8 * * *', async () => {
        try {
            console.log('[Cron] Düşük stoklu ürünler kontrol ediliyor...');
            if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
                const tenants = getFallbackTable('tenants');
                const products = getFallbackTable('products');
                const settings = getFallbackTable('settings');

                for (const tenant of tenants) {
                    if (tenant.status !== 'Aktif') continue;
                    
                    const tenantProducts = products.filter(p => p.vkn === tenant.vkn && parseInt(p.stock || '0', 10) < 5);
                    if (tenantProducts.length === 0) continue;

                    const tenantSettings = settings.find(s => s.vkn === tenant.vkn);
                    const email = tenantSettings?.email || tenant.email;

                    if (email) {
                        await sendLowStockEmail(email, tenantProducts);
                    }
                }
            } else {
                const pool = getPool();
                let tenants;
                try {
                    const [rows] = await pool.query("SELECT * FROM tenants WHERE status = 'Aktif'");
                    tenants = rows;
                } catch (dbError: any) {
                    console.error(`[Cron] Veritabanı bağlantı hatası: ${dbError.message}. Kontrol atlandı.`);
                    return;
                }
                
                for (const tenant of (tenants as any[])) {
                    try {
                        const [products] = await pool.query("SELECT * FROM products WHERE vkn = ? AND stock < 5", [tenant.vkn]);
                        
                        if ((products as any[]).length > 0) {
                            const [settingsRows] = await pool.query("SELECT email FROM settings WHERE vkn = ? LIMIT 1", [tenant.vkn]);
                            let email = tenant.email;
                            if ((settingsRows as any[]).length > 0 && (settingsRows as any[])[0].email) {
                                email = (settingsRows as any[])[0].email;
                            }
    
                            if (email) {
                                await sendLowStockEmail(email, products as any[]);
                            }
                        }
                    } catch (queryErr: any) {
                        console.error(`[Cron] ${tenant.vkn} için sorgu hatası:`, queryErr.message);
                    }
                }
            }
        } catch (e) {
            console.error('[Cron] Hata:', e);
        }
    });
}

async function sendLowStockEmail(email: string, products: any[]) {
    let html = `
        <h2 style="color: #ef4444; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 24px;">Düşük Stok Bildirimi</h2>
        <p style="margin-bottom: 24px;">Değerli müşterimiz,<br>Aşağıdaki ürünlerin stok seviyesi <b>kritik eşiğin (5 adet) altına</b> düşmüştür. Lütfen tedarik süreçlerinizi gözden geçirerek stoklarınızı güncelleyiniz.</p>
        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background-color: #fee2e2; color: #991b1b; text-align: left; font-size: 14px;">
                    <th style="padding: 12px 16px; border-bottom: 1px solid #fecaca; font-weight: 600;">Ürün Kodu</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #fecaca; font-weight: 600;">Ürün Adı</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #fecaca; font-weight: 600; text-align: right;">Kalan Stok</th>
                </tr>
            </thead>
            <tbody style="background-color: #ffffff;">
    `;

    products.forEach((p, index) => {
        const borderBottom = index !== products.length - 1 ? 'border-bottom: 1px solid #f3f4f6;' : '';
        html += `
            <tr style="font-size: 14px;">
                <td style="padding: 12px 16px; ${borderBottom} color: #4b5563; font-family: monospace;">${p.code || '-'}</td>
                <td style="padding: 12px 16px; ${borderBottom} color: #111827; font-weight: 500;">${p.name || '-'}</td>
                <td style="padding: 12px 16px; ${borderBottom} color: #ef4444; font-weight: 700; text-align: right;">${p.stock || 0} Adet</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        </div>
        <p style="margin-bottom: 0;">Esila Ticari Envanter Yönetim Sistemi üzerinden yeni tedarik girişlerinizi hızlıca yapabilirsiniz.</p>
    `;

    await sendMail(email, "Düşük Stok Bildirimi - Esila Ticari", html, false);
    console.log(`[Cron] ${email} adresine düşük stok maili gönderildi.`);
}
