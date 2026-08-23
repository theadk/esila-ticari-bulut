const fs = require('fs');
let code = fs.readFileSync('components/PuantajMaasView.tsx', 'utf8');

const perfModal = `
      {isPerformanceModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Star size={18} className="text-purple-600" /> Performans Notu ({selectedMonth})
              </h3>
              <button
                onClick={() => setIsPerformanceModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleSavePerformance} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Performans Puanı (0-100)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="flex-1 accent-purple-600"
                    value={performanceForm.score}
                    onChange={(e) =>
                      setPerformanceForm({
                        ...performanceForm,
                        score: Number(e.target.value),
                      })
                    }
                  />
                  <span className="font-bold text-purple-700 w-12 text-center text-lg">{performanceForm.score}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Not: 100 üzerinden girilen puana göre, hakedişin %10'una kadar ek prim hesaplanıp maaşa yansıtılır.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama / Değerlendirme Notu
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2"
                  rows={3}
                  value={performanceForm.notes}
                  onChange={(e) =>
                    setPerformanceForm({
                      ...performanceForm,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Başarı, hedeflere ulaşım durumu vb."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPerformanceModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

code = code.replace(
  '</div>\n  );\n};',
  perfModal + '\n    </div>\n  );\n};'
);

fs.writeFileSync('components/PuantajMaasView.tsx', code);
console.log('patched perf modal');
