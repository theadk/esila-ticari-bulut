const fs = require('fs');

let appCode = fs.readFileSync('App.tsx', 'utf8');
appCode = appCode.replace(
  "body { overflow: visible !important; }",
  "body { overflow: visible !important; }\n          html, body, #root { height: auto !important; }\n          .h-screen { height: auto !important; }\n          .overflow-hidden { overflow: visible !important; }\n          .overflow-y-auto { overflow: visible !important; }"
);
fs.writeFileSync('App.tsx', appCode);

let carilerCode = fs.readFileSync('pages/Cariler.tsx', 'utf8');
carilerCode = carilerCode.replace(
  '<div className="space-y-6">',
  '<div className="space-y-6 print:m-0 print:p-0">'
);
carilerCode = carilerCode.replace(
  '<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">',
  '<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">'
);
carilerCode = carilerCode.replace(
  '{/* Metrics */}',
  '<div className="no-print">\n      {/* Metrics */}'
);

// We need to properly wrap the rest of the page in no-print except the modal, but the modal is rendered at the end of the file.
