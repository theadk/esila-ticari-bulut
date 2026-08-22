const fs = require('fs');

function fixFile(file) {
  try {
     let code = fs.readFileSync(file, 'utf8');
     code = code.replace(/<\/tr>\n\s*\)\)\}/g, "</tr>\n                        )})}");
     code = code.replace(/<\/tr>\n\s*\)\;\n\s*\}\)\}/g, "</tr>\n                        );\n                       })}");
     fs.writeFileSync(file, code);
     console.log('Fixed', file);
  } catch(e) {
     console.error(e);
  }
}

fixFile('pages/Siparisler.tsx');
fixFile('pages/Satislar.tsx');
fixFile('pages/Teklifler.tsx');

