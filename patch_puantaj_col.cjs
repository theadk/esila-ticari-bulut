const fs = require('fs');
let code = fs.readFileSync('components/PuantajMaasView.tsx', 'utf8');

code = code.replace(
  '<th className="px-4 py-3 text-right">Kök Maaş</th>',
  '<th className="px-4 py-3 text-center">Performans</th>\n                <th className="px-4 py-3 text-right">Kök Maaş</th>'
);

code = code.replace(
  '<td className="px-4 py-3 text-right font-medium text-gray-900">\n                      {p.salary?.toLocaleString("tr-TR") || 0} ₺\n                    </td>',
  `<td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPerformanceModal(p.id);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-xs font-semibold transition-colors"
                      >
                        <Star size={14} className={getPerformanceScore(p.id, selectedMonth) !== null ? 'fill-purple-700' : ''} />
                        {getPerformanceScore(p.id, selectedMonth) ?? 'Not Gir'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {p.salary?.toLocaleString("tr-TR") || 0} ₺
                    </td>`
);

fs.writeFileSync('components/PuantajMaasView.tsx', code);
console.log('patched puantaj col');
