import PDFDocument from 'pdfkit';
import fs from 'fs';

const generateCustomPdfBuffer = async (title, contentArray) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      const regularFont = 'Helvetica';
      const boldFont = 'Helvetica-Bold';
      
      // Header
      doc.font(boldFont).fontSize(14).text("Esila", { align: 'center' });
      doc.font(regularFont).fontSize(10).text("esilaticari.com", { align: 'center' });
      doc.moveDown(2);
      
      doc.font(boldFont).fontSize(18).text(title, { align: 'center' });
      doc.moveDown(2);
      
      contentArray.forEach(item => {
          if (item.type === 'h1') {
              doc.font(boldFont).fontSize(14).text(item.text);
              doc.moveDown(0.5);
          } else if (item.type === 'h2') {
              doc.font(boldFont).fontSize(12).text(item.text, { align: 'center' });
              doc.moveDown(0.5);
          } else if (item.type === 'p') {
              doc.font(regularFont).fontSize(11).text(item.text, { align: 'left' });
              doc.moveDown(0.5);
          } else if (item.type === 'li') {
              doc.font(regularFont).fontSize(11).text(`• ${item.text}`, { indent: 20 });
              doc.moveDown(0.2);
          }
      });
      
      doc.end();
    } catch(e) {
      reject(e);
    }
  });
};

const run = async () => {
    const gizlilikText = [
        {type: 'h2', text: 'Esila Ticari'},
        {type: 'p', text: 'Update: 2026'},
        {type: 'h1', text: '1. GIRIS'},
        {type: 'p', text: 'Giris metni'},
    ];
    const pdf = await generateCustomPdfBuffer("GİZLİLİK POLİTİKASI", gizlilikText);
    fs.writeFileSync('test.pdf', pdf);
    console.log("Wrote test.pdf");
}

run();
