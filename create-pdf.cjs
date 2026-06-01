const fs = require('fs');
const PDFDocument = require('pdfkit');

function trToEn(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U');
}

async function generatePDF() {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream('public/gecmis-promtlar.pdf'));
  
  doc.fontSize(20).text('Gecmis Promtlar (Sohbet Gecmisi)', { align: 'center' });
  doc.moveDown();

  const files = fs.readdirSync('migrated_prompt_history');
  for (const file of files) {
    if (file.endsWith('.json')) {
      const content = fs.readFileSync('migrated_prompt_history/' + file, 'utf8');
      try {
        const data = JSON.parse(content);
        for (const entry of data) {
          if (entry.author === 'user') {
            doc.fontSize(14).fillColor('blue').text('Kullanici (User):');
            doc.fontSize(12).fillColor('black').text(trToEn(entry.payload.text || '(Bos/Dosya ekli)'));
            doc.moveDown();
          } else if (entry.author === 'model') {
             let text = '';
             if (entry.payload.type === 'thinking') {
               text = '[MODEL DUSUNCESI]\n' + (entry.payload.text || '');
             } else if (entry.payload.type === 'generationTable') {
               text = '[MODEL KOD URETIMI] - ' + (entry.payload.entries?.map(e => e.path).join(', ') || '');
             } else if (entry.payload.text) {
               text = entry.payload.text;
             }

             if (text) {
               doc.fontSize(14).fillColor('green').text('Asistan (Model):');
               let safeText = trToEn(text);
               doc.fontSize(12).fillColor('black').text(safeText.length > 5000 ? safeText.substring(0, 5000) + '... (metin cok uzun oldugu icin kisaltildi)' : safeText);
               doc.moveDown();
             }
          }
        }
      } catch (e) {
        doc.fontSize(12).fillColor('red').text('Dosya okunurken hata olustu: ' + file);
      }
    }
  }

  doc.end();
  console.log('PDF hazirlandi.');
}

generatePDF();
