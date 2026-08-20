const fs = require('fs');
let code = fs.readFileSync('pages/SatinAlma.tsx', 'utf8');

code = code.replace(
  "newItems[idx].productId = e.target.value;\n                            setMalKabulForm({...malKabulForm, items: newItems});",
  "newItems[idx].productId = e.target.value;\n                            const selectedProd = products.find(p => p.id === e.target.value);\n                            if (selectedProd) {\n                               newItems[idx].price = selectedProd.supplierPrice || selectedProd.price || 0;\n                            }\n                            setMalKabulForm({...malKabulForm, items: newItems});"
);

fs.writeFileSync('pages/SatinAlma.tsx', code);
