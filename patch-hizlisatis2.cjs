const fs = require('fs');
let content = fs.readFileSync('pages/HizliSatis.tsx', 'utf8');

const btnHtml = `
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open('/musteri-ekrani', '_blank', 'width=1024,height=768')}
              className="flex items-center gap-1 px-3 py-1 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              title="Müşteri Ekranı"
            >
               <Camera size={16} />
               <span className="hidden sm:inline">Müşteri Ekranı</span>
            </button>
            <button 
              onClick={() => setShowSuspendedModal(true)}
`;

if (!content.includes('Müşteri Ekranı')) {
  content = content.replace(
    '<button \n             onClick={() => setShowSuspendedModal(true)}',
    btnHtml
  );
  // Alternative match if indentation differs
  content = content.replace(
    '<button \n            onClick={() => setShowSuspendedModal(true)}',
    btnHtml
  );
  content = content.replace(
    '<button\n            onClick={() => setShowSuspendedModal(true)}',
    btnHtml
  );
  content = content.replace(
    '<button \n            onClick={() => setShowSuspendedModal(true)}',
    btnHtml
  );
  content = content.replace(
    '          <button \n             onClick={() => setShowSuspendedModal(true)}',
    btnHtml
  );
}

fs.writeFileSync('pages/HizliSatis.tsx', content);
console.log("Patched HizliSatis.tsx again");
