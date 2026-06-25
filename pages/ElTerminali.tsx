import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { ScanLine, Box, ArrowDownToLine, ArrowUpFromLine, Search, CheckCircle, XCircle, ArrowLeft, Plus, Minus, Camera, X } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Product } from '../types';

type TerminalMode = 'menu' | 'malkabul' | 'sevkiyat' | 'sayim' | 'sorgu';

export const ElTerminali: React.FC = () => {
  const { products, setProducts } = useAppStore();
  const [mode, setMode] = useState<TerminalMode>('menu');
  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [serialNumber, setSerialNumber] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const [isScanning, setIsScanning] = useState(false);

  // Handle Barcode Scanner from Camera
  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "barcode-reader",
        { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          setIsScanning(false);
          setBarcode(decodedText);
          
          const product = products.find(p => p.barcode === decodedText || p.id === decodedText || p.sku === decodedText);
          if (product) {
            setScannedProduct(product);
            setMessage({ text: 'Ürün Bulundu', type: 'success' });
            try {
               const audio = new Audio('/success.mp3');
               audio.play().catch(e => console.log('Audio error:', e));
            } catch (e) {}
          } else {
            setScannedProduct(null);
            setMessage({ text: 'Ürün Bulunamadı!', type: 'error' });
            setBarcode('');
          }
        },
        (error) => {
          // ignore error which happens continuously
        }
      );

      return () => {
        scanner.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      };
    }
  }, [isScanning, products]);

  // Auto-focus barcode input when mode changes to a scanning mode
  useEffect(() => {
    if (mode !== 'menu' && inputRef.current) {
      inputRef.current.focus();
    }
    setBarcode('');
    setScannedProduct(null);
    setQuantity(1);
    setSerialNumber('');
    setMessage(null);
  }, [mode]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    const product = products.find(p => p.barcode === barcode.trim() || p.id === barcode.trim() || p.sku === barcode.trim());
    
    if (product) {
      setScannedProduct(product);
      setMessage({ text: 'Ürün Bulundu', type: 'success' });
      // Keep focus for quantity or immediate action
    } else {
      setScannedProduct(null);
      setMessage({ text: 'Ürün Bulunamadı!', type: 'error' });
      setBarcode('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleAction = () => {
    if (!scannedProduct) return;

    if (mode === 'malkabul') {
      const newProducts = products.map(p => {
        if (p.id === scannedProduct.id) {
          const newSerials = p.serials ? [...p.serials] : [];
          if (serialNumber) newSerials.push(serialNumber);
          return { ...p, stock: p.stock + quantity, serials: newSerials };
        }
        return p;
      });
      setProducts(newProducts);
      setMessage({ text: `${quantity} adet stoğa EKLENDİ. Yeni Stok: ${scannedProduct.stock + quantity}`, type: 'success' });
    } else if (mode === 'sevkiyat') {
      if (scannedProduct.stock < quantity) {
         setMessage({ text: `Yetersiz Stok! Mevcut: ${scannedProduct.stock}`, type: 'error' });
         return;
      }
      const newProducts = products.map(p => {
        if (p.id === scannedProduct.id) {
          let newSerials = p.serials ? [...p.serials] : [];
          if (serialNumber) {
            newSerials = newSerials.filter(s => s !== serialNumber);
          }
          return { ...p, stock: p.stock - quantity, serials: newSerials };
        }
        return p;
      });
      setProducts(newProducts);
      setMessage({ text: `${quantity} adet stoktan DÜŞÜLDÜ. Yeni Stok: ${scannedProduct.stock - quantity}`, type: 'success' });
    } else if (mode === 'sayim') {
      const newProducts = products.map(p => 
        p.id === scannedProduct.id ? { ...p, stock: quantity } : p
      );
      setProducts(newProducts);
      setMessage({ text: `Stok ${quantity} olarak GÜNCELLENDİ.`, type: 'success' });
    }

    // Reset for next scan
    setScannedProduct(null);
    setBarcode('');
    setQuantity(1);
    setSerialNumber('');
    setTimeout(() => inputRef.current?.focus(), 1500);
  };

  if (mode === 'menu') {
    return (
      <div className="bg-gray-900 min-h-[calc(100vh-6rem)] rounded-2xl p-4 flex flex-col">
         <div className="bg-black p-4 rounded-xl mb-6 border-2 border-gray-800 text-center">
            <h1 className="text-3xl font-black text-white tracking-widest uppercase">El Terminali</h1>
            <p className="text-gray-400 font-mono mt-1">Depo Yönetim Sistemi</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <button 
              onClick={() => setMode('malkabul')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl p-8 flex flex-col items-center justify-center transition-transform active:scale-95 border-b-8 border-emerald-800"
            >
              <ArrowDownToLine size={64} className="mb-4" />
              <span className="text-3xl font-bold uppercase">Mal Kabul</span>
            </button>
            
            <button 
              onClick={() => setMode('sevkiyat')}
              className="bg-rose-600 hover:bg-rose-500 text-white rounded-2xl p-8 flex flex-col items-center justify-center transition-transform active:scale-95 border-b-8 border-rose-800"
            >
              <ArrowUpFromLine size={64} className="mb-4" />
              <span className="text-3xl font-bold uppercase">Sevkiyat</span>
            </button>
            
            <button 
              onClick={() => setMode('sayim')}
              className="bg-amber-500 hover:bg-amber-400 text-black rounded-2xl p-8 flex flex-col items-center justify-center transition-transform active:scale-95 border-b-8 border-amber-700"
            >
              <Box size={64} className="mb-4" />
              <span className="text-3xl font-bold uppercase">Sayım</span>
            </button>
            
            <button 
              onClick={() => setMode('sorgu')}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl p-8 flex flex-col items-center justify-center transition-transform active:scale-95 border-b-8 border-blue-800"
            >
              <Search size={64} className="mb-4" />
              <span className="text-3xl font-bold uppercase">Ürün Sorgula</span>
            </button>
         </div>
      </div>
    );
  }

  const getModeTitle = () => {
    switch(mode) {
      case 'malkabul': return 'MAL KABUL (GİRİŞ)';
      case 'sevkiyat': return 'SEVKİYAT (ÇIKIŞ)';
      case 'sayim': return 'STOK SAYIMI';
      case 'sorgu': return 'ÜRÜN SORGULAMA';
      default: return '';
    }
  };

  const getModeColor = () => {
    switch(mode) {
      case 'malkabul': return 'bg-emerald-600';
      case 'sevkiyat': return 'bg-rose-600';
      case 'sayim': return 'bg-amber-500 text-black';
      case 'sorgu': return 'bg-blue-600';
      default: return 'bg-gray-800';
    }
  };

  return (
    <div className="bg-black min-h-[calc(100vh-6rem)] rounded-2xl p-4 flex flex-col font-mono text-white">
      <div className={`p-4 rounded-xl mb-4 flex items-center justify-between border-2 border-white/20 ${getModeColor()}`}>
        <button onClick={() => setMode('menu')} className="p-2 bg-black/20 rounded-lg active:scale-95">
           <ArrowLeft size={32} />
        </button>
        <h2 className="text-2xl font-black uppercase tracking-wider">{getModeTitle()}</h2>
        <ScanLine size={32} className="opacity-50" />
      </div>

      <form onSubmit={handleScan} className="mb-4">
         <div className="relative">
           <input
             ref={inputRef}
             type="text"
             value={barcode}
             onChange={(e) => setBarcode(e.target.value)}
             placeholder="BARKOD OKUTUN..."
             className="w-full bg-gray-900 border-4 border-gray-700 text-yellow-400 text-3xl p-6 rounded-2xl text-center focus:outline-none focus:border-yellow-500 uppercase tracking-widest placeholder:text-gray-600"
             autoFocus
           />
           <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-2">
             <button 
               type="button"
               onClick={() => setIsScanning(true)}
               className="text-emerald-500 hover:bg-gray-800 p-2 rounded-lg transition-colors"
             >
               <Camera size={32} />
             </button>
             <ScanLine size={32} className="text-gray-500" />
           </div>
         </div>
         <button type="submit" className="hidden">Ara</button>
      </form>

      {/* Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col text-black">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                 <Camera className="text-emerald-600" size={24} />
                 Kamera ile Barkod Okut
               </h3>
               <button 
                 onClick={() => setIsScanning(false)} 
                 className="text-gray-500 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors"
               >
                  <X size={24} />
               </button>
            </div>
            <div className="p-0 bg-black relative">
               <div id="barcode-reader" className="w-full border-none"></div>
            </div>
            <div className="p-4 text-center text-sm text-gray-600 bg-gray-50 font-medium">
               Kameranızı ürün barkoduna doğru tutun.<br/>
               Ürün bulunduğunda otomatik olarak işleme alınacaktır.
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl mb-4 text-center font-bold text-xl border-4 ${
          message.type === 'success' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' : 
          message.type === 'error' ? 'bg-red-900/50 border-red-500 text-red-400' : 
          'bg-blue-900/50 border-blue-500 text-blue-400'
        }`}>
          {message.text}
        </div>
      )}

      {scannedProduct && (
        <div className="bg-gray-900 border-4 border-gray-700 rounded-2xl p-6 flex-1 flex flex-col">
           <div className="text-center mb-6">
             <div className="text-gray-400 text-lg mb-1">{scannedProduct.sku || scannedProduct.barcode}</div>
             <div className="text-3xl font-black text-white">{scannedProduct.name}</div>
             <div className="text-5xl font-black text-indigo-400 mt-4">{scannedProduct.stock} <span className="text-2xl text-gray-500">{scannedProduct.unit || 'Adet'}</span></div>
             <div className="text-gray-500 text-sm mt-1">Mevcut Stok</div>
           </div>

           {mode !== 'sorgu' && (
             <div className="mt-auto">
               <div className="mb-4">
                 <input
                   type="text"
                   value={serialNumber}
                   onChange={(e) => setSerialNumber(e.target.value)}
                   placeholder="SERİ / LOT NO GİRİN..."
                   className="w-full bg-gray-900 border-2 border-gray-700 text-white text-xl p-4 rounded-xl text-center focus:outline-none focus:border-indigo-500 uppercase tracking-widest placeholder:text-gray-600"
                 />
               </div>
               <div className="flex items-center justify-between bg-black p-4 rounded-xl mb-6 border-2 border-gray-800">
                  <button 
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center active:bg-gray-700"
                  >
                    <Minus size={40} />
                  </button>
                  <div className="text-6xl font-black text-yellow-400 w-32 text-center">
                    {quantity}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center active:bg-gray-700"
                  >
                    <Plus size={40} />
                  </button>
               </div>

               <button 
                 onClick={handleAction}
                 className={`w-full py-6 rounded-2xl text-3xl font-black uppercase tracking-widest active:scale-95 transition-transform ${getModeColor()}`}
               >
                 ONAYLA
               </button>
             </div>
           )}
        </div>
      )}

      {!scannedProduct && (
        <div className="flex-1 flex items-center justify-center border-4 border-dashed border-gray-800 rounded-2xl opacity-50">
           <div className="text-center">
             <ScanLine size={80} className="mx-auto text-gray-600 mb-4" />
             <p className="text-2xl font-bold text-gray-500 uppercase">CİHAZI BARKODA YÖNELTİN</p>
           </div>
        </div>
      )}
    </div>
  );
};
