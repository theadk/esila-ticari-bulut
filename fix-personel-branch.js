import fs from 'fs';
const f = 'pages/Personel.tsx';
let txt = fs.readFileSync(f, 'utf8');

txt = txt.replace(
  `<label className="block text-sm font-medium text-gray-700 mb-1">\n                            Şube\n                          </label>\n                          <input\n                            type="text"`,
  `<label className="block text-sm font-medium text-gray-700 mb-1">\n                            Şube <span className="text-red-500">*</span>\n                          </label>\n                          <input\n                            required\n                            type="text"`
);
fs.writeFileSync(f, txt);
