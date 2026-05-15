import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Actually, I can just replace all "grid-cols-" garbage
  // Let's just find `className="grid ... "` and re-evaluate, or just regex it.
  content = content.replace(/grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-4/g, 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');
  content = content.replace(/grid-cols-1 lg:grid-cols-1 md:grid-cols-2/g, 'grid-cols-1 lg:grid-cols-2');
  
  // Clean up any remaining multiple "grid-cols-1"
  content = content.replace(/grid-cols-1\s+md:grid-cols-1/g, 'grid-cols-1');
  content = content.replace(/grid-cols-1\s+sm:grid-cols-2\s+md:grid-cols-[1-4]\s+sm:grid-cols-2/g, 'grid-cols-1 sm:grid-cols-2');
  content = content.replace(/grid-cols-1\s+md:grid-cols-1\s+md:grid-cols-2/g, 'grid-cols-1 md:grid-cols-2');
  content = content.replace(/grid-cols-1\s+md:grid-cols-2\s+lg:grid-cols-1\s+sm:grid-cols-2\s+md:grid-cols-4/g, 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');

  fs.writeFileSync(filePath, content);
}
console.log("Done fixing messy grids part 2");
