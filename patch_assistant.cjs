const fs = require('fs');
let code = fs.readFileSync('pages/Urunler.tsx', 'utf8');

const speakCode = `
  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      window.speechSynthesis.speak(utterance);
    }
  };

  const processAssistantQuery = (query: string) => {
    if (!query) return;
    const lowerQuery = query.toLowerCase();
    
    let matchedProduct = null;
    for (const p of products) {
      if (lowerQuery.includes(p.name.toLowerCase())) {
        if (!matchedProduct || p.name.length > matchedProduct.name.length) {
          matchedProduct = p;
        }
      }
    }

    if (matchedProduct) {
      const answer = \`\${matchedProduct.name} ürününden stokta \${matchedProduct.stock} \${matchedProduct.unit || 'adet'} bulunmaktadır.\`;
      speak(answer);
      toast.success(answer, { icon: '🎙️' });
    } else {
      const answer = "Söylediğiniz isimde bir ürün stoklarda bulunamadı.";
      speak(answer);
      toast.error(answer, { icon: '🎙️' });
    }
  };

  const startAssistant = () => {
    if (isListening && activeSpeechField === 'assistant') {
      stop();
      setActiveSpeechField(null);
      return;
    }
    
    if (isListening) stop();
    setActiveSpeechField('assistant');
    
    listen((text) => {
      if (text.trim().length > 2) {
         stop();
         setActiveSpeechField(null);
         processAssistantQuery(text.trim());
      }
    });
  };
`;

if (!code.includes('const startAssistant = ()')) {
  // insert after startListening
  code = code.replace(
    /const startListening =.*?};\n/s,
    match => match + '\n' + speakCode
  );
}

const uiCode = `          </div>
          {supported && (
            <button
              onClick={startAssistant}
              className={\`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm \${
                isListening && activeSpeechField === 'assistant' 
                  ? 'bg-red-100 text-red-600 animate-pulse' 
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              }\`}
              title="Sesli Stok Asistanı (Örn: Elma kaç adet kaldı?)"
            >
              {isListening && activeSpeechField === 'assistant' ? <MicOff size={16} /> : <Mic size={16} />}
              <span className="hidden sm:inline">
                {isListening && activeSpeechField === 'assistant' ? 'Dinleniyor...' : 'Sesli Asistan'}
              </span>
            </button>
          )}`;

if (!code.includes('Sesli Stok Asistanı')) {
  code = code.replace(
    '            </button>\n          </div>\n        </div>',
    '            </button>\n' + uiCode + '\n        </div>'
  );
}

fs.writeFileSync('pages/Urunler.tsx', code);
