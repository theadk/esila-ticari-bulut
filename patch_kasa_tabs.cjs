const fs = require('fs');
let code = fs.readFileSync('pages/Kasa.tsx', 'utf8');

const newButton = `
        <button
          onClick={() => setActiveTab('taksitler')}
          className={\`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 \${activeTab === 'taksitler' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
        >
          Taksit Takibi
        </button>
      </div>`;

code = code.replace("Gider/Masraf Takibi\n        </button>\n      </div>", "Gider/Masraf Takibi\n        </button>" + newButton);

const newContent = `
      {activeTab === 'masraf' && (
        <div className="space-y-6 animate-in fade-in">
`;
const newTab = `
      {activeTab === 'taksitler' && (
        <Taksitler />
      )}
`;
code = code.replace(newContent, newTab + newContent);

fs.writeFileSync('pages/Kasa.tsx', code);
