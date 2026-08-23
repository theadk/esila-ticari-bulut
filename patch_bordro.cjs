const fs = require('fs');
let code = fs.readFileSync('components/MaasBordrosuView.tsx', 'utf8');

const printHandlers = `
  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = \`
      <html>
        <head>
          <title>\${selectedMonth} - Genel Maaş Bordrosu</title>
          <style>
            body { font-family: sans-serif; color: #333; padding: 20px; }
            h1 { text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
            table { border-collapse: collapse; margin-top: 20px; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            th { background-color: #f9fafb; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .net-salary { font-weight: bold; color: #4f46e5; }
            .summary { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; width: 30%; text-align: center; }
            .summary-card h4 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
            .summary-card p { margin: 0; font-size: 20px; font-weight: bold; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>\${selectedMonth} - Genel Maaş Bordrosu</h1>
          
          <div class="summary">
            <div class="summary-card">
              <h4>Toplam Net Ödenecek</h4>
              <p>\${totalNet.toLocaleString("tr-TR")} ₺</p>
            </div>
            <div class="summary-card">
              <h4>Toplam Avans & Kesinti</h4>
              <p>\${(totalAdvances + payrollData.reduce((s, d) => s + d.adjs.kesinti, 0)).toLocaleString("tr-TR")} ₺</p>
            </div>
            <div class="summary-card">
              <h4>Toplam Prim & Mesai</h4>
              <p>\${(totalPremiums + payrollData.reduce((s, d) => s + d.financials.overtimePay, 0)).toLocaleString("tr-TR")} ₺</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Personel</th>
                <th class="text-right">Kök Maaş</th>
                <th class="text-center">Devamsız/Kesinti</th>
                <th class="text-center">Mesai/Prim</th>
                <th class="text-right">Avanslar</th>
                <th class="text-right">Net Ödenecek</th>
              </tr>
            </thead>
            <tbody>
              \${payrollData.map(row => \`
                <tr>
                  <td>
                    <strong>\${row.personnel.firstName} \${row.personnel.lastName}</strong><br/>
                    <small>\${row.personnel.department} / \${row.personnel.position}</small>
                  </td>
                  <td class="text-right">\${row.financials.baseSalary.toLocaleString("tr-TR")} ₺</td>
                  <td class="text-center">
                    \${row.stats.gelmedi > 0 ? \`<div>Devamsız: \${row.stats.gelmedi} Gün (-\${row.financials.deductionForAbsence.toLocaleString("tr-TR")} ₺)</div>\` : ''}
                    \${row.adjs.kesinti > 0 ? \`<div>Kesinti: -\${row.adjs.kesinti.toLocaleString("tr-TR")} ₺</div>\` : ''}
                    \${row.stats.gelmedi === 0 && row.adjs.kesinti === 0 ? '-' : ''}
                  </td>
                  <td class="text-center">
                    \${row.stats.overtime > 0 ? \`<div>Mesai: \${row.stats.overtime} Saat (+\${row.financials.overtimePay.toLocaleString("tr-TR")} ₺)</div>\` : ''}
                    \${row.adjs.prim > 0 ? \`<div>Prim: +\${row.adjs.prim.toLocaleString("tr-TR")} ₺</div>\` : ''}
                    \${row.stats.overtime === 0 && row.adjs.prim === 0 ? '-' : ''}
                  </td>
                  <td class="text-right">\${row.adjs.avans > 0 ? \`-\${row.adjs.avans.toLocaleString("tr-TR")} ₺\` : '-'}</td>
                  <td class="text-right net-salary">\${row.financials.netSalary.toLocaleString("tr-TR")} ₺</td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    \`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintSingle = (row: typeof payrollData[0]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = \`
      <html>
        <head>
          <title>\${row.personnel.firstName} \${row.personnel.lastName} - Maaş Bordrosu</title>
          <style>
            body { font-family: sans-serif; color: #333; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 30px; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 30px; border: 1px solid #eee; padding: 20px; border-radius: 8px; background: #fafafa; }
            .header-info div { line-height: 1.6; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f9fafb; width: 50%; }
            .text-right { text-align: right; }
            .amount { font-family: monospace; font-size: 1.1em; }
            .total-row th, .total-row td { background-color: #f0fdf4; font-size: 1.2em; border-top: 2px solid #22c55e; }
            .signature-area { display: flex; justify-content: space-between; margin-top: 60px; }
            .signature-box { width: 40%; border-top: 1px solid #333; text-align: center; padding-top: 10px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Personel Maaş Bordrosu</h1>
          
          <div class="header-info">
            <div>
              <strong>Personel Adı:</strong> \${row.personnel.firstName} \${row.personnel.lastName}<br/>
              <strong>Departman:</strong> \${row.personnel.department}<br/>
              <strong>Görev:</strong> \${row.personnel.position}
            </div>
            <div class="text-right">
              <strong>Bordro Dönemi:</strong> \${selectedMonth}<br/>
              <strong>Tarih:</strong> \${new Date().toLocaleDateString('tr-TR')}
            </div>
          </div>

          <table>
            <tbody>
              <tr>
                <th>Kök Maaş</th>
                <td class="text-right amount">\${row.financials.baseSalary.toLocaleString("tr-TR")} ₺</td>
              </tr>
              <tr>
                <th>Mesai Ücreti \${row.stats.overtime > 0 ? \`(\${row.stats.overtime} Saat)\` : ''}</th>
                <td class="text-right amount">\${row.financials.overtimePay > 0 ? '+' : ''}\${row.financials.overtimePay.toLocaleString("tr-TR")} ₺</td>
              </tr>
              <tr>
                <th>Primler</th>
                <td class="text-right amount">\${row.adjs.prim > 0 ? '+' : ''}\${row.adjs.prim.toLocaleString("tr-TR")} ₺</td>
              </tr>
              <tr>
                <th>Devamsızlık Kesintisi \${row.stats.gelmedi > 0 ? \`(\${row.stats.gelmedi} Gün)\` : ''}</th>
                <td class="text-right amount">\${row.financials.deductionForAbsence > 0 ? '-' : ''}\${row.financials.deductionForAbsence.toLocaleString("tr-TR")} ₺</td>
              </tr>
              <tr>
                <th>Diğer Kesintiler</th>
                <td class="text-right amount">\${row.adjs.kesinti > 0 ? '-' : ''}\${row.adjs.kesinti.toLocaleString("tr-TR")} ₺</td>
              </tr>
              <tr>
                <th>Kullanılan Avanslar</th>
                <td class="text-right amount">\${row.adjs.avans > 0 ? '-' : ''}\${row.adjs.avans.toLocaleString("tr-TR")} ₺</td>
              </tr>
              <tr class="total-row">
                <th>NET ÖDENECEK TUTAR</th>
                <td class="text-right amount"><strong>\${row.financials.netSalary.toLocaleString("tr-TR")} ₺</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="signature-area">
            <div class="signature-box">
              İşveren / Yetkili İmza
            </div>
            <div class="signature-box">
              Personel İmza<br/>
              <small>(Bordroyu aldım, mutabıkım)</small>
            </div>
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    \`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
`;

