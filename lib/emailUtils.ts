export const parseEmailTemplate = (template: string, variables: Record<string, string | number>) => {
  if (!template) return '';
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, String(value));
  }
  return result;
};

export const defaultTemplates = {
  customer_statement: `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
  <h2 style="color: #333;">Merhaba {MUSTERI_ADI},</h2>
  
  <p style="color: #555; line-height: 1.6;">
    <strong>{TARIH}</strong> tarihi itibarıyla güncel bakiye bilginiz aşağıda yer almaktadır:
  </p>
  
  <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #eee;">
    <span style="font-size: 14px; color: #6b7280;">Bakiye</span>
    <div style="font-size: 24px; font-weight: bold; color: #10b981; margin-top: 5px;">
      {BAKIYE}
    </div>
  </div>
  
  <p style="color: #777; font-size: 14px;">
    Hesap ekstresi detaylarını incelemek isterseniz veya mutabık olmadığınız bir durum varsa lütfen bizimle iletişime geçin.
  </p>
  
  <hr style="border: none; border-top: 1px dashed #ddd; margin: 25px 0;">
  
  <div style="font-size: 14px; color: #888;">
    <p style="margin: 0;">Saygılarımızla,</p>
    <p style="margin: 5px 0 0 0; font-weight: bold; color: #555;">{FIRMA_ADI}</p>
    <p style="margin: 3px 0 0 0; color: #777; font-size: 13px;">{FIRMA_ADRES}</p>
    <p style="margin: 3px 0 0 0; color: #777; font-size: 13px;">Tel: {FIRMA_TELEFON} | E-posta: {FIRMA_MAIL}</p>
    <p style="margin: 3px 0 0 0; color: #777; font-size: 13px;">VD: {FIRMA_VERGI_DAIRESI} / VKN: {FIRMA_VKN}</p>
  </div>
</div>
  `,
  reconciliation: `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
  <h2 style="color: #333;">Sayın {MUSTERI_ADI},</h2>
  
  <p style="color: #555; line-height: 1.6;">
    VUK 329. maddesi gereğince, karşılıklı mutabakat sağlamak amacıyla hesaplarımız incelenmiş olup, <strong>{TARIH}</strong> tarihi itibarıyla bakiyeniz aşağıdaki gibidir:
  </p>
  
  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; text-align: center;">
     <div style="font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">MUTABAKAT BAKİYESİ</div>
     <div style="font-size: 28px; font-weight: bold; color: #0f172a; margin: 10px 0;">{BAKIYE}</div>
     <div style="font-size: 15px; font-weight: 500; color: #3b82f6;">( {BAKIYE_TIPI} )</div>
  </div>
  
  <p style="color: #555; font-size: 14px; line-height: 1.6;">
    Lütfen hesaplarınızı kontrol ederek, mutabık olup olmadığınızı bildiriniz.
  </p>
  
  <div style="margin-top: 30px;">
    <a href="{MUTABAKAT_LINKI}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Mutabakatı Yanıtla</a>
  </div>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <div style="font-size: 13px; color: #94a3b8;">
    <p style="margin: 0;">Saygılarımızla,</p>
    <p style="margin: 4px 0 0 0; font-weight: 600; color: #64748b;">{FIRMA_ADI}</p>
    <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px;">{FIRMA_ADRES}</p>
    <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px;">Tel: {FIRMA_TELEFON} | E-posta: {FIRMA_MAIL}</p>
    <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px;">VD: {FIRMA_VERGI_DAIRESI} / VKN: {FIRMA_VKN}</p>
  </div>
</div>
  `,
  personnel: `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
  <h2 style="color: #333;">Sayın {PERSONEL_ADI},</h2>
  
  <p style="color: #555; line-height: 1.6;">
    <strong>{AY_YIL}</strong> dönemi e-bordronuz hakkında bilgilendirmedir. Bu döneme ait hesabınıza yatırılan net tutar aşağıdaki gibidir:
  </p>
  
  <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #eee;">
    <span style="font-size: 14px; color: #6b7280;">Net Ödenen Tutar</span>
    <div style="font-size: 24px; font-weight: bold; color: #10b981; margin-top: 5px;">
      {NET_ODENEN}
    </div>
  </div>
  
  <p style="color: #777; font-size: 14px;">
    Tüm maaş ve kesinti detaylarını çalıştığınız kurumun ilgili ekranlarından inceleyebilirsiniz.
  </p>
  
  <hr style="border: none; border-top: 1px dashed #ddd; margin: 25px 0;">
  
  <div style="font-size: 14px; color: #888;">
    <p style="margin: 0;">İyi çalışmalar dileriz,</p>
    <p style="margin: 5px 0 0 0; font-weight: bold; color: #555;">{FIRMA_ADI}</p>
  </div>
</div>
  `,
  maintenance_reminder: `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
  <h2 style="color: #333;">Sayın {MUSTERI_ADI},</h2>
  
  <p style="color: #555; line-height: 1.6;">
    {TARIH} tarihinde onarımı tamamlanan <strong>{CIHAZ}</strong> cihazınızın periyodik bakım süresi gelmiştir.
  </p>
  
  <p style="color: #555; font-size: 14px; line-height: 1.6;">
    Cihazınızın uzun ömürlü olması ve verimli çalışmaya devam etmesi için bakım randevusu almanızı tavsiye ederiz.
  </p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <div style="font-size: 13px; color: #94a3b8;">
    <p style="margin: 0;">Saygılarımızla,</p>
    <p style="margin: 4px 0 0 0; font-weight: 600; color: #64748b;">{FIRMA_ADI}</p>
  </div>
</div>
  `
};
