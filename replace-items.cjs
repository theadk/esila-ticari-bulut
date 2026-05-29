const fs = require('fs');
let code = fs.readFileSync('pages/EFatura.tsx', 'utf8');

const targetTbody = `                  <tbody>
                    <tr className="border-b border-black">
                      <td className="p-1 border-r border-black text-center">
                        1
                      </td>
                      <td className="p-1 border-r border-black">1K</td>
                      <td className="p-1 border-r border-black">
                        Muhtelif Ürün / Hizmet Satışı
                      </td>
                      <td className="p-1 border-r border-black text-right">
                        1 Adet
                      </td>
                      <td className="p-1 border-r border-black text-right">
                        {(previewInvoice.amount / 1.2).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 8,
                        })}{" "}
                        TL
                      </td>
                      <td className="p-1 border-r border-black text-right">
                        %20,00
                      </td>
                      <td className="p-1 border-r border-black text-right">
                        {(
                          previewInvoice.amount -
                          previewInvoice.amount / 1.2
                        ).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        TL
                      </td>
                      <td className="p-1 border-r border-black text-right"></td>
                      <td className="p-1 text-right">
                        {(previewInvoice.amount / 1.2).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        TL
                      </td>
                    </tr>
                  </tbody>`;

const newTbody = `                  <tbody>
                    {invoiceOrder && invoiceOrder.items && invoiceOrder.items.length > 0 ? (
                      invoiceOrder.items.map((item: any, idx: number) => {
                         const taxRate = item.taxRate || 20;
                         const priceWithoutTax = item.price / (1 + (taxRate / 100));
                         const taxAmount = item.price - priceWithoutTax;
                         const totalItemWithoutTax = priceWithoutTax * item.quantity;
                         
                         return (
                            <tr key={idx} className="border-b border-black last:border-b-0">
                              <td className="p-1 border-r border-black text-center">{idx + 1}</td>
                              <td className="p-1 border-r border-black">{item.productId || '1K'}</td>
                              <td className="p-1 border-r border-black">{item.productName}</td>
                              <td className="p-1 border-r border-black text-right">{item.quantity} {item.unit || 'Adet'}</td>
                              <td className="p-1 border-r border-black text-right">
                                {priceWithoutTax.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} TL
                              </td>
                              <td className="p-1 border-r border-black text-right">%{taxRate}</td>
                              <td className="p-1 border-r border-black text-right">
                                {(taxAmount * item.quantity).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                              </td>
                              <td className="p-1 border-r border-black text-right"></td>
                              <td className="p-1 text-right">
                                {totalItemWithoutTax.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                              </td>
                            </tr>
                         );
                      })
                    ) : (
                      <tr className="border-b border-black">
                        <td className="p-1 border-r border-black text-center">1</td>
                        <td className="p-1 border-r border-black">1K</td>
                        <td className="p-1 border-r border-black">Muhtelif Ürün / Hizmet Satışı</td>
                        <td className="p-1 border-r border-black text-right">1 Adet</td>
                        <td className="p-1 border-r border-black text-right">
                          {(previewInvoice.amount / 1.2).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 8 })} TL
                        </td>
                        <td className="p-1 border-r border-black text-right">%20,00</td>
                        <td className="p-1 border-r border-black text-right">
                          {(previewInvoice.amount - previewInvoice.amount / 1.2).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                        </td>
                        <td className="p-1 border-r border-black text-right"></td>
                        <td className="p-1 text-right">
                          {(previewInvoice.amount / 1.2).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                        </td>
                      </tr>
                    )}
                  </tbody>`;

code = code.replace(targetTbody, newTbody);
fs.writeFileSync('pages/EFatura.tsx', code);
console.log('Replaced table body.');
