const fs = require('fs');
let code = fs.readFileSync('server/mailScheduler.ts', 'utf8');

const newCronCode = `
    // Geciken taksitleri kontrol et (her sabah 09:00)
    cron.schedule('0 9 * * *', async () => {
        try {
            console.log('[Cron] Geciken taksitler kontrol ediliyor...');
            if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
                const customers = getFallbackTable('customers');
                for (const c of customers) {
                    if (!c.email || !c.installments) continue;
                    let overdueInstallments = c.installments.filter(i => !i.isPaid && new Date(i.dueDate) < new Date());
                    if (overdueInstallments.length > 0) {
                        await sendOverdueInstallmentEmail(c.email, c, overdueInstallments);
                    }
                }
            } else {
                const pool = getPool();
                try {
                    const [customers] = await pool.query("SELECT * FROM customers WHERE email IS NOT NULL AND email != ''");
                    for (const c of customers) {
                        if (c.installments) {
                            let inst = [];
                            try {
                                inst = typeof c.installments === 'string' ? JSON.parse(c.installments) : c.installments;
                            } catch(e) {}
                            
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            
                            let overdueInstallments = inst.filter(i => !i.isPaid && new Date(i.dueDate) < today);
                            if (overdueInstallments.length > 0) {
                                await sendOverdueInstallmentEmail(c.email, c, overdueInstallments);
                            }
                        }
                    }
                } catch (dbError) {
                    console.error("[Cron] Taksit kontrol hatası:", dbError.message);
                }
            }
        } catch (e) {
            console.error('[Cron] Taksit Hatası:', e);
        }
    });
`;

const overdueEmailFunction = `
async function sendOverdueInstallmentEmail(email, customer, overdueInstallments) {
    let html = \`
        <h2 style="color: #ef4444; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 24px;">Geciken Taksit Ödemesi Bildirimi</h2>
        <p style="margin-bottom: 24px;">Sayın <b>\${customer.name || customer.companyName}</b>,<br>Esila Ticari sistemimizde kayıtlı olan hesabınıza ait, vadesi geçmiş taksitleriniz bulunmaktadır. Ödemenizi gerçekleştirmenizi rica ederiz.</p>
        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background-color: #fee2e2; color: #991b1b; text-align: left; font-size: 14px;">
                    <th style="padding: 12px 16px; border-bottom: 1px solid #fecaca; font-weight: 600;">Açıklama</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #fecaca; font-weight: 600;">Vade Tarihi</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #fecaca; font-weight: 600; text-align: right;">Tutar</th>
                </tr>
            </thead>
            <tbody style="background-color: #ffffff;">
    \`;
    let totalAmount = 0;
    overdueInstallments.forEach((p, index) => {
        totalAmount += parseFloat(p.amount || 0);
        const borderBottom = index !== overdueInstallments.length - 1 ? 'border-bottom: 1px solid #f3f4f6;' : '';
        const formattedDate = new Date(p.dueDate).toLocaleDateString('tr-TR');
        const formattedAmount = parseFloat(p.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
        html += \`
            <tr style="font-size: 14px;">
                <td style="padding: 12px 16px; \${borderBottom} color: #111827; font-weight: 500;">\${p.description || '-'}</td>
                <td style="padding: 12px 16px; \${borderBottom} color: #4b5563; font-family: monospace;">\${formattedDate}</td>
                <td style="padding: 12px 16px; \${borderBottom} color: #ef4444; font-weight: 700; text-align: right;">\${formattedAmount} ₺</td>
            </tr>
        \`;
    });
    
    const formattedTotalAmount = totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    html += \`
                <tr style="font-size: 14px;">
                    <td colspan="2" style="padding: 12px 16px; border-top: 2px solid #fecaca; color: #991b1b; font-weight: 700; text-align: right;">Toplam Geciken:</td>
                    <td style="padding: 12px 16px; border-top: 2px solid #fecaca; color: #991b1b; font-weight: 800; text-align: right;">\${formattedTotalAmount} ₺</td>
                </tr>
            </tbody>
        </table>
        </div>
        <p style="margin-bottom: 0;">Anlayışınız için teşekkür ederiz.</p>
    \`;
    await sendMail(email, "Geciken Taksit Ödemesi Bildirimi", html, false);
    console.log(\`[Cron] \${email} adresine geciken taksit maili gönderildi.\`);
}
`;

code = code.replace("    });\n}", "    });\n" + newCronCode + "}\n\n" + overdueEmailFunction);
fs.writeFileSync('server/mailScheduler.ts', code);
console.log("Patched mailScheduler.ts");
