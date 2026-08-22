const fs = require('fs');
let code = fs.readFileSync('pages/StokSayim.tsx', 'utf8');

if (!code.includes('import { useSpeechRecognition }')) {
    code = code.replace("import { hasPermission } from '../lib/permissions';", "import { hasPermission } from '../lib/permissions';\nimport { useSpeechRecognition } from '../lib/useSpeechRecognition';");
}

code = code.replace("Camera, CheckCircle, AlertTriangle, X, Play, Square, FileText, Search, Plus, Minus } from 'lucide-react';", "Camera, CheckCircle, AlertTriangle, X, Play, Square, FileText, Search, Plus, Minus, Mic, MicOff, Volume2 } from 'lucide-react';");

// Insert State for Voice Search
const stateRegex = /const \[searchQuery, setSearchQuery\] = useState\(''\);/;
code = code.replace(stateRegex, (match) => {
    return match + `
  const { isListening, supported, listen, stop } = useSpeechRecognition();
  const [voiceQuery, setVoiceQuery] = useState('');
  const [voiceResult, setVoiceResult] = useState<Product | null>(null);
  const [isSearchingVoice, setIsSearchingVoice] = useState(false);
`;
});

// Insert Voice logic
const funcRegex = /const processBarcode = \(barcode: string\) => \{/;
const voiceFunc = `
  const handleVoiceSearch = () => {
    if (isListening) {
      stop();
      setIsSearchingVoice(false);
      return;
    }
    
    setVoiceQuery('');
    setVoiceResult(null);
    setIsSearchingVoice(true);
    
    listen((text, isFinal) => {
      setVoiceQuery(text);
      if (isFinal && text.trim().length > 0) {
        stop();
        setIsSearchingVoice(false);
        const query = text.toLowerCase().trim();
        // find product by name or barcode
        const found = products.find(p => 
          (p.name && p.name.toLowerCase().includes(query)) || 
          (p.barcode && p.barcode.toLowerCase() === query) ||
          (p.code && p.code.toLowerCase() === query)
        );
        
        if (found) {
           setVoiceResult(found);
           toast.success('Ürün bulundu: ' + found.name);
        } else {
           toast.error('Söylediğiniz ürün bulunamadı: ' + text);
        }
      }
    }, (err) => {
      setIsSearchingVoice(false);
    });
  };

`;

code = code.replace(funcRegex, voiceFunc + '\n  ' + "const processBarcode = (barcode: string) => {");

// We need to add the UI in the left column.
const leftColumnRegex = /<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">[\s\S]*?<h3 className="font-semibold text-lg mb-4 text-gray-800">Sayım Özeti<\/h3>/;

const voiceUI = `
          {/* Sesli Stok Sorgulama */}
          {supported && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-10"></div>
              <h3 className="font-semibold text-lg mb-4 text-gray-800 flex items-center gap-2">
                <Volume2 className="text-indigo-600" size={20} /> Sesli Stok Sorgulama
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Mikrofona tıklayarak ürün adını veya barkodunu söyleyin.
              </p>
              
              <div className="flex flex-col items-center">
                <button
                  onClick={handleVoiceSearch}
                  className={\`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-md \${isListening ? 'bg-red-500 animate-pulse scale-110' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'}\`}
                >
                  {isListening ? <MicOff size={28} /> : <Mic size={28} />}
                </button>
                
                <div className="mt-4 text-center min-h-[24px]">
                  {isListening && <span className="text-sm font-medium text-gray-500 italic">"{voiceQuery || 'Dinleniyor...'}"</span>}
                  {!isListening && voiceQuery && !voiceResult && <span className="text-sm font-medium text-red-500">Sonuç bulunamadı: "{voiceQuery}"</span>}
                </div>
              </div>

              {voiceResult && !isListening && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg animate-fade-in">
                   <div className="flex justify-between items-start mb-2">
                     <div>
                       <h4 className="font-bold text-gray-800">{voiceResult.name}</h4>
                       <p className="text-xs text-gray-500">Barkod: {voiceResult.barcode || voiceResult.code || '-'}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200">
                     <div className="flex-1 bg-white p-2 rounded border border-gray-100 text-center">
                        <div className="text-xs text-gray-500 font-medium">Sistem Stoku</div>
                        <div className="font-bold text-indigo-700 text-lg">
                          {voiceResult.warehouseStocks && voiceResult.warehouseStocks.length > 0 
                             ? voiceResult.warehouseStocks.reduce((sum, w) => sum + (Number(w.stock) || 0), 0)
                             : (Number(voiceResult.stock) || 0)
                          }
                        </div>
                     </div>
                     <button 
                       onClick={() => {
                          processBarcode(voiceResult.barcode || voiceResult.code);
                          setVoiceResult(null);
                       }}
                       className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-sm font-medium transition-colors"
                     >
                        Sayıma Ekle
                     </button>
                   </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-lg mb-4 text-gray-800">Sayım Özeti</h3>
`;

code = code.replace(leftColumnRegex, (match) => {
    return voiceUI;
});

fs.writeFileSync('pages/StokSayim.tsx', code);
