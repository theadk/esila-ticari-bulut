const fs = require('fs');

let appCode = fs.readFileSync('App.tsx', 'utf8');

appCode = appCode.replace(
  '<div className="flex h-screen bg-gray-50 overflow-hidden">',
  '<div className="flex h-screen bg-gray-50 overflow-hidden print:block">'
);

appCode = appCode.replace(
  '<div className="flex-1 flex flex-col min-w-0 no-print-margin transition-all duration-300 w-full overflow-hidden">',
  '<div className="flex-1 flex flex-col min-w-0 no-print-margin transition-all duration-300 w-full overflow-hidden print:block">'
);

appCode = appCode.replace(
  '<main className="flex-1 flex flex-col p-4 md:p-8 overflow-auto">',
  '<main className="flex-1 flex flex-col p-4 md:p-8 overflow-auto print:block print:p-0 print:m-0">'
);

fs.writeFileSync('App.tsx', appCode);

