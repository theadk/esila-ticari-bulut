const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');

code = code.replace(
  '<div className="h-full flex flex-col lg:flex-row overflow-hidden">',
  '<div className="h-full flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">'
);

code = code.replace(
  '<div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">',
  '<div className="flex-1 flex flex-col lg:h-full lg:overflow-y-auto p-4 lg:p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 shrink-0">'
);

code = code.replace(
  '{/* Right Column: Order Summary (Cart) */}\n            <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-sm z-20">',
  '{/* Right Column: Order Summary (Cart) */}\n            <div className="w-full lg:w-96 bg-white lg:border-l border-t lg:border-t-0 border-gray-200 flex flex-col lg:h-full shadow-sm z-20 shrink-0">'
);

fs.writeFileSync('pages/Siparisler.tsx', code);
console.log("Patched successfully");
