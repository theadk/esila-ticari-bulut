const fs = require('fs');

function addPrintTarget(filePath, searchStr, replaceStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(filePath, content);
  console.log("Patched " + filePath);
}

// Cariler.tsx
addPrintTarget(
  'pages/Cariler.tsx',
  '<div className="fixed inset-0 bg-gray-500/75 z-50 flex items-start justify-center p-4 sm:p-6 shadow-2xl backdrop-blur-sm overflow-y-auto print:bg-white print:p-0 print:m-0 animate-fade-in print:block print:relative print:h-auto print:overflow-visible">',
  '<div className="print-target fixed inset-0 bg-gray-500/75 z-50 flex items-start justify-center p-4 sm:p-6 shadow-2xl backdrop-blur-sm overflow-y-auto print:bg-white print:p-0 print:m-0 animate-fade-in print:block print:relative print:h-auto print:overflow-visible">'
);

// Personel.tsx
addPrintTarget(
  'pages/Personel.tsx',
  '<div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-4xl mb-8 print:shadow-none print:max-w-full print:m-0 print:rounded-none">',
  '<div className="print-target bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-4xl mb-8 print:shadow-none print:max-w-full print:m-0 print:rounded-none">'
);

// EFatura.tsx
addPrintTarget(
  'pages/EFatura.tsx',
  '<div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:max-w-full print:m-0 print:rounded-none print:block print:overflow-visible">',
  '<div className="print-target bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:max-w-full print:m-0 print:rounded-none print:block print:overflow-visible">'
);

