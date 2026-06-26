export const generateThermalReceiptHtml = (data: {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  taxOffice?: string;
  taxNumber?: string;
  companyLogo?: string;
  date: string;
  receiptNumber?: string;
  customerName?: string;
  items: Array<{ name: string; quantity: number; price: number; total: number; discount?: number }>;
  subTotal?: number;
  taxTotal?: number;
  total: number;
  paymentMethod?: string;
  footerText?: string;
  headerText?: string;
  settings?: any; // To access the new ReceiptTemplate settings
}) => {
  const settings = data.settings || {};
  
  const logoPosition = settings.receiptTemplate_logoPosition || 'center';
  const logoSize = settings.receiptTemplate_logoSize || 200;
  const showTaxInfo = settings.receiptTemplate_showTaxInfo !== false;
  const showAddress = settings.receiptTemplate_showAddress !== false;
  const showPhone = settings.receiptTemplate_showPhone !== false;
  const fontSize = settings.receiptTemplate_fontSize || '12px';
  const paperWidth = settings.receiptTemplate_paperWidth || '300px';

  let logoHtml = '';
  if (data.companyLogo && logoPosition !== 'hidden') {
    const textAlign = logoPosition === 'left' ? 'left' : (logoPosition === 'right' ? 'right' : 'center');
    logoHtml = `<div style="text-align: ${textAlign}; margin-bottom: 10px;"><img src="${data.companyLogo}" style="max-width: ${logoSize}px; max-height: 100px;" alt="Logo" /></div>`;
  }

  const paperSizeCSS = paperWidth === '200px' ? '58mm' : paperWidth === '300px' ? '80mm' : paperWidth === '400px' ? '100mm' : paperWidth === '500px' ? '120mm' : 'auto';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Bilgi Fişi</title>
        <style>
           @page { margin: 0; size: ${paperSizeCSS} auto; }
           body { 
             font-family: 'Courier New', Courier, monospace; 
             font-size: ${fontSize}; 
             width: ${paperWidth};
             margin: 0 auto;
             padding: 10px;
             color: #000; 
             box-sizing: border-box;
             line-height: 1.2;
           }
           .text-center { text-align: center; }
           .text-right { text-align: right; }
           .font-bold { font-weight: bold; }
           .border-b { border-bottom: 1px dashed #000; margin-bottom: 5px; padding-bottom: 5px; }
           .border-t { border-top: 1px dashed #000; margin-top: 5px; padding-top: 5px; }
           .flex { display: flex; justify-content: space-between; }
           .text-xs { font-size: calc(${fontSize} - 2px); }
           .mt-1 { margin-top: 5px; }
           .mt-2 { margin-top: 10px; }
           .mb-2 { margin-bottom: 10px; }
           
           .item-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
           .item-name { flex: 1; padding-right: 5px; word-break: break-word; }
           .item-details { width: 110px; text-align: right; white-space: nowrap; }
        </style>
      </head>
      <body>
        ${logoHtml}
        ${data.headerText ? `<div class="text-center font-bold" style="font-size: calc(${fontSize} + 4px); margin-bottom: 5px;">${data.headerText}</div>` : ''}
        <div class="text-center font-bold" style="font-size: calc(${fontSize} + 2px); margin-bottom: 5px;">${data.storeName}</div>
        ${showAddress && data.storeAddress ? `<div class="text-center text-xs">${data.storeAddress}</div>` : ''}
        ${showPhone && data.storePhone ? `<div class="text-center text-xs">Tel: ${data.storePhone}</div>` : ''}
        ${showTaxInfo && (data.taxOffice || data.taxNumber) ? `<div class="text-center text-xs">${data.taxOffice ? `V.D: ${data.taxOffice}` : ''} ${data.taxNumber ? `V.No: ${data.taxNumber}` : ''}</div>` : ''}
        
        <div class="border-b mt-2"></div>
        
        <div class="flex text-xs">
          <span>Tarih:</span>
          <span>${data.date}</span>
        </div>
        ${data.receiptNumber ? `
        <div class="flex text-xs">
          <span>Fiş No:</span>
          <span>${data.receiptNumber}</span>
        </div>` : ''}
        ${data.customerName ? `
        <div class="flex text-xs">
          <span>Müşteri:</span>
          <span style="text-align: right; max-width: 200px;">${data.customerName}</span>
        </div>` : ''}

        <div class="border-b mt-1"></div>
        
        <div class="flex font-bold text-xs mb-2">
          <span style="flex: 1;">Ürün</span>
          <span style="width: 110px; text-align: right;">Miktar x Fiyat</span>
        </div>
        
        ${data.items.map(item => `
          <div class="item-row text-xs">
            <div class="item-name">${item.name}</div>
            <div class="item-details">
              <div>${item.quantity} x ${item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
              ${item.discount ? `<div>-%${item.discount} => ${item.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>` : `<div>${item.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>`}
            </div>
          </div>
        `).join('')}
        
        <div class="border-t mt-2"></div>
        
        ${data.subTotal !== undefined ? `
        <div class="flex text-xs mt-1">
          <span>Ara Toplam:</span>
          <span>${data.subTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
        </div>
        ` : ''}
        ${data.taxTotal !== undefined ? `
        <div class="flex text-xs">
          <span>KDV Toplamı:</span>
          <span>${data.taxTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
        </div>
        ` : ''}
        
        <div class="flex font-bold mt-1" style="font-size: 16px;">
          <span>Genel Toplam:</span>
          <span>${data.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
        </div>
        
        ${data.paymentMethod ? `
        <div class="flex text-xs mt-2 font-bold">
          <span>Ödeme Tipi:</span>
          <span>${data.paymentMethod}</span>
        </div>` : ''}
        
        <div class="border-t mt-2"></div>
        
        <div class="text-center text-xs mt-2" style="white-space: pre-wrap;">${data.footerText || 'Bizi tercih ettiğiniz için teşekkür ederiz.\nBilgi Fişidir, Mali Değeri Yoktur.'}</div>
      </body>
    </html>
  `;
};

export const printHtml = (htmlContent: string) => {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  
  iframe.contentWindow?.document.open();
  iframe.contentWindow?.document.write(htmlContent);
  iframe.contentWindow?.document.close();

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    }, 200);
  };
};
