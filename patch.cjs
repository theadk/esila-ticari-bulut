const fs = require('fs');
let code = fs.readFileSync('/app/applet/components/PuantajMaasView.tsx', 'utf8');

// 1. Add icons
code = code.replace(
  'import { Clock, DollarSign, Plus, Calendar, AlertTriangle } from "lucide-react";',
  'import { Clock, DollarSign, Plus, Calendar, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";'
);

// 2. Add expandedPersonnelId state
code = code.replace(
  'const personnelList = personnel.filter((p) => p.employmentStatus === "Aktif");',
  'const [expandedPersonnelId, setExpandedPersonnelId] = useState<string | null>(null);\n  const personnelList = personnel.filter((p) => p.employmentStatus === "Aktif");'
);

// 3. Modify the return block to support expandable rows
// First, find where `return (` is for the map
//     return (
//       <tr key={p.id} className="hover:bg-gray-50">
//       ...
//       </tr>
//     );
// We will change it to return a React.Fragment with the tr, and if expanded, another tr.

const rowStartStr = `                return (
                  <tr key={p.id} className="hover:bg-gray-50">`;

const replaceRowStart = `                const isExpanded = expandedPersonnelId === p.id;
                const monthAdjs = salaryAdjustments.filter(s => s.personnelId === p.id && s.date.startsWith(selectedMonth));
                
                return (
                  <React.Fragment key={p.id}>
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedPersonnelId(isExpanded ? null : p.id)}
                  >`;
                  
code = code.replace(rowStartStr, replaceRowStart);

const rowEndStr = `                    <td className="px-4 py-3 text-right font-bold text-indigo-700">
                      {netSalary.toLocaleString("tr-TR")} ₺
                    </td>
                  </tr>
                );`;

const replaceRowEnd = `                    <td className="px-4 py-3 text-right font-bold text-indigo-700">
                      {netSalary.toLocaleString("tr-TR")} ₺
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50/50">
                      <td colSpan={10} className="px-4 py-4 border-b border-gray-100">
                        <div className="text-sm">
                          <h4 className="font-semibold text-gray-700 mb-2">{p.firstName} {p.lastName} - {selectedMonth} Detayları</h4>
                          {monthAdjs.length > 0 ? (
                            <table className="w-full text-left text-sm bg-white border rounded-lg overflow-hidden">
                              <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                  <th className="px-3 py-2 border-b">Tarih</th>
                                  <th className="px-3 py-2 border-b">Tür</th>
                                  <th className="px-3 py-2 border-b">Açıklama</th>
                                  <th className="px-3 py-2 border-b text-right">Tutar</th>
                                </tr>
                              </thead>
                              <tbody>
                                {monthAdjs.map((adj) => (
                                  <tr key={adj.id} className="border-b last:border-0">
                                    <td className="px-3 py-2 text-gray-600">{new Date(adj.date).toLocaleDateString('tr-TR')}</td>
                                    <td className="px-3 py-2">
                                      <span className={\`px-2 py-1 rounded text-xs font-medium \${
                                        adj.type === 'Avans' || adj.type === 'Kesinti' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                      }\`}>
                                        {adj.type}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">{adj.description || '-'}</td>
                                    <td className={\`px-3 py-2 text-right font-medium \${
                                      adj.type === 'Avans' || adj.type === 'Kesinti' ? 'text-red-600' : 'text-emerald-600'
                                    }\`}>
                                      {adj.type === 'Avans' || adj.type === 'Kesinti' ? '-' : '+'}{adj.amount.toLocaleString("tr-TR")} ₺
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-gray-500 italic">Bu aya ait avans, kesinti veya prim kaydı bulunmamaktadır.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );`;

code = code.replace(rowEndStr, replaceRowEnd);

// Also need to add an empty header cell for the chevron column
const theadStr = `                <th className="px-4 py-3 text-right text-indigo-700 font-bold">
                  Net Hakediş
                </th>
              </tr>`;
const replaceTheadStr = `                <th className="px-4 py-3 text-right text-indigo-700 font-bold">
                  Net Hakediş
                </th>
                <th className="px-4 py-3 w-10"></th>
              </tr>`;
code = code.replace(theadStr, replaceTheadStr);

fs.writeFileSync('/app/applet/components/PuantajMaasView.tsx', code);
console.log('Patched');
