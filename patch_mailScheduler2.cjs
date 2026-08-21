const fs = require('fs');
let code = fs.readFileSync('server/mailScheduler.ts', 'utf8');

const regex = /cron\.schedule\('0 9 \* \* \*', async \(\) => \{([\s\S]*?)\}\);/m;

const newCronBody = `
    cron.schedule('0 9 * * *', async () => {
        try {
            console.log('[Cron] Taksit hatırlatmaları kontrol ediliyor...');
            const today = new Date();
            today.setHours(0,0,0,0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const in3Days = new Date(today);
            in3Days.setDate(in3Days.getDate() + 3);

            if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) {
                const customers = getFallbackTable('customers');
                const settingsTable = getFallbackTable('settings');
                for (const c of customers) {
                    if (!c.email || !c.installments) continue;
                    
                    const tenantSettings = settingsTable.find(s => s.vkn === c.vkn) || {};
                    const remind3Days = tenantSettings.reminder_3_days_before ?? true;
                    const remind1Day = tenantSettings.reminder_1_day_before ?? true;
                    const remindOverdue = tenantSettings.reminder_overdue ?? true;
                    
                    let overdueInsts = [];
                    let oneDayInsts = [];
                    let threeDayInsts = [];
                    
                    c.installments.forEach(i => {
                        if (i.isPaid) return;
                        const dueDate = new Date(i.dueDate);
                        dueDate.setHours(0,0,0,0);
                        
                        const timeDiff = dueDate.getTime() - today.getTime();
                        const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));
                        
                        if (daysDiff < 0 && remindOverdue) overdueInsts.push(i);
                        else if (daysDiff === 1 && remind1Day) oneDayInsts.push(i);
                        else if (daysDiff === 3 && remind3Days) threeDayInsts.push(i);
                    });
                    
                    if (overdueInsts.length > 0) await sendInstallmentEmail(c.email, c, overdueInsts, 'overdue');
                    if (oneDayInsts.length > 0) await sendInstallmentEmail(c.email, c, oneDayInsts, 'upcoming_1');
                    if (threeDayInsts.length > 0) await sendInstallmentEmail(c.email, c, threeDayInsts, 'upcoming_3');
                }
            } else {
                const pool = getPool();
                try {
                    const [rows] = await pool.query("SELECT c.*, s.reminder_3_days_before, s.reminder_1_day_before, s.reminder_overdue FROM customers c LEFT JOIN settings s ON c.vkn = s.vkn WHERE c.email IS NOT NULL AND c.email != ''");
                    for (const row of rows) {
                        const c = row;
                        if (c.installments) {
                            let inst = [];
                            try {
                                inst = typeof c.installments === 'string' ? JSON.parse(c.installments) : c.installments;
                            } catch(e) {}
                            
                            const remind3Days = c.reminder_3_days_before ?? true;
                            const remind1Day = c.reminder_1_day_before ?? true;
                            const remindOverdue = c.reminder_overdue ?? true;
                            
                            let overdueInsts = [];
                            let oneDayInsts = [];
                            let threeDayInsts = [];
                            
                            inst.forEach(i => {
                                if (i.isPaid) return;
                                const dueDate = new Date(i.dueDate);
                                dueDate.setHours(0,0,0,0);
                                
                                const timeDiff = dueDate.getTime() - today.getTime();
                                const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));
                                
                                if (daysDiff < 0 && remindOverdue) overdueInsts.push(i);
                                else if (daysDiff === 1 && remind1Day) oneDayInsts.push(i);
                                else if (daysDiff === 3 && remind3Days) threeDayInsts.push(i);
                            });
                            
                            if (overdueInsts.length > 0) await sendInstallmentEmail(c.email, c, overdueInsts, 'overdue');
                            if (oneDayInsts.length > 0) await sendInstallmentEmail(c.email, c, oneDayInsts, 'upcoming_1');
                            if (threeDayInsts.length > 0) await sendInstallmentEmail(c.email, c, threeDayInsts, 'upcoming_3');
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

code = code.replace(regex, newCronBody.trim());

const newEmailFunction = `
async function sendInstallmentEmail(email: string, customer: any, installments: any[], type: 'overdue' | 'upcoming_1' | 'upcoming_3') {
    let title = type === 'overdue' ? 'Geciken Taksit Ödemesi Bildirimi' : 'Yaklaşan Taksit Ödemesi Bildirimi';
    let titleColor = type === 'overdue' ? '#ef4444' : '#f59e0b';
    let bgColor = type === 'overdue' ? '#fef2f2' : '#fffbeb';
    let borderColor = type === 'overdue' ? '#fee2e2' : '#fef3c7';
    let headerColor = type === 'overdue' ? '#991b1b' : '#b45309';

    let message = '';
    if (type === 'overdue') {
       message = \`Esila Ticari sistemimizde kayıtlı olan hesabınıza ait, vadesi geçmiş taksitleriniz bulunmaktadır. Ödemenizi gerçekleştirmenizi rica ederiz.\`;
    } else if (type === 'upcoming_1') {
       message = \`Esila Ticari sistemimizde kayıtlı olan hesabınıza ait, yarın vadesi dolacak olan taksitleriniz aşağıda listelenmiştir.\`;
    } else {
       message = \`Esila Ticari sistemimizde kayıtlı olan hesabınıza ait, 3 gün sonra vadesi dolacak olan taksitleriniz aşağıda listelenmiştir.\`;
    }

    let html = \`
        <h2 style="color: \${titleColor}; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 24px;">\${title}</h2>
        <p style="margin-bottom: 24px;">Sayın <b>\${customer.name || customer.companyName}</b>,<br>\${message}</p>
        <div style="background-color: \${bgColor}; border: 1px solid \${borderColor}; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background-color: \${borderColor}; color: \${headerColor}; text-align: left; font-size: 14px;">
                    <th style="padding: 12px 16px; border-bottom: 1px solid \${borderColor}; font-weight: 600;">Açıklama</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid \${borderColor}; font-weight: 600;">Vade Tarihi</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid \${borderColor}; font-weight: 600; text-align: right;">Tutar</th>
                </tr>
            </thead>
            <tbody style="background-color: #ffffff;">
    \`;
    let totalAmount = 0;
    installments.forEach((p, index) => {
        totalAmount += parseFloat(p.amount || 0);
        const bBottom = index !== installments.length - 1 ? 'border-bottom: 1px solid #f3f4f6;' : '';
        const formattedDate = new Date(p.dueDate).toLocaleDateString('tr-TR');
        const formattedAmount = parseFloat(p.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
        html += \`
            <tr style="font-size: 14px;">
                <td style="padding: 12px 16px; \${bBottom} color: #111827; font-weight: 500;">\${p.description || '-'}</td>
                <td style="padding: 12px 16px; \${bBottom} color: #4b5563; font-family: monospace;">\${formattedDate}</td>
                <td style="padding: 12px 16px; \${bBottom} color: \${titleColor}; font-weight: 700; text-align: right;">\${formattedAmount} ₺</td>
            </tr>
        \`;
    });
    
    const formattedTotalAmount = totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    html += \`
                <tr style="font-size: 14px;">
                    <td colspan="2" style="padding: 12px 16px; border-top: 2px solid \${borderColor}; color: \${headerColor}; font-weight: 700; text-align: right;">Toplam:</td>
                    <td style="padding: 12px 16px; border-top: 2px solid \${borderColor}; color: \${headerColor}; font-weight: 800; text-align: right;">\${formattedTotalAmount} ₺</td>
                </tr>
            </tbody>
        </table>
        </div>
        <p style="margin-bottom: 0;">Anlayışınız için teşekkür ederiz.</p>
    \`;
    await sendMail(email, title, html, false);
    console.log(\`[Cron] \${email} adresine \${type} taksit maili gönderildi.\`);
}
`;

code = code.replace(/async function sendOverdueInstallmentEmail[\s\S]*?console\.log\([^)]+\);\n\}/, newEmailFunction.trim());

fs.writeFileSync('server/mailScheduler.ts', code);
console.log("Patched server/mailScheduler.ts");
