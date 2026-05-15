import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace static grid columns to responsive grid columns
  content = content.replace(/grid-cols-2/g, 'grid-cols-1 md:grid-cols-2');
  content = content.replace(/grid-cols-3/g, 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3');
  content = content.replace(/grid-cols-4/g, 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4');
  
  // Some modals might need responsive width / padding
  // Let's replace "flex-row justify-between items-start sm:items-center" which we already have in some places
  
  fs.writeFileSync(filePath, content);
}
console.log("Done modifying responsive grids");