code = code.replace("  return (", printHandlers);

// Update Header to include Print button next to month input
const oldInput = `<input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />`;

const newInput = `<div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            onClick={handlePrintAll}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
          >
            <Download size={18} />
            Bordroyu Yazdır / PDF
          </button>
        </div>`;

code = code.replace(oldInput, newInput);

// Add Action Column in Table Head
code = code.replace(
  '<th className="px-4 py-4 text-right text-indigo-700 font-bold">Net Ödenecek</th>',
  '<th className="px-4 py-4 text-right text-indigo-700 font-bold">Net Ödenecek</th>\n                <th className="px-4 py-4 text-center">İşlem</th>'
);

// Update ColSpan when no data
code = code.replace('colSpan={6}', 'colSpan={7}');

// Add Print button in Table Body
const oldTd = `<td className="px-4 py-3 text-right font-bold text-indigo-700 text-base bg-indigo-50/30">
                    {row.financials.netSalary.toLocaleString("tr-TR")} ₺
                  </td>
                </tr>`;

const newTd = `<td className="px-4 py-3 text-right font-bold text-indigo-700 text-base bg-indigo-50/30">
                    {row.financials.netSalary.toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handlePrintSingle(row)}
                      className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Kişisel Bordroyu Yazdır"
                    >
                      <Download size={18} />
                    </button>
                  </td>
                </tr>`;

code = code.replace(oldTd, newTd);

fs.writeFileSync('components/MaasBordrosuView.tsx', code);
console.log('Patched');
