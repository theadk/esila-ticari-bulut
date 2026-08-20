const fs = require('fs');

const validationLogic = `
        // Güvenlik Kontrolü: Kod parçacığı veya Link içeriyorsa reddet
        const securityRegex = /(<script|javascript:|onload=|onerror=|<\\?php|<iframe|<object|<embed|<applet|<html|<body|https?:\\/\\/[^\\s]+|www\\.[^\\s]+|<a\\s+href=)/i;
        let hasMaliciousContent = false;
        const rowsToValidate = Array.isArray(data) ? data : (typeof jsonData !== 'undefined' ? jsonData : []);
        for (const row of rowsToValidate) {
           for (const key in row) {
              const val = String(row[key] || '');
              if (securityRegex.test(val)) {
                 hasMaliciousContent = true;
                 break;
              }
           }
           if (hasMaliciousContent) break;
        }

        if (hasMaliciousContent) {
           alert("Hata: Yüklemeye çalıştığınız Excel dosyasında güvenlik riski taşıyan kod parçacıkları veya linkler (http://, https://, www., vb.) tespit edildi. Lütfen dosyanızı temizleyip tekrar deneyin.");
           return;
        }
`;

function patchFile(file, matchStr) {
    let content = fs.readFileSync(file, 'utf8');
    // split by matchStr and insert validation
    if (content.includes(validationLogic.trim().split('\n')[0])) {
       console.log(file, 'already patched');
       return;
    }
    const parts = content.split(matchStr);
    if (parts.length > 1) {
       content = parts.join(matchStr + "\n" + validationLogic);
       fs.writeFileSync(file, content);
       console.log('Patched', file);
    } else {
       console.log('Match string not found in', file);
    }
}

patchFile('pages/Urunler.tsx', 'const data = XLSX.utils.sheet_to_json(ws);');
patchFile('pages/Cariler.tsx', 'const data = XLSX.utils.sheet_to_json(ws);');
patchFile('pages/Cariler.tsx', 'const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);');

