const fs = require('fs');
let code = fs.readFileSync('pages/Cariler.tsx', 'utf8');

code = code.replace(
    /<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6 flex-shrink-0">/g,
    '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6 flex-shrink-0 flex flex-col max-h-[45vh]">'
);

code = code.replace(
    /<div className="overflow-x-auto">\s*<table className="w-full text-left">\s*<thead className="bg-gray-50\/50">/g,
    '<div className="overflow-auto relative">\n                  <table className="w-full text-left">\n                    <thead className="bg-gray-50/50 sticky top-0 z-10 shadow-sm">'
);

// We should also make sure the main history modal has flex-1 on the transactions area so they share space nicely, or at least flex-1 overflow-y-auto.
code = code.replace(
    /<div className="p-4 sm:p-6 overflow-y-auto">/g,
    '<div className="p-4 sm:p-6 overflow-y-auto flex-1">'
);

fs.writeFileSync('pages/Cariler.tsx', code);
