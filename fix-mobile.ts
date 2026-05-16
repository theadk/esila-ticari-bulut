import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix header flex direction (usually flex justify-between -> flex-col sm:flex-row ...)
  content = content.replace(/className="flex justify-between items-center mb-6"/g, 'className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"');
  content = content.replace(/className="flex justify-between items-center mb-8"/g, 'className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"');
  
  // Fix general "flex gap-4" or similar at the top of pages (actions)
  content = content.replace(/className="flex gap-4"/g, 'className="flex flex-wrap gap-4"');
  content = content.replace(/className="flex gap-2"/g, 'className="flex flex-wrap gap-2"');

  // Fix specific search/action bars
  content = content.replace(/className="flex items-center gap-4"/g, 'className="flex flex-wrap items-center gap-4"');
  content = content.replace(/className="flex items-center justify-between mb-6"/g, 'className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"');

  // Change specific modal dialog padding for mobile friendliness
  content = content.replace(/p-6/g, 'p-4 sm:p-6');
  content = content.replace(/p-8/g, 'p-4 md:p-8');

  // Ensure full width on selects and inputs inside modals if they were somehow missing w-full
  // Fix search bar size specifically:
  content = content.replace(/max-w-md/g, 'max-w-full sm:max-w-md');
  content = content.replace(/max-w-lg/g, 'max-w-full sm:max-w-lg');
  content = content.replace(/max-w-xl/g, 'max-w-full sm:max-w-xl');
  content = content.replace(/max-w-2xl/g, 'max-w-full sm:max-w-2xl');
  content = content.replace(/max-w-3xl/g, 'max-w-full sm:max-w-3xl');
  content = content.replace(/max-w-4xl/g, 'max-w-full sm:max-w-4xl');

  // Replace all table wrappers correctly with overflow-x-auto
  content = content.replace(/className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto"/g, 'className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto"'); // just to check

  fs.writeFileSync(filePath, content);
}
console.log("Mobile layout patches applied");
