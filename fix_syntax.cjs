const fs = require('fs');

function fixFile(file, lineStr, replaceStr) {
  try {
     let code = fs.readFileSync(file, 'utf8');
     code = code.replace(lineStr, replaceStr);
     fs.writeFileSync(file, code);
     console.log('Fixed', file);
  } catch(e) {
     console.error(e);
  }
}

fixFile('pages/Siparisler.tsx', 
  "                          </tr>\n                        ))}", 
  "                          </tr>\n                        )})}"
);

fixFile('pages/Satislar.tsx', 
  "                          </tr>\n                      ))}", 
  "                          </tr>\n                      )})}"
);

fixFile('pages/Teklifler.tsx', 
  "                          </tr>\n                       ))}", 
  "                          </tr>\n                       )})}"
);

