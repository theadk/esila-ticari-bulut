import nodemailer from 'nodemailer';
import { getPool } from './db.js';

const transporter = nodemailer.createTransport({
  host: "mail.esilaticari.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  name: "esilaticari.com",
  auth: {
    user: "bilgilendirme@esilaticari.com",
    pass: "Korkmaz66**",
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const wrapEmail = (content: string) => {
  return `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
  <div style="background-color: #059669; padding: 24px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Esila Ticari</h1>
  </div>
  <div style="padding: 32px 24px; color: #374151; line-height: 1.6; font-size: 15px;">
    ${content}
  </div>
  <div style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
    <p style="margin: 0; margin-bottom: 8px;">Bu e-posta otomatik olarak Esila Ticari sistemi tarafından gönderilmiştir. Lütfen bu mesajı yanıtlamayınız.</p>
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} Esila Ticari. Tüm hakları saklıdır.</p>
  </div>
</div>
  `;
}

export const sendMail = async (to: string, subject: string, html: string, wrapped: boolean = true, attachments?: any[], vkn: string = '1111111111') => {
  try {
    const finalHtml = wrapped ? wrapEmail(html) : html;
    
    // Create plain text fallback to prevent spam filters from rejecting the email
    const plainText = finalHtml
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const info = await transporter.sendMail({
      from: '"Esila Ticari" <bilgilendirme@esilaticari.com>',
      to,
      subject,
      html: finalHtml,
      text: plainText,
      attachments,
    });
    console.log("Message sent: %s", info.messageId);

    // Log success
    try {
       const pool = getPool();
       await pool.query("INSERT INTO email_logs (id, vkn, recipient, subject, status, errorMessage) VALUES (?, ?, ?, ?, ?, ?)",
          [Date.now().toString() + Math.random().toString(36).substring(7), vkn, to, subject, 'Başarılı', null]
       );
    } catch(dbErr) { console.error("Error logging mail success:", dbErr); }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email: ", error);

    // Log failure
    try {
       const pool = getPool();
       await pool.query("INSERT INTO email_logs (id, vkn, recipient, subject, status, errorMessage) VALUES (?, ?, ?, ?, ?, ?)",
          [Date.now().toString() + Math.random().toString(36).substring(7), vkn, to, subject, 'Başarısız', String(error)]
       );
    } catch(dbErr) { console.error("Error logging mail failure:", dbErr); }

    return { success: false, error };
  }
};

