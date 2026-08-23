const fs = require('fs');
let code = fs.readFileSync('pages/Personel.tsx', 'utf8');

const salaryBlock = `                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Maaş (Net)
                          </label>
                          <input
                            type="number"
                            value={formData.salary}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                salary: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>`;

const newBlock = salaryBlock + `
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Aylık Avans Limiti (₺)
                          </label>
                          <input
                            type="number"
                            value={formData.advanceLimit || 0}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                advanceLimit: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Limit Yok"
                          />
                        </div>`;

if (!code.includes('Aylık Avans Limiti')) {
  code = code.replace(salaryBlock, newBlock);
}

fs.writeFileSync('pages/Personel.tsx', code);
console.log('patched Personel.tsx');
