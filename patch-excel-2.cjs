const fs = require('fs');

let content = fs.readFileSync('pages/Cariler.tsx', 'utf8');

const targetStr = 'const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);';
const validationLogic = `
        // Güvenlik Kontrolü: Kod parçacığı veya Link içeriyorsa reddet
        const securityRegex = /(<script|javascript:|onload=|onerror=|<\\?php|<iframe|<object|<embed|<applet|<html|<body|https?:\\/\\/[^\\s]+|www\\.[^\\s]+|<a\\s+href=)/i;
        let hasMaliciousContent = false;
        for (const row of jsonData) {
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

if (!content.includes('for (const row of jsonData) {')) {
    content = content.replace(targetStr, targetStr + "\n" + validationLogic);
    fs.writeFileSync('pages/Cariler.tsx', content);
    console.log('Patched second block in Cariler.tsx');
}

