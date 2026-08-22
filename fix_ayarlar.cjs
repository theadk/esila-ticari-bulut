const fs = require('fs');
let code = fs.readFileSync('pages/Ayarlar.tsx', 'utf8');

const regex = /\{\/\* WhatsApp Modal \*\/\}[\s\S]*\{\/\* SMS Modal \*\/\}[\s\S]*?\}\n\s*\}\n\s*className="px-4 py-2 bg-blue-600[\s\S]*?Gönder\n\s*<\/button>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\)\}/;

code = code.replace(regex, '');

fs.writeFileSync('pages/Ayarlar.tsx', code);
