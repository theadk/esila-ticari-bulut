const fs = require('fs');
let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');

const headerRegex = /<h2 className="text-2xl font-bold text-gray-800">Cari Hesaplar<\/h2>\s*<div className="flex flex-wrap gap-2">/;

const printButton = `
        <h2 className="text-2xl font-bold text-gray-800">Cari Hesaplar</h2>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => {
              setTimeout(() => window.print(), 100);
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 print:hidden"
            title="Yazdır / PDF"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">Yazdır / PDF</span>
          </button>
`;

if (!code.includes('<span className="hidden sm:inline">Yazdır / PDF</span></button>')) {
    code = code.replace(headerRegex, printButton);
}

// Ensure print overrides exist on Cariler layout too
code = code.replace(
    /className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto"/g,
    'className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto print:border-none print:shadow-none print:overflow-visible"'
);

fs.writeFileSync('pages/Cariler.tsx', code);
