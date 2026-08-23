const fs = require('fs');
let code = fs.readFileSync('pages/Personel.tsx', 'utf8');

const inputHtml = `                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Aylık Avans Limiti (₺)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">₺</span>
                          <input
                            type="number"
                            value={formData.advanceLimit || 0}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                advanceLimit: Number(e.target.value),
                              })
                            }
                            className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Örn: 5000"
                          />
                        </div>
                      </div>`;

if (!code.includes('Aylık Avans Limiti')) {
  code = code.replace(
    'Banka IBAN',
    'Banka IBAN\n                        </label>'
  ); // this is a mistake, let's fix the replace logic

  const salaryBlock = `                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maaş
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">
                            ₺
                          </span>
                          <input
                            type="number"
                            value={formData.salary}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                salary: Number(e.target.value),
                              })
                            }
                            className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      </div>`;

  // Wait, let's see how salary is actually written.
}
