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
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
  <div style="background-color: #0c4a6e; padding: 24px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">{FIRMA_ADI}</h1>
  </div>
  
  <div style="padding: 32px 24px;">
    <h2 style="color: #1e293b; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Sayın {MUSTERI_ADI},</h2>
    <p style="color: #475569; line-height: 1.6; margin-bottom: 24px;">
      <b>{TARIH}</b> tarihi itibarıyla güncel cari hesap ekstresi özetiniz aşağıda yer almaktadır. Hesaplarınızın mutabakatı ve güncelliği için bu gönderim sistemimiz tarafından otomatik olarak sağlanmaktadır.
    </p>
    
    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 28px; text-align: center;">
      <p style="margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Güncel Bakiye Durumu</p>
      <p style="font-size: 32px; font-weight: 700; color: #0284c7; margin: 8px 0 0 0;">{BAKIYE}</p>
    </div>
    
    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
      Hesap ekstresi hareketlerinin detaylarını incelemek isterseniz veya mutabık olmadığınız bir durum söz konusuysa, lütfen finans birimimiz ile iletişime geçiniz. 
    </p>
    
    <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 32px 0;">
    
    <div style="font-size: 13px; color: #64748b; background-color: #f1f5f9; padding: 16px; border-radius: 8px;">
      <p style="margin: 0; font-weight: 600; color: #334155; margin-bottom: 8px;">İletişim Bilgilerimiz:</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr><td style="padding: 4px 0; font-weight: 500; width: 80px;">Adres:</td><td style="padding: 4px 0;">{FIRMA_ADRES}</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 500;">Tel:</td><td style="padding: 4px 0;">{FIRMA_TELEFON}</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 500;">E-posta:</td><td style="padding: 4px 0;"><a href="mailto:{FIRMA_MAIL}" style="color: #0284c7; text-decoration: none;">{FIRMA_MAIL}</a></td></tr>
        <tr><td style="padding: 4px 0; font-weight: 500;">VD / VKN:</td><td style="padding: 4px 0;">{FIRMA_VERGI_DAIRESI} / {FIRMA_VKN}</td></tr>
      </table>
    </div>
  </div>
</div>
  `,
  reconciliation: `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
  <div style="background-color: #0f766e; padding: 24px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Cari Hesap Mutabakat Formu</h1>
  </div>
  
  <div style="padding: 32px 24px;">
    <h2 style="color: #1e293b; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Sayın {MUSTERI_ADI},</h2>
    
    <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
      VUK 329. maddesi gereğince, karşılıklı mutabakat sağlamak amacıyla hesaplarımız incelenmiş olup, <b>{TARIH}</b> tarihi itibarıyla kayıtlarımızdaki bakiyeniz aşağıdaki tablo şeklinde bilginize sunulmuştur:
    </p>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
       <tr style="background-color: #f8fafc;">
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600; font-size: 14px; width: 40%;">Tarih:</td>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600; font-size: 15px; text-align: right;">{TARIH}</td>
       </tr>
       <tr style="background-color: #ffffff;">
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600; font-size: 14px;">Bakiye Yönü:</td>
          <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; color: #0f766e; font-weight: 600; font-size: 15px; text-align: right;">{BAKIYE_TIPI}</td>
       </tr>
       <tr style="background-color: #f0fdf4;">
          <td style="padding: 16px; color: #166534; font-weight: 600; font-size: 16px;">Mutabakat Bakiyesi:</td>
          <td style="padding: 16px; color: #166534; font-weight: 700; font-size: 18px; text-align: right;">{BAKIYE}</td>
       </tr>
    </table>
    
    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
      Lütfen kendi kayıtlarınızı kontrol ederek, bakiye durumunda mutabık olup olmadığınızı aşağıdaki dijital onay sistemi üzerinden bize bildiriniz.
    </p>
    
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="{MUTABAKAT_LINKI}" style="background-color: #0f766e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(15, 118, 110, 0.2);">Mutabakatı Yanıtla</a>
    </div>
    
    <div style="font-size: 13px; color: #64748b; background-color: #f8fafc; padding: 16px; border-radius: 8px;">
      <p style="margin: 0; font-weight: 600; color: #334155; margin-bottom: 8px;">Gönderici Firma Bilgileri:</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr><td style="padding: 4px 0; font-weight: 500; width: 60px;">Firma:</td><td style="padding: 4px 0; font-weight: 600; color: #0f172a;">{FIRMA_ADI}</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 500;">Adres:</td><td style="padding: 4px 0;">{FIRMA_ADRES}</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 500;">İletişim:</td><td style="padding: 4px 0;">{FIRMA_TELEFON} | {FIRMA_MAIL}</td></tr>
      </table>
    </div>
  </div>
