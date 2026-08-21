const fs = require('fs');
let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');

// I will insert a variable let newlyGeneratedInstallments: any[] = []; at the top of handleSavePayment
code = code.replace("const handleSavePayment = (e: React.FormEvent) => {", "const handleSavePayment = (e: React.FormEvent) => {\n    let newlyGeneratedInstallments: any[] = [];");

// Capture newInstallmentsToAdd
code = code.replace("if (newInstallmentsToAdd.length > 0) {", "if (newInstallmentsToAdd.length > 0) {\n                 newlyGeneratedInstallments.push(...newInstallmentsToAdd);");

// Capture single split
code = code.replace("updatedInstallments.push({", "const newSplit = {");
code = code.replace("paidDate: undefined\n              });", "paidDate: undefined\n              };\n              updatedInstallments.push(newSplit);\n              newlyGeneratedInstallments.push(newSplit);");

const notificationLogic = `
    // Send email notification for partial payments
    if (newlyGeneratedInstallments.length > 0 && paymentForm.notifyCustomer && updatedSelectedCustomer.email) {
      let html = \`
        <h2 style="color: #4f46e5; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 24px;">Kısmi Ödeme & Yeni Taksit Bilgilendirmesi</h2>
        <p style="margin-bottom: 24px;">Sayın <b>\${updatedSelectedCustomer.name || updatedSelectedCustomer.companyName}</b>,<br>Yapmış olduğunuz kısmi ödeme (<b>\${Math.abs(paymentForm.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</b>) başarıyla alınmıştır. Eksik kalan ödeme tutarı için aşağıdaki şekilde yeni bir ara taksit planı oluşturulmuştur.</p>
        <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background-color: #e5e7eb; color: #374151; text-align: left; font-size: 14px;">
                    <th style="padding: 12px 16px; border-bottom: 1px solid #d1d5db; font-weight: 600;">Açıklama</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #d1d5db; font-weight: 600;">Vade Tarihi</th>
                    <th style="padding: 12px 16px; border-bottom: 1px solid #d1d5db; font-weight: 600; text-align: right;">Kalan Tutar</th>
                </tr>
            </thead>
            <tbody style="background-color: #ffffff;">
      \`;
      
      newlyGeneratedInstallments.forEach((p, index) => {
          const borderBottom = index !== newlyGeneratedInstallments.length - 1 ? 'border-bottom: 1px solid #f3f4f6;' : '';
          const formattedDate = new Date(p.dueDate).toLocaleDateString('tr-TR');
          const formattedAmount = parseFloat(p.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
          html += \`
              <tr style="font-size: 14px;">
                  <td style="padding: 12px 16px; \${borderBottom} color: #111827; font-weight: 500;">\${p.description || '-'}</td>
                  <td style="padding: 12px 16px; \${borderBottom} color: #4b5563; font-family: monospace;">\${formattedDate}</td>
                  <td style="padding: 12px 16px; \${borderBottom} color: #4f46e5; font-weight: 700; text-align: right;">\${formattedAmount} ₺</td>
              </tr>
          \`;
      });
      html += \`
              </tbody>
          </table>
          </div>
          <p style="margin-bottom: 0;">Bizi tercih ettiğiniz için teşekkür ederiz.</p>
      \`;

      const tenantId = localStorage.getItem('esila_tenant_id') || '1111111111';
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({
          to: updatedSelectedCustomer.email,
          subject: 'Kısmi Ödeme Bilgilendirmesi',
          html: html
        })
      }).catch(console.error);
    }
    
    setIsPaymentModalOpen(false);
`;

code = code.replace("setIsPaymentModalOpen(false);", notificationLogic);

// Add the checkbox to the UI
const checkboxHtml = `
              {paymentForm.installmentId || (paymentForm.installmentIds && paymentForm.installmentIds.length > 0) ? (
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentForm.notifyCustomer}
                    onChange={(e) => setPaymentForm({...paymentForm, notifyCustomer: e.target.checked})}
                    className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                  />
                  <span className="text-sm text-gray-700">Kısmi ödemede oluşacak yeni ara taksiti müşteriye e-posta ile bildir</span>
                </label>
              </div>
              ) : null}
              <div className="pt-4 flex justify-end gap-3">
`;
code = code.replace('<div className="pt-4 flex justify-end gap-3">', checkboxHtml);

fs.writeFileSync('pages/Cariler.tsx', code);
console.log("Patched Cariler.tsx");
