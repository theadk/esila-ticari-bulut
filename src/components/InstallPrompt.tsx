import { safeLocalStorage } from '../../lib/storage';
import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIosPrompt, setIsIosPrompt] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    // Check if the app is already in standalone mode (PWA)
    const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator as any).standalone;

    if (isIos() && !isInStandaloneMode()) {
      const hasDismissed = safeLocalStorage.getItem('ios_install_prompt_dismissed');
      if (!hasDismissed) {
        setIsIosPrompt(true);
        setShowPrompt(true);
      }
    }

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

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIosPrompt) {
      safeLocalStorage.setItem('ios_install_prompt_dismissed', 'true');
    }
  };

  if (!showPrompt) return null;

  if (isIosPrompt) {
    return (
      <div className="fixed bottom-8 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
        <div className="bg-white border-2 border-emerald-500 p-5 rounded-2xl shadow-2xl flex flex-col gap-4 relative">
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-b-2 border-r-2 border-emerald-500 rotate-45 transform"></div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <h3 className="font-bold text-gray-800 text-lg">Esila Ticari'yi Yükle</h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                Tam ekran deneyimi ve hızlı erişim için uygulamamızı cihazınıza yükleyin.
              </p>
            </div>
            <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors shrink-0">
              <X size={18} />
            </button>
          </div>
          <div className="flex flex-col gap-3 mt-1 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                 <Share size={20} className="text-blue-500" strokeWidth={2.5} />
              </div>
              <p className="text-sm font-medium text-gray-700">1. Tarayıcının altındaki <strong className="text-gray-900">Paylaş</strong> butonuna dokunun</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                 <PlusSquare size={20} className="text-gray-600" strokeWidth={2.5} />
              </div>
              <p className="text-sm font-medium text-gray-700">2. <strong className="text-gray-900">Ana Ekrana Ekle</strong>'yi seçin</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h3 className="font-semibold text-sm">Uygulamayı Yükle</h3>
            <p className="text-xs text-emerald-100 mt-1">Daha iyi bir deneyim için ana ekrana ekleyin</p>
          </div>
          <button onClick={handleDismiss} className="text-white/70 hover:text-white p-1">
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
