const fs = require('fs');

let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');

const searchHtml = `    const html = \`
      <html>
        <head>
          <title>\${title}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; margin: 0 auto; max-width: 800px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 24px; color: #1f2937; letter-spacing: 1px; }
            .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
            .content { display: flex; flex-direction: column; gap: 20px; }
            .row { display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding: 10px 0; }
            .label { font-weight: bold; color: #4b5563; }
            .value { color: #111827; }
            .amount-box { text-align: right; margin-top: 30px; padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
            .amount-box .total { font-size: 24px; font-weight: bold; color: #059669; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; }
            .signature { width: 200px; border-top: 1px solid #9ca3af; padding-top: 10px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>\${title}</h1>
            <p>Tarih: \${new Date(tx.date).toLocaleDateString('tr-TR')}</p>
            <p>Makbuz No: \${tx.id.toUpperCase()}</p>
          </div>
          <div class="content">
            <div class="row">
              <span class="label">Cari Ünvanı / Adı:</span>
              <span class="value">\${customer.companyName || customer.name}</span>
            </div>
            <div class="row">
              <span class="label">Açıklama:</span>
              <span class="value">\${tx.description || '-'}</span>
            </div>
            <div class="row">
              <span class="label">İşlem Tipi:</span>
              <span class="value">\${tx.type}</span>
            </div>
          </div>
          <div class="amount-box">
            <div class="label">İşlem Tutarı</div>
            <div class="total">\${amountAbs} ₺</div>
          </div>
          <div class="footer">
            <div class="signature">Müşteri Kaşe/İmza</div>
            <div class="signature">Firma Yetkilisi İmza</div>
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    \`;`;

const replaceHtml = `    const html = \`
      <html>
        <head>
          <title>\${title}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              color: #000; 
              width: 80mm; 
              margin: 0; 
              padding: 5mm; 
              font-size: 14px;
              box-sizing: border-box;
            }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px; }
            .header h1 { margin: 0; font-size: 18px; font-weight: bold; }
            .header p { margin: 2px 0 0; font-size: 12px; }
            .content { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
            .row { display: flex; justify-content: space-between; border-bottom: 1px dotted #000; padding: 2px 0; font-size: 12px; }
            .label { font-weight: bold; }
            .value { text-align: right; max-width: 60%; word-wrap: break-word; }
            .amount-box { text-align: center; margin-top: 10px; padding: 10px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; }
            .amount-box .label { font-size: 14px; margin-bottom: 5px; }
            .amount-box .total { font-size: 20px; font-weight: bold; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; }
            .signature { margin-top: 30px; border-top: 1px dashed #000; padding-top: 5px; width: 80%; margin-left: auto; margin-right: auto; }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>\${title}</h1>
            <p>Tarih: \${new Date(tx.date).toLocaleDateString('tr-TR')}</p>
            <p>No: \${tx.id.toUpperCase()}</p>
          </div>
          <div class="content">
            <div class="row">
              <span class="label">Cari:</span>
              <span class="value">\${customer.companyName || customer.name}</span>
            </div>
            <div class="row">
              <span class="label">Açıklama:</span>
              <span class="value">\${tx.description || '-'}</span>
            </div>
            <div class="row">
              <span class="label">İşlem:</span>
              <span class="value">\${tx.type}</span>
            </div>
          </div>
          <div class="amount-box">
            <div class="label">İşlem Tutarı</div>
            <div class="total">\${amountAbs} ₺</div>
          </div>
          <div class="footer">
            <p>Bizi tercih ettiğiniz için teşekkür ederiz.</p>
            <div class="signature">Yetkili İmza</div>
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    \`;`;

code = code.replace(searchHtml, replaceHtml);
fs.writeFileSync('pages/Cariler.tsx', code);
console.log("Patched to 80mm format");
