const fs = require('fs');
let code = fs.readFileSync('components/PuantajMaasView.tsx', 'utf8');

code = code.replace(
  '<th className="px-3 py-2 border-b text-right">Tutar</th>',
  '<th className="px-3 py-2 border-b text-right">Tutar</th>\n<th className="px-3 py-2 border-b text-center">Durum</th>'
);

code = code.replace(
  'adj.type === \'Avans\' || adj.type === \'Kesinti\' ? \'-\' : \'+\'}{adj.amount.toLocaleString("tr-TR")} ₺\n                                    </td>',
  `adj.type === 'Avans' || adj.type === 'Kesinti' ? '-' : '+'}{adj.amount.toLocaleString("tr-TR")} ₺
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      {adj.status === 'Bekliyor' && <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">Bekliyor</span>}
                                      {(!adj.status || adj.status === 'Onaylandı') && <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Onaylandı</span>}
                                      {adj.status === 'Reddedildi' && <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">Reddedildi</span>}
                                    </td>`
);

fs.writeFileSync('components/PuantajMaasView.tsx', code);
console.log('patched monthAdjs table');