</div>
  `,
  personnel: `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
  <div style="background-color: #4338ca; padding: 24px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">E-Bordro Bilgilendirmesi</h1>
  </div>
  
  <div style="padding: 32px 24px;">
    <h2 style="color: #1e293b; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Sayın {PERSONEL_ADI},</h2>
    
    <p style="color: #475569; line-height: 1.6; margin-bottom: 24px;">
      <b>{AY_YIL}</b> dönemine ait personel maaş e-bordronuz hakkında bilgilendirmedir. Bu döneme ait hesabınıza yatırılan net istihkak tutarınız aşağıda belirtilmiştir:
    </p>
    
    <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
      <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Aylık Net Ödenen Tutar</p>
      <p style="font-size: 32px; font-weight: 700; color: #4338ca; margin: 8px 0 0 0;">{NET_ODENEN}</p>
    </div>
    
    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
      Tüm brüt gelir, fazla mesai, prim ve yasal kesinti detaylarını (SGK, Gelir Vergisi vb.) çalıştığınız kurumun ilgili insan kaynakları self-servis ekranlarından veya detaylı e-bordro dokümanınızdan inceleyebilirsiniz.
    </p>
    
    <div style="font-size: 14px; color: #64748b; background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center;">
      <p style="margin: 0;">İyi çalışmalar dileriz,</p>
      <p style="margin: 8px 0 0 0; font-weight: 600; color: #334155; font-size: 16px;">{FIRMA_ADI}</p>
    </div>
  </div>
</div>
  `,
  maintenance_reminder: `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
  <div style="background-color: #ea580c; padding: 24px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Cihaz Bakım Hatırlatması</h1>
  </div>
  
  <div style="padding: 32px 24px;">
    <h2 style="color: #1e293b; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Sayın {MUSTERI_ADI},</h2>
    
    <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
      Daha önce <b>{TARIH}</b> tarihinde onarımı veya bakımı tamamlanan <strong>{CIHAZ}</strong> cihazınızın periyodik bakım süresi yaklaşmıştır.
    </p>
    
    <div style="background-color: #fff7ed; border: 1px solid #fed7aa; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="color: #c2410c; margin: 0; font-weight: 500; font-size: 15px;">
        💡 <b>Neden periyodik bakım yaptırmalısınız?</b><br>
        Cihazınızın uzun ömürlü olması, garanti şartlarının korunması, beklenmedik anlarda arıza vermemesi ve yüksek verimlilikle çalışmaya devam etmesi için bakımlarını aksatmamak büyük önem taşır.
      </p>
    </div>
    
    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
      Uzman teknik ekibimizden randevu almak veya cihazınızın son durumu hakkında danışmak için bizimle iletişime geçebilirsiniz.
    </p>
    
    <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 32px 0;">
    
    <div style="font-size: 14px; color: #64748b; text-align: center;">
      <p style="margin: 0;">Saygılarımızla,</p>
      <p style="margin: 8px 0 0 0; font-weight: 600; color: #0f172a; font-size: 16px;">{FIRMA_ADI}</p>
    </div>
  </div>
</div>
  `
};
