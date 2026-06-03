import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Sadece mobil cihazlarda göster
      if (window.innerWidth < 768) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h3 className="font-semibold text-sm">Uygulamayı Yükle</h3>
            <p className="text-xs text-emerald-100 mt-1">Daha iyi bir deneyim için ana ekrana ekleyin</p>
          </div>
          <button onClick={() => setShowPrompt(false)} className="text-white/70 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>
        <button onClick={handleInstallClick} className="bg-white text-emerald-700 w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
          <Download size={16} />
          <span>Ana Ekrana Ekle</span>
        </button>
      </div>
    </div>
  );
};
