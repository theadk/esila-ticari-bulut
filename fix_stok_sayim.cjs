const fs = require('fs');
let code = fs.readFileSync('pages/StokSayim.tsx', 'utf8');

const cameraBlock = `
          {/* Kamera ve Barkod */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Camera className="text-emerald-600" /> Barkod Okuyucu
            </h3>
            
            {!isScanning ? (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Camera size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-600 text-center mb-4 text-sm">Sayım yapmak için kamerayı başlatın</p>
                <button
                  onClick={startScanner}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Play size={18} /> Kamerayı Başlat
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div id="reader" className="w-full overflow-hidden rounded-lg outline-none border-none"></div>
                <button
                  onClick={stopScanner}
                  className="mt-4 bg-red-100 hover:bg-red-200 text-red-700 px-6 py-2 rounded-lg flex items-center gap-2 transition-colors w-full justify-center font-medium"
                >
                  <Square size={18} /> Durdur
                </button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100">
              <form onSubmit={handleManualSubmit}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manuel Barkod/Kod Girişi</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="Barkod girin ve enter'a basın..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    Ekle
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-lg mb-4 text-gray-800">Sayım Özeti</h3>
`;

code = code.replace(/<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">\s*<h3 className="font-semibold text-lg mb-4 text-gray-800">Sayım Özeti<\/h3>/, cameraBlock);

fs.writeFileSync('pages/StokSayim.tsx', code);
