const fs = require('fs');
let code = fs.readFileSync('pages/EFatura.tsx', 'utf8');

const targetTotals = `                {/* Totals Box */}
                <div className="flex justify-end mb-4">
                  <div className="w-[45%]">
                    <table className="w-full text-right border-collapse border border-black">
                      <tbody>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Mal Hizmet Toplam Tutarı
                          </td>
                          <td className="p-1 w-32 border-l-2 border-black border-l-gray-300">
                            {(previewInvoice.amount / 1.2).toLocaleString(
                              "tr-TR",
                              { minimumFractionDigits: 2 },
                            )}{" "}
                            TL
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Toplam İskonto
                          </td>
                          <td className="p-1 border-l-2 border-black border-l-gray-300">
                            0,00 TL
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Hesaplanan GERÇEK USULDE KATMA
                            <br />
                            DEĞER VERGİSİ(%20)
                          </td>
                          <td className="p-1 border-l-2 border-black border-l-gray-300">
                            {(
                              previewInvoice.amount -
                              previewInvoice.amount / 1.2
                            ).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            TL
                          </td>
                        </tr>
                        <tr className="border-b border-black bg-gray-50">
                          <td className="p-1 font-bold border-r border-black">
                            Vergiler Dahil Toplam Tutar
                          </td>
                          <td className="p-1 border-l-2 border-black border-l-gray-300">
                            {previewInvoice.amount.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            TL
                          </td>
                        </tr>
                        <tr className="border-b border-black font-bold">
                          <td className="p-1 border-r border-black">
                            Ödenecek Tutar
                          </td>
                          <td className="p-1 border-l-2 border-black border-l-gray-300">
                            {previewInvoice.amount.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            TL
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>`;

const newTotals = `                {/* Totals Box */}
                <div className="flex justify-end mb-4">
                  <div className="w-[45%]">
                    <table className="w-full text-right border-collapse border border-black">
                      <tbody>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Mal Hizmet Toplam Tutarı
                          </td>
                          <td className="p-1 w-32 border-l-2 border-black border-l-gray-300">
                            {(invoiceOrder?.subTotal || (previewInvoice.amount / 1.2)).toLocaleString(
                              "tr-TR",
                              { minimumFractionDigits: 2 },
                            )}{" "}
                            TL
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Toplam İskonto
                          </td>
                          <td className="p-1 border-l-2 border-black border-l-gray-300">
                            {((invoiceOrder as any)?.discountTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 font-bold border-r border-black">
                            Hesaplanan KDV Toplamı
                          </td>
                          <td className="p-1 border-l-2 border-black border-l-gray-300">
                            {(invoiceOrder?.taxTotal || (previewInvoice.amount - previewInvoice.amount / 1.2)).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            TL
                          </td>
                        </tr>
                        <tr className="border-b border-black bg-gray-50">
                          <td className="p-1 font-bold border-r border-black">
                            Vergiler Dahil Toplam Tutar
                          </td>
                          <td className="p-1 border-l-2 border-black border-l-gray-300">
                            {(invoiceOrder?.total || previewInvoice.amount).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            TL
                          </td>
                        </tr>
                        <tr className="border-b border-black font-bold">
                          <td className="p-1 border-r border-black">
                            Ödenecek Tutar
                          </td>
                          <td className="p-1 border-l-2 border-black border-l-gray-300">
                            {(invoiceOrder?.total || previewInvoice.amount).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            TL
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>`;

if(code.indexOf('Hesaplanan GERÇEK USULDE KATMA') !== -1) {
    code = code.replace(targetTotals, newTotals);
    fs.writeFileSync('pages/EFatura.tsx', code);
    console.log('Replaced totals limit.');
} else {
    console.log('Not found');
}
