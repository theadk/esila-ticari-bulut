const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf8');

const target = "  receiptTemplate_showTaxInfo?: boolean;";
const newContent = "  receiptTemplate_showTaxInfo?: boolean;\n  customerDisplay_sliderInterval?: number;";

if (content.includes(target) && !content.includes('customerDisplay_sliderInterval')) {
  content = content.replace(target, newContent);
  fs.writeFileSync('types.ts', content);
  console.log("types.ts patched");
}
