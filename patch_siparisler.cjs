const fs = require('fs');
let code = fs.readFileSync('pages/Siparisler.tsx', 'utf8');

// 1. Add expectedDeliveryDate to customerInfo or as a separate state
code = code.replace(
  "const [notes, setNotes] = useState('');",
  "const [notes, setNotes] = useState('');\n  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');"
);

code = code.replace(
  "clearForm, notes, setNotes, totals",
  "clearForm, notes, setNotes, expectedDeliveryDate, setExpectedDeliveryDate, totals"
);

code = code.replace(
  "clearForm = () => {",
  "clearForm = () => {\n    setExpectedDeliveryDate('');"
);

code = code.replace(
  "notes, setNotes,\n    totals",
  "notes, setNotes,\n    expectedDeliveryDate, setExpectedDeliveryDate,\n    totals"
);

code = code.replace(
  /const newOrder: Order = \{[^}]*\n\s*id:[^,]+,\n\s*customerId:[^,]+,\n\s*customerName:[^,]+,\n\s*date:[^,]+,/m,
  "$& \n      expectedDeliveryDate: expectedDeliveryDate || undefined,"
);

// We need a better regex for newOrder. Let's just find newOrder: Order = {
code = code.replace(
  "const newOrder: Order = {",
  "const newOrder: Order = {\n        expectedDeliveryDate: expectedDeliveryDate || undefined,"
);

// Add the input field next to the address in the form
const inputHtml = `
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beklenen Teslimat</label>
                    <input 
                      type="date" 
                      value={expectedDeliveryDate}
                      onChange={e => setExpectedDeliveryDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors outline-none"
                    />
                  </div>`;
code = code.replace(
  /<div className="md:col-span-2">\s*<label className="block text-sm font-medium text-gray-700 mb-1">Adres<\/label>/m,
  '<div className="md:col-span-2 xl:col-span-1">\n                    <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>'
);
code = code.replace(
  /placeholder="Teslimat adresi"\s*\/>\s*<\/div>/m,
  `placeholder="Teslimat adresi"\n                    />\n                  </div>${inputHtml}`
);

fs.writeFileSync('pages/Siparisler.tsx', code);
