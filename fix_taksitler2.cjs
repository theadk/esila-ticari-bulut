const fs = require('fs');
let code = fs.readFileSync('components/Taksitler.tsx', 'utf8');

code = code.replace('{!inst.isPaid && (', '{!inst.isPaid && (<>');
code = code.replace(
    'Yapılandır\n                                    </button>\n                                )}',
    'Yapılandır\n                                    </button>\n                                )}</>'
);

fs.writeFileSync('components/Taksitler.tsx', code);
