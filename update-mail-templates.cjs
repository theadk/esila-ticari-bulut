const fs = require('fs');

function replaceTemplates(file) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');

    // 1. /api/test-email
    code = code.replace(
        '"<p>Sınama maili başarıyla alındı. Mail ayarlarınız doğru bir biçimde çalışmaktadır.</p>"',
        '`\n        <h2 style="color: #059669; font-size: 20px; font-weight: 600; margin-top: 0;">Test E-Postası Başarılı</h2>\n        <p>Merhaba, bu e-posta sistemden otomatik olarak gönderilen bir test mesajıdır.</p>\n        <p>E-posta gönderim altyapınızın <b>sorunsuz bir şekilde çalıştığını</b> teyit ederiz.</p>\n        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; color: #166534; font-weight: 500; margin-top: 16px;">✅ Sistem şu an e-posta göndermeye hazırdır.</div>\n        `'
    );

    // 2. /api/reconciliations/:id/send
    code = code.replace(
        /<div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">(.*?)<\/div>/s,
        `<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 24px;">Sayın \${mutabakat.customerName},</h2>
<p style="margin-bottom: 16px;">Firmanız ile olan cari hesap mutabakatımıza göre, kayıtlarımızda bulunan bakiye bilginiz aşağıdaki gibidir:</p>

<div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding-bottom: 8px; color: #6b7280; font-weight: 500;">Tarih:</td>
                <td style="padding-bottom: 8px; font-weight: 600; text-align: right;">\${new Date().toLocaleDateString('tr-TR')}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 8px; color: #6b7280; font-weight: 500;">Bakiye Tipi:</td>
                <td style="padding-bottom: 8px; font-weight: 600; text-align: right;">\${mutabakat.balance > 0 ? "Alacaklıyız" : (mutabakat.balance < 0 ? "Borçluyuz" : "Bakiye Yok")}</td>
            </tr>
            <tr>
                <td style="border-top: 1px solid #d1d5db; padding-top: 12px; color: #374151; font-weight: 600; font-size: 16px;">Mutabakat Bakiyesi:</td>
                <td style="border-top: 1px solid #d1d5db; padding-top: 12px; font-weight: 700; text-align: right; font-size: 18px; color: #059669;">\${Math.abs(mutabakat.balance).toLocaleString('tr-TR')} TL</td>
            </tr>
        </table>
    </div>
</div>

<p style="margin-bottom: 24px;">Lütfen bakiyeyi kendi kayıtlarınızla kontrol ederek mutabakat durumunuzu bize bildiriniz.</p>

<div style="display: block; width: 100%; gap: 16px; margin-bottom: 32px;">
    <a href="\${mutabakatLink}/approve" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 15px; margin-right: 12px; margin-bottom: 8px; text-align: center;">Kabul Et ve Onayla</a>
    <a href="\${mutabakatLink}/reject" style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 15px; margin-bottom: 8px; text-align: center;">Reddet ve İtiraz İlet</a>
</div>

<p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">Mutabakat konusunda sorularınız varsa veya bakiye ile ilgili itirazınız bulunuyorsa yukarıdaki bağlantıları kullanabilirsiniz.</p>`
    );

    // 3. Şifreniz Sıfırlandı
    code = code.replace(
        /\`<p>Sayın \$\{tenant\.name\},<\/p><p>Sistem yöneticiniz tarafından şifreniz sıfırlanmıştır\.<\/p><p><b>Yeni Şifreniz:<\/b> \$\{newAdminPass\}<\/p>\`/g,
        `\`<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Sayın \${tenant.name},</h2>
<p style="margin-bottom: 16px;">Sistem yöneticiniz tarafından hesabınızın şifresi güvenlik amacıyla sıfırlanmıştır. Oluşturulan yeni şifreniz ile sisteme giriş yapabilirsiniz.</p>

<div style="background-color: #f3f4f6; border-left: 4px solid #059669; padding: 16px; margin-bottom: 24px;">
<p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Yeni Şifreniz</p>
<p style="margin: 8px 0 0 0; font-size: 24px; font-family: monospace; font-weight: 700; color: #111827;">\${newAdminPass}</p>
</div>

<p style="color: #dc2626; font-size: 14px; margin-bottom: 8px; font-weight: 500;">⚠️ Güvenlik Uyarısı:</p>
<ul style="color: #4b5563; font-size: 14px; padding-left: 20px; margin-top: 0;">
<li>Sisteme giriş yaptıktan sonra şifrenizi ayarlar menüsünden lütfen değiştiriniz.</li>
<li>Bu şifreyi kimseyle paylaşmayınız.</li>
</ul>\``
    );

    // 4. Yeni Kayıt Talebi
    code = code.replace(
        /\`<p>Sayın \$\{tenantName\},<\/p><p>Esila Ticari'ye kayıt talebiniz alınmıştır\. Hesabınız yöneticilerimiz tarafından incelendikten sonra aktive edilecek ve tarafınıza tekrar bilgi verilecektir\.<\/p>\`/g,
        `\`<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Sayın \${tenantName},</h2>
<p style="margin-bottom: 16px;">Esila Ticari Yönetim Sistemi'ne kayıt talebiniz başarıyla bize ulaşmıştır. Bizi tercih ettiğiniz için teşekkür ederiz.</p>

<div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
    <h3 style="color: #1e40af; margin-top: 0; font-size: 16px;">Sırada Ne Var?</h3>
    <p style="color: #1e3a8a; margin-bottom: 0;">Müşteri temsilcilerimiz şu anda firma bilgilerinizi inceliyor. İnceleme işlemi tamamlandığında, hesabınız aktive edilecek ve size <b>yeni bir bilgilendirme e-postası</b> gönderilecektir.</p>
</div>

<p style="margin-bottom: 8px;">Hesabınızın onay süreci tamamlandığında göndereceğimiz e-posta içerisinde sisteme giriş yapabilmeniz için gereken yönetici şifreniz bulunacaktır.</p>\``
    );

    // 5. Hesabınız Aktive Edildi
    const activeRegex = /const passInfo = adminPassword \? \(\`<p>Sisteme giriş yapabilirsiniz\.<\/p><p><b>Kullanıcı Adı:<\/b> \$\{req\.params\.vkn\}<br><b>Şifre:<\/b> \$\{adminPassword\}<\/p>\`\) : '<p>Sisteme giriş yapabilirsiniz\.<\/p>';\s*if \(tenantEmail\) \{\s*await sendMail\(\s*tenantEmail,\s*"Hesabınız Aktive Edildi - Esila Ticari",\s*\`<p>Sayın \$\{tenantName\},<\/p><p>Esila Ticari üyeliğiniz başarıyla onaylanmış ve hesabınız aktive edilmiştir\.<\/p>\$\{passInfo\}\`\s*\);\s*\}/gm;

    const activeReplacement = `let passInfoHTML = '';
         if (adminPassword) {
            passInfoHTML = \`
              <p style="margin-top: 24px; margin-bottom: 8px; font-weight: 500; color: #374151;">Aşağıdaki yönetici bilgileri ile sisteme güvenle giriş yapabilirsiniz:</p>
              <div style="background-color: #f3f4f6; border-left: 4px solid #059669; padding: 16px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px;">
                 <div>
                    <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Kullanıcı Adı (T.C./VKN)</p>
                    <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 600; color: #111827;">\${req.params.vkn}</p>
                 </div>
                 <div>
                    <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Şifre</p>
                    <p style="margin: 4px 0 0 0; font-size: 18px; font-family: monospace; font-weight: 700; color: #111827;">\${adminPassword}</p>
                 </div>
              </div>
            \`;
         } else {
             passInfoHTML = '<p style="margin-top: 24px; margin-bottom: 24px;">Sisteme giriş yapabilirsiniz.</p>';
         }
         
         if (tenantEmail) {
            await sendMail(
              tenantEmail,
              "Hesabınız Aktive Edildi - Esila Ticari",
              \`<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Tebrikler Sayın \${tenantName},</h2>
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <p style="color: #166534; font-weight: 500; margin: 0;">Esila Ticari üyeliğiniz yönetimimiz tarafından incelenmiş ve <b>başarıyla onaylanarak aktive edilmiştir.</b></p>
              </div>
              <p>Firmamızın dijital ürün ailesine hoş geldiniz. Bütün ön muhasebe ihtiyaçlarınızı hızlı, güvenli ve bulut üzerinden kesintisiz yürütebilirsiniz.</p>
              \${passInfoHTML}
              <p style="color: #6b7280; font-size: 14px;">Güvenliğiniz için ilk girişten sonra şifrenizi sağ üst köşedeki profil veya ayarlar menüsünden değiştirmenizi öneririz.</p>\`
            );
         }`;

    code = code.replace(activeRegex, activeReplacement);

    // 6. Başvurunuz Reddedildi
    code = code.replace(
        /\`<p>Sayın \$\{tenantName\},<\/p><p>Esila Ticari lisans başvurunuz onaylanmamıştır ve reddedilmiştir\. İlginiz için teşekkür ederiz\.<\/p>\`/g,
        `\`<h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Sayın \${tenantName},</h2>
<p style="margin-bottom: 16px;">Esila Ticari lisans başvurunuz ekiplerimiz tarafından değerlendirilmiş, ancak maalesef şu aşamada <b>onaylanamamıştır</b>.</p>

<p style="margin-bottom: 24px;">Lisans ve kullanım koşulları politikalarımız gereği başvurunuz uygun görülmemiş veya sisteme giriş kapasitelerimiz dolmuş olabilir.</p>

<div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
    <p style="color: #991b1b; margin: 0; font-size: 14px;">Sistemimize göstermiş olduğunuz ilgiden dolayı teşekkür ederiz. İlerleyen tarihlerde dilediğiniz zaman tekrar kayıt başvurusunda bulunabilirsiniz.</p>
</div>\``
    );

    fs.writeFileSync(file, code);
}

replaceTemplates('server.ts');
replaceTemplates('server2.ts');
console.log('Update finished.');
