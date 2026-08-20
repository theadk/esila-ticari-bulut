const fs = require('fs');

let carilerCode = fs.readFileSync('pages/Cariler.tsx', 'utf8');

carilerCode = carilerCode.replace(
  '<div className="fixed inset-0 bg-gray-500/75 z-50 flex items-start justify-center p-4 sm:p-6 shadow-2xl backdrop-blur-sm overflow-y-auto print:bg-white print:p-0 print:m-0 animate-fade-in print:block">',
  '<div className="fixed inset-0 bg-gray-500/75 z-50 flex items-start justify-center p-4 sm:p-6 shadow-2xl backdrop-blur-sm overflow-y-auto print:bg-white print:p-0 print:m-0 animate-fade-in print:block print:relative print:h-auto print:overflow-visible">'
);

carilerCode = carilerCode.replace(
  '<div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-4xl mb-8 print:shadow-none print:max-w-full print:m-0 print:rounded-none">',
  '<div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-4xl mb-8 print:shadow-none print:max-w-full print:m-0 print:rounded-none print:block">'
);

fs.writeFileSync('pages/Cariler.tsx', carilerCode);

