const fs = require('fs');
let content = fs.readFileSync('pages/Ayarlar.tsx', 'utf8');

const targetContent = `                <div className="sm:px-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yazdırılacak Barkod Türü</label>
                  <select
                    value={settings.barcode_type || '1D'}
                    onChange={(e) => handleChange('barcode_type', e.target.value)}
                    className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="1D">1D (Çizgi Barkod - Code128)</option>
                    <option value="QR">QR Kod</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Ürün detaylarında "Barkod Yazdır" denildiğinde üretilecek formatı belirler.</p>
                </div>
              </div>`;

const newContent = `                <div className="sm:px-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yazdırılacak Barkod Türü</label>
                  <select
                    value={settings.barcode_type || '1D'}
                    onChange={(e) => handleChange('barcode_type', e.target.value)}
                    className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="1D">1D (Çizgi Barkod - Code128)</option>
                    <option value="QR">QR Kod</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Ürün detaylarında "Barkod Yazdır" denildiğinde üretilecek formatı belirler.</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4 mt-8">Müşteri Ekranı Ayarları</h3>
              <div className="grid grid-cols-1 gap-4 sm:p-6">
                <div className="sm:px-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reklam Slayt Geçiş Süresi (Saniye)</label>
                  <input 
                    type="number"
                    min="1"
                    value={settings.customerDisplay_sliderInterval || 5}
                    onChange={(e) => handleChange('customerDisplay_sliderInterval', parseInt(e.target.value) || 5)}
                    className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Müşteri ekranında (boş durumda) reklam görsellerinin ekranda kalma süresi.</p>
                </div>
              </div>`;

if (content.includes(targetContent)) {
  content = content.replace(targetContent, newContent);
  fs.writeFileSync('pages/Ayarlar.tsx', content);
  console.log("Ayarlar.tsx patched");
} else {
  console.log("Could not find target content in Ayarlar.tsx");
}
