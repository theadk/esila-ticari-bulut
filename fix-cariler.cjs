const fs = require('fs');

let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');

// Replace the main wrapper start
code = code.replace(
  'return (\n    <div className="space-y-6">',
  'return (\n    <div className="relative">\n      <div className={printEkstreModalOpen ? "print:hidden space-y-6" : "space-y-6"}>'
);

// Find the modal comment and insert closing div
code = code.replace(
  '      {/* A4 Ekstre Print Modal */}',
  '      </div>\n      {/* A4 Ekstre Print Modal */}'
);

fs.writeFileSync('pages/Cariler.tsx', code);

