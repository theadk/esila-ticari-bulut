export const parseEmailTemplate = (template: string, variables: Record<string, string | number>) => {
  if (!template) return '';
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    // Replace all occurrences of {KEY} with value
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, String(value));
  }
  return result;
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
