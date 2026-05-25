import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "mail.esilaticari.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "bilgilendirme@esilaticari.com",
    pass: "Korkmaz66**",
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const sendMail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: '"Esila Ticari" <bilgilendirme@esilaticari.com>',
      to,
      subject,
      html,
    });
    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email: ", error);
    return { success: false, error };
  }
};
