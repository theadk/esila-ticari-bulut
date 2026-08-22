const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');

// Replace standard flex wrappers with print overrides
code = code.replace(
    /className="flex flex-col h-\[calc\(100vh-4rem\)\] bg-gray-50\/50"/g,
    'className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50/50 print:h-auto print:bg-white"'
);

code = code.replace(
    /className="flex-1 overflow-hidden"/g,
    'className="flex-1 overflow-hidden print:overflow-visible"'
);

code = code.replace(
    /className="h-full p-6 overflow-y-auto bg-gray-50\/50"/g,
    'className="h-full p-6 overflow-y-auto bg-gray-50/50 print:h-auto print:overflow-visible print:p-0 print:bg-white"'
);

code = code.replace(
    /className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col"/g,
    'className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col print:border-none print:shadow-none print:overflow-visible"'
);

// We need to hide the search bar area on print
code = code.replace(
    /<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">/g,
    '<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto print:hidden">'
);

// We need to hide the top header of Siparisler on print
code = code.replace(
    /<div className="flex-none px-6 py-4 border-b border-gray-200 bg-white shadow-sm flex items-center justify-between z-10">/g,
    '<div className="flex-none px-6 py-4 border-b border-gray-200 bg-white shadow-sm flex items-center justify-between z-10 print:hidden">'
);

code = code.replace(
    /className="overflow-x-auto"/g,
    'className="overflow-x-auto print:overflow-visible"'
);

fs.writeFileSync('pages/Siparisler.tsx', code);
