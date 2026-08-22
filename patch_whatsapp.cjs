const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');

// 1. Add MessageCircle to imports
code = code.replace(
  "Printer, MessageSquare",
  "Printer, MessageSquare, MessageCircle"
);

// 2. Add handleSendWhatsApp function
const searchHandler = "  const handleAddInternalNote = () => {";
const handlerInject = `  const handleSendWhatsApp = () => {
    if (!selectedOrder) return;
    
    const customer = store.customers?.find(c => c.id === selectedOrder.customerId);
    
    const itemsText = selectedOrder.items.map(item => 
      \`- \${item.productName} (\${item.quantity} x \${item.price.toLocaleString('tr-TR', { style: 'currency', currency: selectedOrder.currency || 'TRY' })})\`
    ).join('\\n');
    
    const message = \`Sayın \${selectedOrder.customerName},

\${new Date(selectedOrder.date).toLocaleDateString('tr-TR')} tarihli siparişiniz (No: #\${selectedOrder.id.substring(0, 8).toUpperCase()}) ile ilgili detaylar aşağıdadır:

*Sipariş İçeriği:*
\${itemsText}

*Ara Toplam:* \${(selectedOrder.subTotal || selectedOrder.total).toLocaleString('tr-TR', { style: 'currency', currency: selectedOrder.currency || 'TRY' })}
\${selectedOrder.taxTotal ? \`*KDV Tutarı:* \${selectedOrder.taxTotal.toLocaleString('tr-TR', { style: 'currency', currency: selectedOrder.currency || 'TRY' })}\\n\` : ''}*Genel Toplam:* \${selectedOrder.total.toLocaleString('tr-TR', { style: 'currency', currency: selectedOrder.currency || 'TRY' })}

Bizi tercih ettiğiniz için teşekkür ederiz.\`;

    const encodedMessage = encodeURIComponent(message);
    let url = '';
    
    if (customer && customer.phone) {
      let cleanPhone = customer.phone.replace(/\\D/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = '9' + cleanPhone;
      else if (!cleanPhone.startsWith('90')) cleanPhone = '90' + cleanPhone;
      
      url = \`https://wa.me/\${cleanPhone}?text=\${encodedMessage}\`;
    } else {
      url = \`https://api.whatsapp.com/send?text=\${encodedMessage}\`;
    }
    
    window.open(url, '_blank');
  };

  const handleAddInternalNote = () => {`;
code = code.replace(searchHandler, handlerInject);

// 3. Add UI button next to Yazdir
const searchBtn = `                <button 
                  onClick={() => {
                    setTimeout(() => window.print(), 100);
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium flex items-center gap-2 text-sm"
                >
                  <Printer size={16} />
                  Yazdır
                </button>`;
const btnInject = `                <button 
                  onClick={handleSendWhatsApp}
                  className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors font-medium flex items-center gap-2 text-sm"
                  title="WhatsApp'tan Gönder"
                >
                  <MessageCircle size={16} />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
                <button 
                  onClick={() => {
                    setTimeout(() => window.print(), 100);
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium flex items-center gap-2 text-sm"
                >
                  <Printer size={16} />
                  Yazdır
                </button>`;
code = code.replace(searchBtn, btnInject);

fs.writeFileSync('pages/Siparisler.tsx', code);
