const fs = require('fs');

function addPrintTarget(filePath, searchStr, replaceStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(filePath, content);
  console.log("Patched " + filePath);
}

// Kasa.tsx A4 Report Print Modal
addPrintTarget(
  'pages/Kasa.tsx',
  '<div className="fixed inset-0 bg-gray-500/75 z-50 flex items-start justify-center p-4 sm:p-4 sm:p-6 shadow-2xl backdrop-blur-sm overflow-y-auto print:bg-white print:p-0 print:m-0 animate-fade-in print:block">',
  '<div className="print-target fixed inset-0 bg-gray-500/75 z-50 flex items-start justify-center p-4 sm:p-4 sm:p-6 shadow-2xl backdrop-blur-sm overflow-y-auto print:bg-white print:p-0 print:m-0 animate-fade-in print:block print:relative print:h-auto print:overflow-visible">'
);

