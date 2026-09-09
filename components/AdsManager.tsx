import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdsManager: React.FC = () => {
  const [ads, setAds] = useState<string[]>([]);
  const [newAdUrl, setNewAdUrl] = useState('');

  useEffect(() => {
    const savedAds = localStorage.getItem('esila_customer_display_ads');
    if (savedAds) {
      try {
        setAds(JSON.parse(savedAds));
      } catch (e) {}
    }
  }, []);

  const saveAds = (newAds: string[]) => {
    setAds(newAds);
    localStorage.setItem('esila_customer_display_ads', JSON.stringify(newAds));
    
    // Broadcast immediately so Customer Display updates
    const channel = new BroadcastChannel('customer_display_ads_channel');
    channel.postMessage({ type: 'ADS_UPDATED', ads: newAds });
    channel.close();
  };

  const handleAddAd = () => {
    if (!newAdUrl.trim()) return;
    saveAds([...ads, newAdUrl.trim()]);
    setNewAdUrl('');
    toast.success('Reklam görseli eklendi');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Görsel 2MB dan küçük olmalıdır');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        saveAds([...ads, event.target.result as string]);
        toast.success('Reklam görseli yüklendi');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAd = (index: number) => {
    const newAds = ads.filter((_, i) => i !== index);
    saveAds(newAds);
    toast.success('Reklam görseli silindi');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Müşteri Ekranı Reklamları</h2>
      <p className="text-gray-500 mb-6">
        Satış yapılmadığı boş zamanlarda (sepet boşken) müşteri ekranında döngüsel olarak gösterilecek reklam veya kampanya görsellerini buradan yönetebilirsiniz.
      </p>

      <div className="flex gap-4 mb-8">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Görsel URL'si yapıştırın..."
            value={newAdUrl}
            onChange={(e) => setNewAdUrl(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleAddAd}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Ekle
          </button>
        </div>
        
        <div className="flex items-center text-gray-400">veya</div>
        
        <div>
          <input
            type="file"
            id="ad-upload"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <label
            htmlFor="ad-upload"
            className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-medium"
          >
            <ImageIcon size={20} className="text-gray-500" />
            Bilgisayardan Yükle
          </label>
        </div>
      </div>

      {ads.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Henüz reklam görseli eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ads.map((ad, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm aspect-video bg-gray-100 flex items-center justify-center">
              <img src={ad} alt={`Ad ${idx + 1}`} className="max-w-full max-h-full object-contain" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleRemoveAd(idx)}
                  className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transform hover:scale-110 transition-all shadow-lg"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
