import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceNavigatorProps {
  setActivePage: (page: string) => void;
}

const pageMap: Record<string, string> = {
  'ana sayfa': 'dashboard',
  'panel': 'dashboard',
  'dashboard': 'dashboard',
  'hızlı satış': 'hizlisatis',
  'cariler': 'cariler',
  'müşteriler': 'cariler',
  'ürünler': 'urunler',
  'stoklar': 'urunler',
  'siparişler': 'siparisler',
  'fatura': 'efatura',
  'e-fatura': 'efatura',
  'e fatura': 'efatura',
  'depo': 'depo',
  'depolar': 'depo',
  'sayım': 'sayim',
  'stok sayım': 'sayim',
  'kasa': 'kasa',
  'banka': 'kasa',
  'personel': 'personel',
  'çalışanlar': 'personel',
  'mutabakat': 'mutabakat',
  'arıza': 'ariza',
  'arıza formları': 'ariza',
  'ajanda': 'ajanda',
  'notlar': 'ajanda',
  'raporlar': 'raporlar',
  'teklifler': 'teklif',
  'teklif': 'teklif',
  'ayarlar': 'ayarlar',
};

// Also basic commands to log out or close
// But let's keep it simple: just menu navigation.

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const VoiceNavigator: React.FC<VoiceNavigatorProps> = ({ setActivePage }) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(!!SpeechRecognition);
  const [recognition, setRecognition] = useState<any>(null);
  const [lastCommand, setLastCommand] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'tr-TR';

    rec.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript.toLowerCase().trim();
      setLastCommand(transcript);

      // Check if transcript matches any page
      for (const [key, page] of Object.entries(pageMap)) {
        if (transcript.includes(key)) {
          setActivePage(page);
          break;
        }
      }
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("Mikrofon erişimi reddedildi. Lütfen tarayıcı ayarlarından mikrofon izni verin veya sayfayı yeni sekmede açın.");
      }
    };

    rec.onend = () => {
      // Intentionally empty, handled by toggle or we rely on user clicking start again if it stops.
      // Continuous mode often stops after a while of silence, we can let user restart it.
      setIsListening(false);
    };

    setRecognition(rec);
  }, [supported, setActivePage]);

  const toggleListening = () => {
    if (!supported || !recognition) {
       alert("Tarayıcınız ses tanıma özelliğini desteklemiyor.");
       return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    if (lastCommand) {
      const t = setTimeout(() => setLastCommand(null), 3000);
      return () => clearTimeout(t);
    }
  }, [lastCommand]);

  if (!supported) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 no-print">
      {lastCommand && (
         <div className="bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm mb-1 shadow animate-fade-in">
            "{lastCommand}"
         </div>
      )}
      <button
        onClick={toggleListening}
        className={`p-3 rounded-full shadow-lg transition-colors flex items-center justify-center ${
          isListening 
            ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`}
        title={isListening ? "Sesli komut dinleniyor (durdur)" : "Sesli komutla menü değiştir"}
      >
        {isListening ? <Mic size={24} /> : <MicOff size={24} />}
      </button>
    </div>
  );
};
