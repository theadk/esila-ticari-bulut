const fs = require('fs');
let code = fs.readFileSync('pages/Urunler.tsx', 'utf8');

const resizeFn = `
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const max_dim = 600;
        if (width > height) {
          if (width > max_dim) {
            height = Math.round((height * max_dim) / width);
            width = max_dim;
          }
        } else {
          if (height > max_dim) {
            width = Math.round((width * max_dim) / height);
            height = max_dim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas context missing');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // 85% quality JPEG
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const Urunler: React.FC = () => {`;

code = code.replace('export const Urunler: React.FC = () => {', resizeFn);

const imageUploadUI = `
              {/* Resim Yükleme Alanı */}
              <div className="flex flex-col sm:flex-row gap-4 items-start mb-4">
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden relative group shrink-0">
                  {formData.image ? (
                    <>
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, image: undefined})}
                          className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="Resmi Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                      <Camera size={24} className="mb-2" />
                      <span className="text-xs">Görsel</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col gap-2 w-full">
                  <label className="text-sm font-medium text-gray-700">Ürün Görseli</label>
                  <p className="text-xs text-gray-500 mb-1">Maksimum 600x600 piksel olarak otomatik boyutlandırılır. (Kalite bozulmaz)</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <label className="flex-1 min-w-[120px] px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center justify-center gap-2 transition-colors">
                      <Upload size={18} />
                      Dosya Seç
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const resized = await resizeImage(file);
                              setFormData({...formData, image: resized});
                            } catch (error) {
                              toast.error('Resim işlenirken hata oluştu');
                            }
                          }
                        }}
                      />
                    </label>
                    <label className="flex-1 min-w-[120px] px-4 py-2 bg-white border border-emerald-300 rounded-lg shadow-sm text-sm font-medium text-emerald-700 hover:bg-emerald-50 cursor-pointer flex items-center justify-center gap-2 transition-colors">
                      <Camera size={18} />
                      Kamera ile Çek
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment"
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const resized = await resizeImage(file);
                              setFormData({...formData, image: resized});
                            } catch (error) {
                              toast.error('Resim işlenirken hata oluştu');
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">`;

code = code.replace('<div className="grid grid-cols-1 md:grid-cols-3 gap-3">', imageUploadUI);

fs.writeFileSync('pages/Urunler.tsx', code);
