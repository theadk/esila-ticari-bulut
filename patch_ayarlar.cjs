const fs = require('fs');
let code = fs.readFileSync('pages/Ayarlar.tsx', 'utf8');

const reminderSettings = `
                <div className="mt-4 pt-4 border-t col-span-1">
                  <h4 className="text-md font-medium text-gray-800 mb-4">Otomatik Taksit Hatırlatma Ayarları</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.reminder_3_days_before ?? true}
                        onChange={(e) => handleChange('reminder_3_days_before', e.target.checked)}
                        className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                      />
                      <span className="text-sm text-gray-700">Vade tarihinden 3 gün önce hatırlat</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.reminder_1_day_before ?? true}
                        onChange={(e) => handleChange('reminder_1_day_before', e.target.checked)}
                        className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                      />
                      <span className="text-sm text-gray-700">Vade tarihinden 1 gün önce hatırlat</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.reminder_overdue ?? true}
                        onChange={(e) => handleChange('reminder_overdue', e.target.checked)}
                        className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                      />
                      <span className="text-sm text-gray-700">Vadesi gecikmiş olanlar için her gün hatırlat (Sabah 09:00)</span>
                    </label>
                  </div>
                </div>
`;

code = code.replace('<div className="mt-4 pt-4 border-t">', reminderSettings + '\n                <div className="mt-4 pt-4 border-t">');

fs.writeFileSync('pages/Ayarlar.tsx', code);
console.log("Patched Ayarlar.tsx");
